import { Router } from "express";
import { sendMessageHandler, getSuggestionsHandler } from "../controllers/chat.controller.js";
import { chatLimiter, llmLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/message", chatLimiter, llmLimiter, sendMessageHandler);
router.get("/suggestions", getSuggestionsHandler);

export default router;
