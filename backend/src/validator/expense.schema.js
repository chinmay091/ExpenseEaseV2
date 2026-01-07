import { z } from "zod";

export const createExpenseSchema = z.object({
    amount: z.number().positive(),
    description: z.string().min(1).max(500),
    type: z.enum(["debit", "credit"]).default("debit"),
    categoryId: z.string().uuid().nullish(),
    date: z.string().datetime().optional(),
    source: z.enum(["manual", "sms", "gmail", "scan"]).default("manual"),
});

export const updateExpenseSchema = z.object({
    amount: z.number().positive().optional(),
    description: z.string().min(1).max(500).optional(),
    type: z.enum(["debit", "credit"]).optional(),
    categoryId: z.string().uuid().nullish(),
    date: z.string().datetime().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});

export const bulkExpenseSchema = z.object({
    expenses: z.array(createExpenseSchema).min(1).max(100),
});

export const validateCreateExpense = (data) => createExpenseSchema.parse(data);
export const validateUpdateExpense = (data) => updateExpenseSchema.parse(data);
export const validateBulkExpense = (data) => bulkExpenseSchema.parse(data);
