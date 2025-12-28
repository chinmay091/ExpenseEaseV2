import {
    createExpense,
    updateExpenseCategory,
    deleteExpenseById,
    getExpensesByUserId,
    getExpenseSummaryByUserId,
    getMonthlyExpenseSummaryByUserId,
    getCategoryMonthlySummary
} from "../services/expense.service.js";

export const createExpenseController = async (req, res) => {
    try {
        const { userId, amount, description, type, categoryId } = req.body;

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

        const expense = await createExpense({ userId, amount, description, type, categoryId });

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

export const updateExpenseCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense id is required",
      });
    }

    const expense = await updateExpenseCategory(id, categoryId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update expense category",
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

    const summary = await getMonthlyExpenseSummaryByUserId(userId, year);

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

export const getCategoryMonthlySummaryController = async (req, res) => {
  try {
    const { userId, year } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query param is required",
      });
    }

    const summary = await getCategoryMonthlySummary(userId, year);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category monthly summary",
    });
  }
};
