import { registerDevice, unregisterDevice } from "../services/notification.service.js";

export const register = async (req, res) => {
    try {
        const { pushToken, platform } = req.body;
        const userId = req.user.id;

        if (!pushToken || !platform) {
            return res.status(400).json({ error: "pushToken and platform are required" });
        }

        const device = await registerDevice(userId, pushToken, platform);
        res.json({ success: true, deviceId: device.id });
    } catch (error) {
        console.error("[NOTIFICATION] Register error:", error);
        res.status(500).json({ error: "Failed to register device" });
    }
};

export const unregister = async (req, res) => {
    try {
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ error: "pushToken is required" });
        }

        await unregisterDevice(pushToken);
        res.json({ success: true });
    } catch (error) {
        console.error("[NOTIFICATION] Unregister error:", error);
        res.status(500).json({ error: "Failed to unregister device" });
    }
};
