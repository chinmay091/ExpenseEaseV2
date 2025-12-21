import { Expense, User } from "../models/index.js";

export const createExpense = async ({ userId, amount, description, type }) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const expense = await Expense.create({
        userId, amount, description, type
    });

    return expense;
};

export const getExpensesByUserId = async (userId) => {
    const expenses = await Expense.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
    });
    return expenses;
};

export const deleteExpenseById = async (id) => {
    const expense = await Expense.findByPk(id);

    if (!expense) return null;

    await expense.destroy();
    return expense;
};