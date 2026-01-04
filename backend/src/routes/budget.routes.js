import { Router } from "express";
import {
    generateBudgetsController,
    getBudgetsController
} from "../controllers/budget.controller.js";

const router = Router();

router.get("/", getBudgetsController);
router.post("/generate", generateBudgetsController);

export default router;
