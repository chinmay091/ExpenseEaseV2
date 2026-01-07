import { Expense, Category, Budget } from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const LLM_ENABLED = process.env.LLM_ENABLED === "true";

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0.5,
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 1,
});

export const getAnalytics = async (userId) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonthData, lastMonthData] = await Promise.all([
        getMonthSummary(userId, thisMonth, now),
        getMonthSummary(userId, lastMonth, endOfLastMonth),
    ]);

    const comparison = {
        spending: {
            current: thisMonthData.totalSpending,
            previous: lastMonthData.totalSpending,
            change: calculateChange(lastMonthData.totalSpending, thisMonthData.totalSpending),
        },
        income: {
            current: thisMonthData.totalIncome,
            previous: lastMonthData.totalIncome,
            change: calculateChange(lastMonthData.totalIncome, thisMonthData.totalIncome),
        },
    };

    const categoryComparison = compareCategorySpending(
        thisMonthData.categories,
        lastMonthData.categories
    );

    const trend = await getSpendingTrend(userId, 6);

    const insights = await generateInsights(userId, {
        comparison,
        categoryComparison,
        thisMonth: thisMonthData,
        lastMonth: lastMonthData,
        trend,
    });

    return {
        currentMonth: thisMonthData,
        lastMonth: lastMonthData,
        comparison,
        categoryComparison,
        trend,
        insights,
    };
};

const getMonthSummary = async (userId, startDate, endDate) => {
    const expenses = await Expense.findAll({
        where: {
            userId,
            createdAt: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        include: [{ model: Category, attributes: ["id", "name"] }],
    });

    const totalSpending = expenses
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalIncome = expenses
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const categoryMap = {};
    expenses
        .filter((e) => e.type === "debit")
        .forEach((e) => {
            const catName = e.Category?.name || "Uncategorized";
            categoryMap[catName] = (categoryMap[catName] || 0) + Number(e.amount);
        });

    const categories = Object.entries(categoryMap)
        .map(([name, amount]) => ({
            name,
            amount,
            percent: totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    return {
        totalSpending,
        totalIncome,
        netSavings: totalIncome - totalSpending,
        transactionCount: expenses.length,
        categories,
        topCategory: categories[0]?.name || null,
    };
};

const calculateChange = (previous, current) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

const compareCategorySpending = (currentCategories, previousCategories) => {
    const prevMap = {};
    previousCategories.forEach((c) => {
        prevMap[c.name] = c.amount;
    });

    return currentCategories.map((c) => {
        const prevAmount = prevMap[c.name] || 0;
        return {
            name: c.name,
            current: c.amount,
            previous: prevAmount,
            change: calculateChange(prevAmount, c.amount),
        };
    });
};

const getSpendingTrend = async (userId, months) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const result = await Expense.findAll({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
        },
        attributes: [
            [fn("DATE_TRUNC", "month", col("createdAt")), "month"],
            [fn("SUM", col("amount")), "total"],
        ],
        group: ["month"],
        order: [[literal("month"), "ASC"]],
    });

    return result.map((r) => ({
        month: r.get("month").toISOString().slice(0, 7),
        total: Number(r.get("total")),
    }));
};

const generateInsights = async (userId, data) => {
    const insights = [];

    const spendChange = data.comparison.spending.change;
    if (spendChange > 10) {
        insights.push({
            type: "warning",
            title: "Spending Up",
            text: `You're spending ${Math.abs(spendChange).toFixed(0)}% more than last month`,
        });
    } else if (spendChange < -10) {
        insights.push({
            type: "success",
            title: "Great Job!",
            text: `You've reduced spending by ${Math.abs(spendChange).toFixed(0)}% compared to last month`,
        });
    }

    const topIncreases = data.categoryComparison
        .filter((c) => c.change > 20 && c.current > 500)
        .slice(0, 2);

    topIncreases.forEach((c) => {
        insights.push({
            type: "info",
            title: `${c.name} Increased`,
            text: `${c.name} spending is up ${c.change.toFixed(0)}% (₹${c.current.toLocaleString()})`,
        });
    });

    if (data.thisMonth.netSavings > 0) {
        insights.push({
            type: "success",
            title: "Positive Savings",
            text: `You've saved ₹${data.thisMonth.netSavings.toLocaleString()} this month`,
        });
    } else if (data.thisMonth.netSavings < 0) {
        insights.push({
            type: "warning",
            title: "Overspending",
            text: `You're spending ₹${Math.abs(data.thisMonth.netSavings).toLocaleString()} more than your income`,
        });
    }

    if (LLM_ENABLED && insights.length < 3) {
        try {
            const aiInsight = await generateAIInsight(data);
            if (aiInsight) {
                insights.push({ type: "info", title: "AI Insight", text: aiInsight });
            }
        } catch (error) {
            console.error("[ANALYTICS] AI insight error:", error.message);
        }
    }

    return insights.slice(0, 5);
};

const generateAIInsight = async (data) => {
    const prompt = `Based on this financial data, give ONE brief, actionable insight (max 20 words):
- This month spending: ₹${data.thisMonth.totalSpending}
- Last month spending: ₹${data.lastMonth.totalSpending}
- Top category: ${data.thisMonth.topCategory}
- Change: ${data.comparison.spending.change.toFixed(0)}%`;

    const response = await llm.invoke(prompt);
    return typeof response.content === "string" ? response.content.trim() : null;
};

export const getMerchantSuggestions = async (description) => {
    const merchantMap = {
        swiggy: { category: "Food", merchant: "Swiggy" },
        zomato: { category: "Food", merchant: "Zomato" },
        uber: { category: "Transport", merchant: "Uber" },
        ola: { category: "Transport", merchant: "Ola" },
        amazon: { category: "Shopping", merchant: "Amazon" },
        flipkart: { category: "Shopping", merchant: "Flipkart" },
        netflix: { category: "Entertainment", merchant: "Netflix" },
        spotify: { category: "Entertainment", merchant: "Spotify" },
        gpay: { category: "Transfer", merchant: "Google Pay" },
        phonepe: { category: "Transfer", merchant: "PhonePe" },
        paytm: { category: "Transfer", merchant: "Paytm" },
    };

    const lowerDesc = description.toLowerCase();

    for (const [keyword, info] of Object.entries(merchantMap)) {
        if (lowerDesc.includes(keyword)) {
            return info;
        }
    }

    return null;
};
