import {
  createExpense,
  deleteExpenseById,
  getExpensesByUserId,
  getExpenseSummaryByUserId,
  getMonthlyExpenseSummaryByUserId,
  getCategoryMonthlySummary,
  updateExpense,
} from "../services/expense.service.js";
import { createExpenseSchema, updateExpenseSchema } from "../validator/expense.schema.js";
import { ZodError } from "zod";

export const createExpenseController = async (req, res) => {
  try {
    const value = createExpenseSchema.parse(req.body);

    const result = await createExpense({
      userId: req.user.id,
      ...value,
      skipDuplicate: req.body.skipDuplicate === true,
    });

    if (result && result.skipped) {
      return res.status(200).json({
        success: true,
        skipped: true,
        message: "Duplicate expense found - skipped",
      });
    }

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
};

export const updateExpenseController = async (req, res) => {
  try {
    const { id: expenseId } = req.params;

    if (!expenseId) {
      return res.status(404).json({
        success: false,
        message: "Expense id is required",
      });
    }

    const value = updateExpenseSchema.parse(req.body);

    const expense = await updateExpense({
      userId: req.user.id,
      expenseId,
      ...value,
    });

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
};

export const getExpensesByUserIdController = async (req, res) => {
  try {
    const expenses = await getExpensesByUserId(req.user.id);

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

    const deleted = await deleteExpenseById({ id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: deleted,
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
    const { from, to } = req.query;

    if ((from && !to) || (!from && to)) {
      return res.status(400).json({
        success: false,
        message: "Both from and to dates are required",
      });
    }

    const summary = await getExpenseSummaryByUserId(req.user.id, from, to);

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
