const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const std = (arr, m) =>
    Math.sqrt(arr.reduce((s, x) => s + Math.pow(x - m, 2), 0) / (arr.length || 1));

const CATEGORY_VOLATILITY_THRESHOLDS = {
    "Food": { low: 0.15, medium: 0.30, high: 0.50 },
    "Transport": { low: 0.20, medium: 0.40, high: 0.60 },
    "Entertainment": { low: 0.30, medium: 0.50, high: 0.70 },
    "Shopping": { low: 0.35, medium: 0.55, high: 0.75 },
    "Bills": { low: 0.10, medium: 0.20, high: 0.35 },
    "Healthcare": { low: 0.40, medium: 0.60, high: 0.80 },
    "Travel": { low: 0.50, medium: 0.70, high: 0.90 },
    "default": { low: 0.25, medium: 0.45, high: 0.65 },
};

const SEASONAL_MULTIPLIERS = {
    1: 0.90,   // January - post-holiday dip
    2: 0.95,
    3: 1.00,
    4: 1.00,
    5: 1.05,   // May - summer starts
    6: 1.05,
    7: 1.00,
    8: 1.00,
    9: 1.05,   // September - back to school
    10: 1.10,  // October - festive season starts (Dussehra/Diwali prep)
    11: 1.25,  // November - Diwali peak
    12: 1.15,  // December - year-end spending
};

const calculateEWMA = (amounts, alpha = 0.3) => {
    if (amounts.length === 0) return 0;
    if (amounts.length === 1) return amounts[0];

    let ewma = amounts[0];
    for (let i = 1; i < amounts.length; i++) {
        ewma = alpha * amounts[i] + (1 - alpha) * ewma;
    }
    return ewma;
};

const detectTrend = (amounts) => {
    if (amounts.length < 3) return "stable";

    const recentHalf = amounts.slice(-Math.ceil(amounts.length / 2));
    const olderHalf = amounts.slice(0, Math.floor(amounts.length / 2));

    const recentMean = mean(recentHalf);
    const olderMean = mean(olderHalf);

    const changePercent = (recentMean - olderMean) / (olderMean || 1);

    if (changePercent > 0.10) return "up";
    if (changePercent < -0.10) return "down";
    return "stable";
};

const calculateDynamicConfidence = (amounts, volatility, dataPoints) => {
    let confidence = 0.3;

    if (dataPoints >= 12) confidence += 0.35;
    else if (dataPoints >= 6) confidence += 0.25;
    else if (dataPoints >= 3) confidence += 0.15;

    if (volatility < 0.2) confidence += 0.20;
    else if (volatility < 0.4) confidence += 0.10;
    else if (volatility > 0.6) confidence -= 0.10;

    const recentAmounts = amounts.slice(-3);
    if (recentAmounts.length >= 2) {
        const recentStd = std(recentAmounts, mean(recentAmounts));
        const recentVolatility = recentStd / (mean(recentAmounts) || 1);
        if (recentVolatility < 0.15) confidence += 0.10;
    }

    return Math.max(0.2, Math.min(0.95, confidence));
};

const getSeasonalMultiplier = (targetMonth = null) => {
    const month = targetMonth || (new Date().getMonth() + 1);
    return SEASONAL_MULTIPLIERS[month] || 1.0;
};

const getCategoryThresholds = (category) => {
    return CATEGORY_VOLATILITY_THRESHOLDS[category] || CATEGORY_VOLATILITY_THRESHOLDS["default"];
};

const classifyVolatility = (volatilityScore, category) => {
    const thresholds = getCategoryThresholds(category);
    if (volatilityScore <= thresholds.low) return "low";
    if (volatilityScore <= thresholds.medium) return "medium";
    return "high";
};

export const mlPredictStub = ({ history, category = "default", targetMonth = null }) => {
    const amounts = history.map((h) => Number(h.amount)).filter((n) => !isNaN(n) && n > 0);

    if (amounts.length === 0) {
        return {
            predicted_spend: 0,
            volatility_score: 0.5,
            volatility_class: "medium",
            trend: "stable",
            confidence: 0.2,
            method: "no_data",
        };
    }

    if (amounts.length < 3) {
        const m = mean(amounts);
        const seasonal = getSeasonalMultiplier(targetMonth);
        return {
            predicted_spend: Math.round(m * seasonal),
            volatility_score: 0.4,
            volatility_class: "medium",
            trend: "stable",
            confidence: 0.35,
            method: "insufficient_data",
            seasonal_factor: seasonal,
        };
    }

    const simpleMean = mean(amounts);
    const ewma = calculateEWMA(amounts, 0.35);
    const s = std(amounts, simpleMean);
    const volatility = Math.min(1, Math.max(0, s / (simpleMean || 1)));

    const trend = detectTrend(amounts);

    let basePrediction = ewma * 0.6 + simpleMean * 0.4;

    if (trend === "up") basePrediction *= 1.05;
    else if (trend === "down") basePrediction *= 0.95;

    const seasonal = getSeasonalMultiplier(targetMonth);
    const seasonalPrediction = basePrediction * seasonal;

    if (volatility > 0.5) {
        basePrediction = seasonalPrediction * (1 + volatility * 0.1);
    } else {
        basePrediction = seasonalPrediction;
    }

    const confidence = calculateDynamicConfidence(amounts, volatility, amounts.length);
    const volatilityClass = classifyVolatility(volatility, category);

    return {
        predicted_spend: Math.round(basePrediction),
        volatility_score: Number(volatility.toFixed(3)),
        volatility_class: volatilityClass,
        trend,
        confidence: Number(confidence.toFixed(2)),
        method: "enhanced_ewma",
        seasonal_factor: seasonal,
        data_points: amounts.length,
        ewma_value: Math.round(ewma),
        simple_mean: Math.round(simpleMean),
    };
};

export const getCategoryVolatilityThresholds = () => CATEGORY_VOLATILITY_THRESHOLDS;
export const getSeasonalMultipliers = () => SEASONAL_MULTIPLIERS;