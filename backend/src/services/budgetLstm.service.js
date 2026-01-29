/**
 * LSTM Budget Prediction Service - ONNX Runtime
 * Predicts next month's spending based on historical data
 */

import * as ort from "onnxruntime-node";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const SEQUENCE_LENGTH = 6;
const MODEL_PATH = process.env.BUDGET_LSTM_MODEL_PATH ||
    path.join(PROJECT_ROOT, "ML/budget-service/models/budget_lstm.onnx");
const SCALERS_PATH = process.env.BUDGET_LSTM_SCALERS_PATH ||
    path.join(PROJECT_ROOT, "ML/budget-service/models/scalers.json");

let session = null;
let scalers = null;
let modelLoaded = false;

const loadModel = async () => {
    if (modelLoaded) return session !== null;

    try {
        if (!fs.existsSync(MODEL_PATH) || !fs.existsSync(SCALERS_PATH)) {
            console.log("[BudgetLSTM] Model files not found, using fallback");
            modelLoaded = true;
            return false;
        }

        session = await ort.InferenceSession.create(MODEL_PATH, {
            executionProviders: ['cpu'],
        });
        scalers = JSON.parse(fs.readFileSync(SCALERS_PATH, 'utf8'));
        modelLoaded = true;
        console.log("[BudgetLSTM] ONNX model loaded successfully");
        return true;
    } catch (error) {
        console.error("[BudgetLSTM] Failed to load model:", error.message);
        modelLoaded = true;
        return false;
    }
};

const scaleInput = (value, featureIndex) => {
    const min = scalers.scaler_X.min[featureIndex];
    const scale = scalers.scaler_X.scale[featureIndex];
    return (value - min) * scale;
};

const unscaleOutput = (scaledValue) => {
    const min = scalers.scaler_y.min;
    const dataRange = scalers.scaler_y.data_range;
    return scaledValue * dataRange + min;
};

const calculateTrend = (amounts) => {
    if (amounts.length < 2) return "stable";
    const n = amounts.length;
    const xMean = (n - 1) / 2;
    const yMean = amounts.reduce((a, b) => a + b, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (i - xMean) * (amounts[i] - yMean);
        den += (i - xMean) ** 2;
    }

    const slope = den !== 0 ? num / den : 0;
    const relSlope = yMean !== 0 ? slope / yMean : 0;

    return relSlope > 0.05 ? "up" : relSlope < -0.05 ? "down" : "stable";
};

const calculateVolatility = (amounts) => {
    if (amounts.length < 2) return 0.5;
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (mean === 0) return 0.5;
    const variance = amounts.reduce((sum, val) => sum + (val - mean) ** 2, 0) / amounts.length;
    return Math.min(Math.sqrt(variance) / mean, 1.0);
};

const calculateConfidence = (historyLen, volatility, usingModel) => {
    const h = Math.min(historyLen / 12, 1.0);
    const v = 1 - volatility;
    const m = usingModel ? 0.85 : 0.6;
    return Math.round((h * 0.3 + v * 0.3 + m * 0.4) * 100) / 100;
};

const fallbackPrediction = (amounts) => {
    if (!amounts.length) {
        return { predicted_spend: 0, trend: "stable", volatility_score: 0.5, confidence: 0.15, method: "no_data" };
    }

    let ewma = amounts[0];
    for (const val of amounts.slice(1)) {
        ewma = 0.3 * val + 0.7 * ewma;
    }

    const trend = calculateTrend(amounts);
    const mult = { up: 1.05, down: 0.95, stable: 1.0 }[trend];
    const vol = calculateVolatility(amounts);

    return {
        predicted_spend: Math.round(ewma * mult * 100) / 100,
        trend,
        volatility_score: Math.round(vol * 100) / 100,
        confidence: Math.round(calculateConfidence(amounts.length, vol, false) * 0.8 * 100) / 100,
        method: "ewma_fallback"
    };
};

export const predictBudget = async (history, income = null) => {
    const amounts = history
        .filter(h => h.y != null)
        .map(h => parseFloat(h.y));

    if (!amounts.length) return fallbackPrediction([]);

    await loadModel();

    if (!session || amounts.length < SEQUENCE_LENGTH) {
        return fallbackPrediction(amounts);
    }

    try {
        const latest = amounts.slice(-SEQUENCE_LENGTH);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const incomeProxy = income || avg * 1.5;

        // Build feature matrix [1, 6, 9]
        const features = new Float32Array(SEQUENCE_LENGTH * 9);
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            const amt = latest[i];
            const row = [
                incomeProxy,      // monthly_income
                amt,              // monthly_expense_total
                0.2,              // savings_rate
                700,              // credit_score
                0.3,              // debt_to_income_ratio
                amt * 0.3,        // discretionary_spending
                amt * 0.7,        // essential_spending
                0,                // category_encoded
                0                 // scenario_encoded
            ];

            for (let j = 0; j < 9; j++) {
                features[i * 9 + j] = scaleInput(row[j], j);
            }
        }

        const inputTensor = new ort.Tensor('float32', features, [1, SEQUENCE_LENGTH, 9]);
        const output = await session.run({ input: inputTensor });
        const scaledPred = output.output.data[0];
        const predicted = unscaleOutput(scaledPred);

        const trend = calculateTrend(amounts);
        const vol = calculateVolatility(amounts);

        return {
            predicted_spend: Math.round(predicted * 100) / 100,
            trend,
            volatility_score: Math.round(vol * 100) / 100,
            confidence: calculateConfidence(amounts.length, vol, true),
            method: "lstm"
        };
    } catch (error) {
        console.error("[BudgetLSTM] Inference error:", error.message);
        return fallbackPrediction(amounts);
    }
};

export const getBudgetLstmConfig = () => ({
    modelPath: MODEL_PATH,
    scalersPath: SCALERS_PATH,
    modelLoaded: modelLoaded && session !== null,
    sequenceLength: SEQUENCE_LENGTH
});
