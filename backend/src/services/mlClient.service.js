/**
 * ML Client Service - Budget Prediction
 * Uses embedded LSTM ONNX model with built-in EWMA fallback
 */

import { predictBudget, getBudgetLstmConfig } from "./budgetLstm.service.js";

export const getMlSignals = async ({ userId, category, history }) => {
    const formattedHistory = history.map(h => ({
        ds: h.month,
        y: h.amount
    }));

    try {
        const result = await predictBudget(formattedHistory);

        console.log("[ML] Response:", {
            category,
            predicted_spend: result.predicted_spend,
            trend: result.trend,
            confidence: result.confidence,
            method: result.method
        });

        if (result.confidence < 0.4) {
            console.log("[ML] Discarded low confidence:", result.confidence);
            return null;
        }

        return {
            predicted_spend: result.predicted_spend,
            volatility_score: result.volatility_score,
            trend: result.trend
        };

    } catch (error) {
        console.warn("[ML] Error:", error.message);
        return null;
    }
};

export const getMlConfig = () => getBudgetLstmConfig();