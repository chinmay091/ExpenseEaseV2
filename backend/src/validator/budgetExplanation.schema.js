import { z } from "zod";

export const BudgetExplanationSchema = z.object({
  category: z.string(),
  avgMonthlySpend: z.number().nonnegative(),
  suggestedBudget: z.number().positive(),
  mlUsed: z.boolean(),
  trend: z.enum(["up", "down", "stable"]).optional(),
  volatility: z.number().min(0).max(1).optional(),
  bufferPercent: z.number().min(0).max(100),
  monthsAnalyzed: z.number().min(1).max(24),
});

export const BudgetExplanationBatchSchema = z.array(
  BudgetExplanationSchema
);

export const validateBudgetExplanation = (data) =>
  BudgetExplanationSchema.parse(data);

export const validateBudgetExplanationBatch = (data) =>
  BudgetExplanationBatchSchema.parse(data);