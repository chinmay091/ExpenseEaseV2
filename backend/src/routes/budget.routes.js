import { Router } from "express";
import {
    generateBudgetsController,
    getBudgetsController
} from "../controllers/budget.controller.js";
import { budgetGenerateLimiter, llmLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.get("/", getBudgetsController);
router.post("/generate", budgetGenerateLimiter, llmLimiter, generateBudgetsController);

export default router;
