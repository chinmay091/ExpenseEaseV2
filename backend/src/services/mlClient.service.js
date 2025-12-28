import axios from "axios";

export const getMlSignals = async ({
    userId,
    category,
    history,
}) => {
    try {
    const res = await axios.post("http://localhost:5000/api/ml/predict", {
        userId,
        category,
        currency: "INR",
        history,
    });

    if (!res.data?.success) return null;

    const { predicted_spend, volatility_score, trend, confidence } = res.data.data;

    console.log("ML response before filter:", res.data.data);

    if (confidence < 0.4) {
        console.log("ML discarded due to low confidence");
        return null
    };

    return { predicted_spend, volatility_score, trend };
} catch (error) {
    console.warn("ML unavailable, falling back to rules");
    return null;
}
};