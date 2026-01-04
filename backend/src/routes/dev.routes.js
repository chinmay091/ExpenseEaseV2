import { Router } from "express";
import { generateSyntheticExpensesController } from "../controllers/dev.controller.js";

const router = Router();

router.post("/generate-expenses", generateSyntheticExpensesController);

export default router;
