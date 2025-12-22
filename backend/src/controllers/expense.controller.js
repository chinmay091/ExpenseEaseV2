import { createExpense, deleteExpenseById, getExpensesByUserId, getExpenseSummaryByUserId, getMonthlyExpenseSummaryByUserId } from "../services/expense.service.js";

export const createExpenseController = async (req, res) => {
    try {
        const { userId, amount, description, type } = req.body;

        if (!userId || !amount || !type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        if (!["credit", "debit"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense type",
            });
        }

        if (Number(amount) <= 0 || isNaN(Number(amount))) {
            return res.status(400).json({
                success: false,
                message: "Enter valid amount",
            });
        }

        const expense = await createExpense({ userId, amount, description, type });

        if (!expense) {
            return res.status(500).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(201).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to create expense",
        });
    }
};

export const getExpensesByUserIdController = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query param is required",
      });
    }

        const expenses = await getExpensesByUserId(userId);

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch expenses",
        });
    }
};

export const deleteExpenseByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense id is required",
      });
    }

        const deleted = await deleteExpenseById(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully",
            data: expense,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete expense",
        });
    }
};

export const getExpenseSummaryByUserIdController = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId query param is required",
            });
        }

        if ((from && !to) || (!from && to)) {
            return res.status(400).json({
                success: false,
                message: "Both from and to dates are required",
            });
        }

        const summary = await getExpenseSummaryByUserId(userId, from, to);

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch expense summary",
        });
    }
};

export const getMonthlyExpenseSummaryController = async (req, res) => {
  try {
    const { userId, year } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query param is required",
      });
    }

    const summary = await getMonthlyExpenseSummary(userId, year);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly expense summary",
    });
  }
};