import { Router } from "express";
import { createExpenseController, getExpensesByUserIdController, deleteExpenseByIdController } from "../controllers/expense.controller.js";

const router = Router();

router.post("/expenses", createExpenseController);
router.get("/expenses", getExpensesByUserIdController);
router.delete("/expenses/:id", deleteExpenseByIdController);

export default router;