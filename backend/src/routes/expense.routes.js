import { Router } from "express";
import { createExpenseController, getExpensesByUserIdController, deleteExpenseByIdController, getExpenseSummaryByUserIdController, getMonthlyExpenseSummaryController } from "../controllers/expense.controller.js";

const router = Router();

router.post("/expenses", createExpenseController);
router.get("/expenses", getExpensesByUserIdController);
router.delete("/expenses/:id", deleteExpenseByIdController);
router.get("/expenses/summary", getExpenseSummaryByUserIdController);
router.get("/expenses/monthly-summary", getMonthlyExpenseSummaryController);

export default router;