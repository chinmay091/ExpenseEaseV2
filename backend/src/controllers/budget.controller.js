import { generateBudgetsForUser, getBudgetsWithUsage } from "../services/budget.service.js";

export const getBudgetsController = async (req, res) => {
  try {
    const { userId, month } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId query param is required",
      });
    }

    const data = await getBudgetsWithUsage(userId, month);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch budgets",
    });
  }
};

export const generateBudgetsController = async (req, res) => {
  try {
    const { userId, months, bufferPercent } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId required",
      });
    }

    const data = await generateBudgetsForUser({
      userId,
      months,
      bufferPercent,
    });

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error(error);
  }
};