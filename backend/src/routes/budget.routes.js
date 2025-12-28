import { Router } from "express";
import { generateBudgetsController, getBudgetsController } from "../controllers/budget.controller.js";

const router = Router();

router.get("/budgets", getBudgetsController);
router.post("/budgets/generate", generateBudgetsController);

export default router;
