import { z } from "zod";

export const createGroupSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).nullish(),
    icon: z.string().max(10).default("👥"),
});

export const addMemberSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().nullish(),
    phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/).nullish(),
}).refine(data => data.email || data.phone, {
    message: "Either email or phone is required",
});

export const addExpenseSchema = z.object({
    paidById: z.string().uuid(),
    amount: z.number().positive(),
    description: z.string().min(1).max(200),
    splitType: z.enum(["equal", "exact", "percent"]).default("equal"),
    splits: z.array(z.object({
        memberId: z.string().uuid(),
        amount: z.number().positive(),
    })).optional(),
});

export const settleSchema = z.object({
    splitId: z.string().uuid(),
    memberId: z.string().uuid(),
});

export const validateCreateGroup = (data) => createGroupSchema.parse(data);
export const validateAddMember = (data) => addMemberSchema.parse(data);
export const validateAddExpense = (data) => addExpenseSchema.parse(data);
export const validateSettle = (data) => settleSchema.parse(data);
