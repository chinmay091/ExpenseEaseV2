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

const DEFAULT_SEASONAL_MULTIPLIERS = {
    1: 0.90, 2: 0.95, 3: 1.00, 4: 1.00,
    5: 1.05, 6: 1.05, 7: 1.00, 8: 1.00,
    9: 1.05, 10: 1.10, 11: 1.25, 12: 1.15,
};

const calculateUserSeasonalMultipliers = (history) => {
    if (!history || history.length < 6) return null;

    const monthlySpending = {};
    const monthCounts = {};

    history.forEach((h) => {
        const month = new Date(h.month + "-01").getMonth() + 1;
        const amount = Number(h.amount);
        if (!isNaN(amount) && month >= 1 && month <= 12) {
            monthlySpending[month] = (monthlySpending[month] || 0) + amount;
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        }
    });

    const monthlyAverages = {};
    Object.keys(monthlySpending).forEach((month) => {
        monthlyAverages[month] = monthlySpending[month] / monthCounts[month];
    });

    const allAverages = Object.values(monthlyAverages);
    if (allAverages.length < 3) return null;

    const overallMean = mean(allAverages);

    const multipliers = {};
    for (let month = 1; month <= 12; month++) {
        if (monthlyAverages[month]) {
            const rawMultiplier = monthlyAverages[month] / overallMean;
            multipliers[month] = Math.max(0.7, Math.min(1.5, rawMultiplier));
        } else {
            multipliers[month] = DEFAULT_SEASONAL_MULTIPLIERS[month];
        }
    }

    return multipliers;
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
    if (amounts.length < 3) return { trend: "stable", strength: 0 };

    const recentHalf = amounts.slice(-Math.ceil(amounts.length / 2));
    const olderHalf = amounts.slice(0, Math.floor(amounts.length / 2));

    const recentMean = mean(recentHalf);
    const olderMean = mean(olderHalf);

    const changePercent = (recentMean - olderMean) / (olderMean || 1);

    if (changePercent > 0.15) return { trend: "up", strength: Math.min(1, changePercent) };
    if (changePercent > 0.05) return { trend: "slight_up", strength: changePercent };
    if (changePercent < -0.15) return { trend: "down", strength: Math.min(1, Math.abs(changePercent)) };
    if (changePercent < -0.05) return { trend: "slight_down", strength: Math.abs(changePercent) };
    return { trend: "stable", strength: 0 };
};

const calculateDynamicConfidence = (amounts, volatility, dataPoints, hasSeasonalData) => {
    let confidence = 0.25;

    if (dataPoints >= 24) confidence += 0.35;
    else if (dataPoints >= 12) confidence += 0.30;
    else if (dataPoints >= 6) confidence += 0.20;
    else if (dataPoints >= 3) confidence += 0.10;

    if (volatility < 0.15) confidence += 0.20;
    else if (volatility < 0.30) confidence += 0.10;
    else if (volatility > 0.60) confidence -= 0.15;

    if (hasSeasonalData) confidence += 0.10;

    const recentAmounts = amounts.slice(-3);
    if (recentAmounts.length >= 2) {
        const recentStd = std(recentAmounts, mean(recentAmounts));
        const recentVolatility = recentStd / (mean(recentAmounts) || 1);
        if (recentVolatility < 0.10) confidence += 0.10;
        else if (recentVolatility > 0.40) confidence -= 0.05;
    }

    return Math.max(0.15, Math.min(0.95, confidence));
};

const getSeasonalMultiplier = (history, targetMonth = null) => {
    const month = targetMonth || (new Date().getMonth() + 1);

    const userMultipliers = calculateUserSeasonalMultipliers(history);

    if (userMultipliers && userMultipliers[month]) {
        return {
            value: Number(userMultipliers[month].toFixed(3)),
            source: "user_history",
            learned: true,
        };
    }

    return {
        value: DEFAULT_SEASONAL_MULTIPLIERS[month],
        source: "default",
        learned: false,
    };
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
            trend_strength: 0,
            confidence: 0.15,
            method: "no_data",
            seasonal: { value: 1.0, source: "none", learned: false },
        };
    }

    if (amounts.length < 3) {
        const m = mean(amounts);
        const seasonal = getSeasonalMultiplier(history, targetMonth);
        return {
            predicted_spend: Math.round(m * seasonal.value),
            volatility_score: 0.4,
            volatility_class: "medium",
            trend: "stable",
            trend_strength: 0,
            confidence: 0.30,
            method: "insufficient_data",
            seasonal,
            data_points: amounts.length,
        };
    }

    const simpleMean = mean(amounts);
    const ewma = calculateEWMA(amounts, 0.35);
    const s = std(amounts, simpleMean);
    const volatility = Math.min(1, Math.max(0, s / (simpleMean || 1)));

    const { trend, strength: trendStrength } = detectTrend(amounts);

    let basePrediction = ewma * 0.6 + simpleMean * 0.4;

    if (trend === "up") basePrediction *= (1 + 0.05 * (1 + trendStrength));
    else if (trend === "slight_up") basePrediction *= 1.03;
    else if (trend === "down") basePrediction *= (1 - 0.05 * (1 + trendStrength));
    else if (trend === "slight_down") basePrediction *= 0.97;

    const seasonal = getSeasonalMultiplier(history, targetMonth);
    const seasonalPrediction = basePrediction * seasonal.value;

    if (volatility > 0.5) {
        basePrediction = seasonalPrediction * (1 + volatility * 0.1);
    } else {
        basePrediction = seasonalPrediction;
    }

    const confidence = calculateDynamicConfidence(amounts, volatility, amounts.length, seasonal.learned);
    const volatilityClass = classifyVolatility(volatility, category);

    return {
        predicted_spend: Math.round(basePrediction),
        volatility_score: Number(volatility.toFixed(3)),
        volatility_class: volatilityClass,
        trend,
        trend_strength: Number(trendStrength.toFixed(2)),
        confidence: Number(confidence.toFixed(2)),
        method: seasonal.learned ? "ml_seasonal" : "enhanced_ewma",
        seasonal,
        data_points: amounts.length,
        ewma_value: Math.round(ewma),
        simple_mean: Math.round(simpleMean),
    };
};

export const getCategoryVolatilityThresholds = () => CATEGORY_VOLATILITY_THRESHOLDS;
export const getDefaultSeasonalMultipliers = () => DEFAULT_SEASONAL_MULTIPLIERS;
export const learnSeasonalMultipliers = calculateUserSeasonalMultipliers;