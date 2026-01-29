import { predictBudget, getBudgetLstmConfig } from "../services/budgetLstm.service.js";

export const mlPredictController = async (req, res) => {
    try {
        const { history, category } = req.body;

        if (!Array.isArray(history)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ML payload - history must be an array",
            });
        }

        const formattedHistory = history.map(h => ({
            ds: h.month || h.ds,
            y: h.amount || h.y
        }));

        const result = await predictBudget(formattedHistory);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("[ML] Predict error:", error);
        return res.status(500).json({
            success: false,
            message: "Prediction failed",
        });
    }
};

export const getConfigController = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: getBudgetLstmConfig(),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get config",
        });
    }
};
