const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const std = (arr, m) => 
    Math.sqrt(arr.reduce((s, x) => s + Math.pow(x - m, 2), 0) / (arr.length || 1));

export const mlPredictStub = ({ history }) => {
    const amounts = history.map((h) => Number(h.amount)).filter((n) => !isNaN(n));
    if (amounts.length < 3) {
        const m = mean(amounts);
        return {
            predicted_spend: Math.round(m),
            volatility_score: 0.3,
            trend: "stable",
            confidence: 0.4,
        };
    }

    const m = mean(amounts);
    const s = std(amounts, m);

    const trend =
        amounts[amounts.length - 1] > amounts[0] * 1.05
            ? "up"
            : amounts[amounts.length - 1] < amounts[0] * 0.95
            ? "down"
            : "stable";

    const volatility = Math.min(1, Math.max(0, s / (m || 1)));

    const predicted = 
        trend === "up"
            ? m * 1.08 : trend === "down" ? m * 0.92 : m;
        
    return {
        predicted_spend: Math.round(predicted),
        volatility_score: Number(volatility.toFixed(2)),
        trend,
        confidence: 0.75,
    };
};