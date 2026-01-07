import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { Expense, Budget, Category, Goal, GoalContribution } from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";

const LLM_ENABLED = process.env.LLM_ENABLED === "true";

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 2,
});

const getMonthlySpending = async (userId, month = null) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${targetMonth}-01`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const result = await Expense.findAll({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: start, [Op.lt]: end },
        },
        attributes: [[fn("SUM", col("amount")), "total"]],
    });

    const total = Number(result[0]?.get("total")) || 0;
    return { month: targetMonth, totalSpending: total };
};

const getCategoryBreakdown = async (userId, month = null) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${targetMonth}-01`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const result = await Expense.findAll({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: start, [Op.lt]: end },
        },
        include: [{ model: Category, attributes: ["name"] }],
        attributes: [
            [col("Expense.category_id"), "categoryId"],
            [fn("SUM", col("Expense.amount")), "total"],
        ],
        group: [col("Expense.category_id"), "Category.id"],
        order: [[literal("total"), "DESC"]],
    });

    return {
        month: targetMonth,
        categories: result.map((r) => ({
            category: r.Category?.name || "Uncategorized",
            amount: Number(r.get("total")),
        })),
    };
};

const getBudgetStatus = async (userId) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const budgets = await Budget.findAll({
        where: { userId, period: "monthly" },
        include: [{ model: Category, attributes: ["name"] }],
    });

    const spending = await Expense.findAll({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: start, [Op.lt]: end },
        },
        attributes: [
            [col("Expense.category_id"), "categoryId"],
            [fn("SUM", col("amount")), "spent"],
        ],
        group: [col("Expense.category_id")],
    });

    const spentMap = {};
    spending.forEach((r) => {
        spentMap[r.get("categoryId")] = Number(r.get("spent"));
    });

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    return {
        month: start.toISOString().slice(0, 7),
        daysRemaining,
        budgets: budgets.map((b) => {
            const limit = Number(b.monthlyLimit);
            const spent = spentMap[b.categoryId] || 0;
            const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;
            return {
                category: b.Category?.name || "Uncategorized",
                limit,
                spent,
                remaining: Math.max(limit - spent, 0),
                usagePercent: Number(usagePercent.toFixed(1)),
                status: usagePercent >= 100 ? "over" : usagePercent >= 80 ? "warning" : "ok",
            };
        }),
    };
};

const getGoalProgress = async (userId) => {
    const goals = await Goal.findAll({
        where: { userId },
        order: [["status", "ASC"], ["createdAt", "DESC"]],
    });

    return goals.map((g) => {
        const current = Number(g.currentAmount);
        const target = Number(g.targetAmount);
        const progress = target > 0 ? (current / target) * 100 : 0;

        let daysRemaining = null;
        if (g.deadline) {
            const deadline = new Date(g.deadline);
            daysRemaining = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        }

        return {
            name: g.name,
            target,
            current,
            progress: Number(progress.toFixed(1)),
            remaining: Math.max(target - current, 0),
            status: g.status,
            autoSavePercent: g.autoSavePercent ? Number(g.autoSavePercent) : null,
            daysRemaining,
        };
    });
};

const getSpendingTrend = async (userId, months = 6) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - months);

    const result = await Expense.findAll({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: start, [Op.lt]: end },
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

const getTopExpenses = async (userId, limit = 5, month = null) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${targetMonth}-01`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const expenses = await Expense.findAll({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: start, [Op.lt]: end },
        },
        include: [{ model: Category, attributes: ["name"] }],
        order: [["amount", "DESC"]],
        limit,
    });

    return {
        month: targetMonth,
        expenses: expenses.map((e) => ({
            description: e.description,
            amount: Number(e.amount),
            category: e.Category?.name || "Uncategorized",
            date: e.createdAt.toISOString().slice(0, 10),
        })),
    };
};

const getMonthlyIncome = async (userId, month = null) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${targetMonth}-01`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const result = await Expense.findAll({
        where: {
            userId,
            type: "credit",
            createdAt: { [Op.gte]: start, [Op.lt]: end },
        },
        attributes: [[fn("SUM", col("amount")), "total"]],
    });

    const total = Number(result[0]?.get("total")) || 0;
    return { month: targetMonth, totalIncome: total };
};

const buildUserContext = async (userId) => {
    const [spending, categories, budgets, goals, trend, income] = await Promise.all([
        getMonthlySpending(userId),
        getCategoryBreakdown(userId),
        getBudgetStatus(userId),
        getGoalProgress(userId),
        getSpendingTrend(userId, 3),
        getMonthlyIncome(userId),
    ]);

    return `
USER'S FINANCIAL DATA (as of ${new Date().toISOString().slice(0, 10)}):

CURRENT MONTH (${spending.month}):
- Total Spending: ₹${spending.totalSpending.toLocaleString()}
- Total Income: ₹${income.totalIncome.toLocaleString()}
- Days Remaining: ${budgets.daysRemaining}

SPENDING BY CATEGORY:
${categories.categories.map((c) => `- ${c.category}: ₹${c.amount.toLocaleString()}`).join("\n")}

BUDGET STATUS:
${budgets.budgets.map((b) => `- ${b.category}: ₹${b.spent.toLocaleString()} / ₹${b.limit.toLocaleString()} (${b.usagePercent}% used, ${b.status})`).join("\n")}

SAVINGS GOALS:
${goals.length > 0 ? goals.map((g) => `- ${g.name}: ₹${g.current.toLocaleString()} / ₹${g.target.toLocaleString()} (${g.progress}%${g.autoSavePercent ? `, auto-saving ${g.autoSavePercent}%` : ""}${g.daysRemaining ? `, ${g.daysRemaining} days left` : ""})`).join("\n") : "No goals set"}

SPENDING TREND (last 3 months):
${trend.map((t) => `- ${t.month}: ₹${t.total.toLocaleString()}`).join("\n")}
`.trim();
};

const SYSTEM_PROMPT = `You are a friendly and helpful personal finance assistant for an expense tracking app called ExpenseEase.

Your role is to:
1. Answer questions about the user's spending, budgets, and savings goals
2. Provide personalized insights and tips based on their actual data
3. Help them understand their financial patterns
4. Encourage good financial habits without being preachy

Guidelines:
- Always use the user's actual data provided in the context
- Use ₹ (Indian Rupee) for all amounts
- Be conversational and friendly, not robotic
- Keep responses concise (2-4 sentences usually)
- If asked something not in the data, say you don't have that information
- Celebrate wins (staying under budget, goal progress)
- Give gentle suggestions for improvement when relevant

You have access to the user's:
- Monthly spending and income
- Category-wise breakdown
- Budget limits and current usage
- Savings goals and progress
- Spending trends over time`;

const generateFallbackResponse = async (userId, userMessage) => {
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes("spend") || lowerMsg.includes("spending")) {
        const spending = await getMonthlySpending(userId);
        const categories = await getCategoryBreakdown(userId);
        const top = categories.categories.slice(0, 3);
        return `This month you've spent ₹${spending.totalSpending.toLocaleString()}. Top categories: ${top.map(c => `${c.category} (₹${c.amount.toLocaleString()})`).join(", ")}.`;
    }

    if (lowerMsg.includes("budget")) {
        const budgets = await getBudgetStatus(userId);
        const over = budgets.budgets.filter(b => b.status === "over");
        const warning = budgets.budgets.filter(b => b.status === "warning");
        if (over.length > 0) {
            return `⚠️ You're over budget in: ${over.map(b => b.category).join(", ")}. ${warning.length} categories are near their limits.`;
        }
        return `✅ All budgets are on track! ${budgets.daysRemaining} days left this month.`;
    }

    if (lowerMsg.includes("goal")) {
        const goals = await getGoalProgress(userId);
        if (goals.length === 0) return "You haven't set any savings goals yet. Create one in the Goals tab!";
        const active = goals.filter(g => g.status === "active");
        return active.map(g => `${g.name}: ₹${g.current.toLocaleString()} / ₹${g.target.toLocaleString()} (${g.progress}%)`).join("\n");
    }

    if (lowerMsg.includes("income")) {
        const income = await getMonthlyIncome(userId);
        return `Your income this month: ₹${income.totalIncome.toLocaleString()}`;
    }

    const spending = await getMonthlySpending(userId);
    const income = await getMonthlyIncome(userId);
    return `This month: Income ₹${income.totalIncome.toLocaleString()}, Spending ₹${spending.totalSpending.toLocaleString()}. Ask about budgets, goals, or spending for more details!`;
};

export const processMessage = async (userId, userMessage, conversationHistory = []) => {
    if (!LLM_ENABLED) {
        try {
            const fallbackMsg = await generateFallbackResponse(userId, userMessage);
            return { message: fallbackMsg, error: false };
        } catch (err) {
            return { message: "The AI assistant is currently disabled.", error: true };
        }
    }

    try {
        const userContext = await buildUserContext(userId);
        const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${userContext}`;

        const messages = [
            new SystemMessage(fullSystemPrompt),
            ...conversationHistory.map((msg) =>
                msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
            ),
            new HumanMessage(userMessage),
        ];

        const response = await llm.invoke(messages);

        const cleanedMessage = typeof response.content === "string"
            ? response.content.trim()
            : response.content;

        return {
            message: cleanedMessage,
            error: false,
        };
    } catch (error) {
        console.error("[CHAT] Error processing message:", error.message);

        if (error.message.includes("quota") || error.message.includes("429") || error.message.includes("rate")) {
            try {
                const fallbackMsg = await generateFallbackResponse(userId, userMessage);
                return { message: `⚡ AI is rate-limited. Here's what I found:\n\n${fallbackMsg}`, error: false };
            } catch (fallbackErr) {
                return { message: "AI quota exceeded. Please try again later.", error: true };
            }
        }

        return {
            message: "Sorry, I'm having trouble processing your request right now. Please try again.",
            error: true,
        };
    }
};

export const getSuggestedQuestions = () => {
    return [
        "How much did I spend this month?",
        "Am I on track with my budgets?",
        "What's my biggest expense category?",
        "How are my savings goals doing?",
        "Where can I cut spending?",
        "Show me my spending trend",
    ];
};
