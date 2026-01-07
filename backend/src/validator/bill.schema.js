import { z } from "zod";

export const createBillSchema = z.object({
    name: z.string().min(1).max(100),
    amount: z.number().positive(),
    dueDay: z.number().int().min(1).max(31),
    frequency: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
    reminderDays: z.number().int().min(0).max(30).default(3),
    categoryId: z.string().uuid().nullish(),
});

export const updateBillSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
    frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
    reminderDays: z.number().int().min(0).max(30).optional(),
    categoryId: z.string().uuid().nullish(),
    isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});

export const validateCreateBill = (data) => createBillSchema.parse(data);
export const validateUpdateBill = (data) => updateBillSchema.parse(data);
