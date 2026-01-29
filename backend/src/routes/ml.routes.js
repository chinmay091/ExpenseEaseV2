import { Router } from "express";
import { mlPredictController, getConfigController } from "../controllers/ml.controller.js";
import { classifySingleMessage, getSmsParsingConfig } from "../services/sms.service.js";

const router = Router();

router.post("/predict", mlPredictController);
router.get("/config", getConfigController);

// SMS Classification Test Endpoint (no auth required for testing)
router.post("/test-sms", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Missing 'message' in request body"
            });
        }

        const result = await classifySingleMessage(message);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("[ML Test] Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get SMS ML config
router.get("/sms-config", (req, res) => {
    return res.status(200).json({
        success: true,
        data: getSmsParsingConfig()
    });
});

export default router;