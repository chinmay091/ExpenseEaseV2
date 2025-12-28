import { generateSyntheticExpenses } from "../services/devExpensegenerator.service.js";

export const generateSyntheticExpensesController = async (req, res) => {
  try {
    const { userId, months, profile } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const expenses = await generateSyntheticExpenses({
      userId,
      months,
      profile,
    });

    return res.status(201).json({
      success: true,
      count: expenses.length,
      message: "Synthetic expenses generated",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
