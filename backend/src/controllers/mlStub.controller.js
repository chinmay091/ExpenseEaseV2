import { mlPredictStub, getCategoryVolatilityThresholds, getSeasonalMultipliers } from "../services/mLStub.service.js";

export const mlPredictController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, currency, history, targetMonth } = req.body;

        if (!userId || !category || !currency || !Array.isArray(history)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ML payload",
            });
        }

        const result = mlPredictStub({ history, category, targetMonth });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to predict",
        });
    }
};

export const getConfigController = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                categoryThresholds: getCategoryVolatilityThresholds(),
                seasonalMultipliers: getSeasonalMultipliers(),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get config",
        });
    }
};