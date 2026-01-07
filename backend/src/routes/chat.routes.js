import { Router } from "express";
import { sendMessageHandler, getSuggestionsHandler } from "../controllers/chat.controller.js";

const router = Router();

router.post("/message", sendMessageHandler);
router.get("/suggestions", getSuggestionsHandler);

export default router;
