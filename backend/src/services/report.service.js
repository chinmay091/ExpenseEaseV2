import { Expense, Category, Budget } from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";

export const getMonthlyReportData = async (userId, year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.findAll({
        where: {
            userId,
            createdAt: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        include: [{ model: Category, attributes: ["name"] }],
        order: [["createdAt", "DESC"]],
    });

    const debits = expenses.filter((e) => e.type === "debit");
    const credits = expenses.filter((e) => e.type === "credit");

    const totalSpending = debits.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = credits.reduce((sum, e) => sum + Number(e.amount), 0);
    const netSavings = totalIncome - totalSpending;

    const categoryMap = {};
    debits.forEach((e) => {
        const catName = e.Category?.name || "Uncategorized";
        categoryMap[catName] = (categoryMap[catName] || 0) + Number(e.amount);
    });

    const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, amount]) => ({
            name,
            amount,
            percent: totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    const budgets = await Budget.findAll({
        where: { userId },
        include: [{ model: Category, attributes: ["name"] }],
    });

    const budgetComparison = budgets.map((b) => {
        const catName = b.Category?.name || "Unknown";
        const spent = categoryMap[catName] || 0;
        const limit = Number(b.monthlyLimit);
        return {
            category: catName,
            budgeted: limit,
            spent,
            remaining: limit - spent,
            overBudget: spent > limit,
        };
    });

    return {
        period: `${year}-${String(month).padStart(2, "0")}`,
        periodName: new Date(year, month - 1).toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
        }),
        summary: {
            totalSpending,
            totalIncome,
            netSavings,
            transactionCount: expenses.length,
        },
        categoryBreakdown,
        budgetComparison,
        transactions: expenses.map((e) => ({
            date: e.createdAt.toISOString().slice(0, 10),
            description: e.description || "No description",
            category: e.Category?.name || "Uncategorized",
            type: e.type,
            amount: Number(e.amount),
        })),
    };
};

export const generateCSV = (reportData) => {
    const lines = [];

    lines.push(`Expense Report - ${reportData.periodName}`);
    lines.push("");

    lines.push("SUMMARY");
    lines.push(`Total Income,₹${reportData.summary.totalIncome.toLocaleString()}`);
    lines.push(`Total Spending,₹${reportData.summary.totalSpending.toLocaleString()}`);
    lines.push(`Net Savings,₹${reportData.summary.netSavings.toLocaleString()}`);
    lines.push(`Transactions,${reportData.summary.transactionCount}`);
    lines.push("");

    lines.push("SPENDING BY CATEGORY");
    lines.push("Category,Amount,Percentage");
    reportData.categoryBreakdown.forEach((c) => {
        lines.push(`${c.name},₹${c.amount.toLocaleString()},${c.percent}%`);
    });
    lines.push("");

    if (reportData.budgetComparison.length > 0) {
        lines.push("BUDGET VS ACTUAL");
        lines.push("Category,Budgeted,Spent,Remaining,Status");
        reportData.budgetComparison.forEach((b) => {
            const status = b.overBudget ? "OVER BUDGET" : "OK";
            lines.push(
                `${b.category},₹${b.budgeted.toLocaleString()},₹${b.spent.toLocaleString()},₹${b.remaining.toLocaleString()},${status}`
            );
        });
        lines.push("");
    }

    lines.push("ALL TRANSACTIONS");
    lines.push("Date,Description,Category,Type,Amount");
    reportData.transactions.forEach((t) => {
        const sign = t.type === "credit" ? "+" : "-";
        lines.push(
            `${t.date},"${t.description}",${t.category},${t.type.toUpperCase()},${sign}₹${t.amount.toLocaleString()}`
        );
    });

    return lines.join("\n");
};

export const getAvailablePeriods = async (userId) => {
    const expenses = await Expense.findAll({
        where: { userId },
        attributes: [[fn("DATE_TRUNC", "month", col("createdAt")), "month"]],
        group: ["month"],
        order: [[literal("month"), "DESC"]],
    });

    return expenses.map((e) => {
        const date = new Date(e.get("month"));
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: date.toLocaleString("en-IN", { month: "long", year: "numeric" }),
        };
    });
};
