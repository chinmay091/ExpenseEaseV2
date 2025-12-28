import { mlPredictStub } from "../services/mLStub.service.js";

export const mlPredictController = async (req, res) => {
    try {
        const { userId, category, currency, history } = req.body;

        if (!userId || !category || !currency || !Array.isArray(history)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ML payload",
            });
        }

        const result = mlPredictStub({ history });

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