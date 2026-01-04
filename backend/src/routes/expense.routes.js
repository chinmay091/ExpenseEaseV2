import { Router } from "express";
import {
    createExpenseController,
    updateExpenseController,
    getExpensesByUserIdController,
    deleteExpenseByIdController,
    getExpenseSummaryByUserIdController,
    getMonthlyExpenseSummaryController,
    getCategoryMonthlySummaryController
} from "../controllers/expense.controller.js";

const router = Router();

router.post("/", createExpenseController);
router.patch("/:id", updateExpenseController);
router.get("/", getExpensesByUserIdController);
router.delete("/:id", deleteExpenseByIdController);
router.get("/summary", getExpenseSummaryByUserIdController);
router.get("/monthly-summary", getMonthlyExpenseSummaryController);
router.get("/category-monthly-summary", getCategoryMonthlySummaryController);

export default router;