/**
 * ML Client Service - Budget Prediction
 * Uses embedded LSTM ONNX model for predictions
 */

import { predictBudget } from "./budgetLstm.service.js";
import { mlPredictStub } from "./mlStub.service.js";

export const getMlSignals = async ({ userId, category, history }) => {
    const formattedHistory = history.map(h => ({
        ds: h.month,
        y: h.amount
    }));

    try {
        const result = await predictBudget(formattedHistory);

        console.log("[ML] LSTM response:", {
            category,
            predicted_spend: result.predicted_spend,
            trend: result.trend,
            confidence: result.confidence,
            method: result.method
        });

        if (result.confidence < 0.4) {
            console.log("[ML] Discarded due to low confidence:", result.confidence);
            return null;
        }

        return {
            predicted_spend: result.predicted_spend,
            volatility_score: result.volatility_score,
            trend: result.trend
        };

    } catch (error) {
        console.warn("[ML] LSTM error:", error.message);
        return useFallback(history, category);
    }
};

const useFallback = (history, category) => {
    console.log("[ML] Using mlStub fallback for:", category);
    const result = mlPredictStub({ history, category });

    if (result.confidence < 0.4) return null;

    return {
        predicted_spend: result.predicted_spend,
        volatility_score: result.volatility_score,
        trend: result.trend
    };
};