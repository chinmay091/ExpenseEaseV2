import { Router } from "express";
import {
    createExpenseController,
    updateExpenseCategoryController,
    getExpensesByUserIdController,
    deleteExpenseByIdController,
    getExpenseSummaryByUserIdController,
    getMonthlyExpenseSummaryController,
    getCategoryMonthlySummaryController
} from "../controllers/expense.controller.js";

const router = Router();

router.post("/expenses", createExpenseController);
router.patch("/expenses/:id/category", updateExpenseCategoryController);
router.get("/expenses", getExpensesByUserIdController);
router.delete("/expenses/:id", deleteExpenseByIdController);
router.get("/expenses/summary", getExpenseSummaryByUserIdController);
router.get("/expenses/monthly-summary", getMonthlyExpenseSummaryController);
router.get("/expenses/category-monthly-summary", getCategoryMonthlySummaryController);


export default router;