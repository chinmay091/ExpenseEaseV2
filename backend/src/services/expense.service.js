import { Expense, User, Category } from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";
import { processAutoContribution } from "./goal.service.js";

export const createExpense = async ({
  userId,
  amount,
  description,
  type,
  categoryId,
  skipDuplicate = false,
}) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  if (skipDuplicate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingExpense = await Expense.findOne({
      where: {
        userId,
        amount: parseFloat(amount),
        type,
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    if (existingExpense) {
      return { skipped: true, reason: 'duplicate' };
    }
  }

  const expense = await Expense.create({
    userId,
    amount,
    description,
    type,
    categoryId,
  });

  if (type === "credit") {
    try {
      const contributions = await processAutoContribution(userId, amount, expense.id);
      if (contributions.length > 0) {
        console.log(`[EXPENSE] Auto-contributed to ${contributions.length} goals`);
      }
    } catch (err) {
      console.error("[EXPENSE] Auto-contribution failed:", err.message);
    }
  }

  return expense;
};

export const updateExpense = async ({
  userId,
  expenseId,
  amount,
  description,
  type,
  categoryId,
}) => {
  const expense = await Expense.findOne({
    where: {
      id: expenseId,
      userId,
    },
  });

  if (!expenseId) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  await expense.update({
    ...(amount !== undefined && { amount }),
    ...(description !== undefined && { description }),
    ...(type !== undefined && { type }),
    ...(categoryId !== undefined && { categoryId }),
  });

  return expense;
};

export const getExpensesByUserId = async (userId) => {
  const expenses = await Expense.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
  return expenses;
};

export const deleteExpenseById = async ({ id, userId }) => {
  const expense = await Expense.findOne({
    where: { id, userId }
  });

  if (!expense) return null;

  await expense.destroy();
  return expense;
};

export const getExpenseSummaryByUserId = async (userId, from, to) => {
  const whereClause = { userId };

  if (from || to) {
    whereClause.createdAt = {
      [Op.between]: [new Date(from), new Date(to)],
    };
  }

  const result = await Expense.findAll({
    where: whereClause,
    attributes: ["type", [fn("SUM", col("amount")), "total"]],
    group: ["type"],
  });

  let totalCredit = 0;
  let totalDebit = 0;

  result.forEach((row) => {
    const type = row.type;
    const total = Number(row.get("total"));

    if (type === "credit") totalCredit = total;
    if (type === "debit") totalDebit = total;
  });

  return { totalCredit, totalDebit, balance: totalCredit - totalDebit };
};

export const getMonthlyExpenseSummaryByUserId = async (userId, year) => {
  const whereClause = {
    userId,
  };

  if (year) {
    whereClause.createdAt = {
      [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
    };
  }

  const result = await Expense.findAll({
    where: whereClause,
    attributes: [
      [fn("DATE_TRUNC", "month", col("createdAt")), "month"],
      "type",
      [fn("SUM", col("amount")), "total"],
    ],
    group: ["month", "type"],
    order: [[literal("month"), "ASC"]],
  });

  const monthlyMap = {};

  result.forEach((row) => {
    const month = row.get("month").toISOString().slice(0, 7);
    const type = row.type;
    const total = Number(row.get("total"));

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        totalCredit: 0,
        totalDebit: 0,
        balance: 0,
      };
    }

    if (type === "credit") monthlyMap[month].totalCredit = total;
    if (type === "debit") monthlyMap[month].totalDebit = total;
  });

  return Object.values(monthlyMap).map((item) => ({
    ...item,
    balance: item.totalCredit - item.totalDebit,
  }));
};

export const getCategoryMonthlySummary = async (userId, year) => {
  const whereClause = {
    userId,
    type: "debit",
  };

  if (year) {
    whereClause.createdAt = {
      [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
    };
  }

  const result = await Expense.findAll({
    where: whereClause,
    include: [
      {
        model: Category,
        attributes: ["name"],
      },
    ],
    attributes: [
      [fn("DATE_TRUNC", "month", col("Expense.createdAt")), "month"],
      [fn("SUM", col("Expense.amount")), "total"],
    ],
    group: ["month", "Category.id"],
    order: [[literal("month"), "ASC"]],
  });

  return result.map((row) => ({
    month: row.get("month").toISOString().slice(0, 7),
    category: row.Category ? row.Category.name : "Uncategorized",
    totalDebit: Number(row.get("total")),
  }));
};
