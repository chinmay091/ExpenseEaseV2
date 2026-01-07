import { getAnalytics } from "../services/analytics.service.js";

export const get = async (req, res) => {
    try {
        const analytics = await getAnalytics(req.user.id);
        res.json(analytics);
    } catch (error) {
        console.error("[ANALYTICS] Error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};
