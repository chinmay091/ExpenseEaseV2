import * as groupService from "../services/group.service.js";
import { createGroupSchema, addMemberSchema, addExpenseSchema, settleSchema } from "../validator/group.schema.js";
import { ZodError } from "zod";

export const create = async (req, res) => {
    try {
        const value = createGroupSchema.parse(req.body);

        const group = await groupService.createGroup({
            userId: req.user.id,
            ...value,
        });
        res.status(201).json(group);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("[GROUP] Create error:", error);
        res.status(500).json({ error: "Failed to create group" });
    }
};

export const getAll = async (req, res) => {
    try {
        const groups = await groupService.getGroupsForUser(req.user.id);
        res.json(groups);
    } catch (error) {
        console.error("[GROUP] GetAll error:", error);
        res.status(500).json({ error: "Failed to fetch groups" });
    }
};

export const getOne = async (req, res) => {
    try {
        const group = await groupService.getGroupById(req.params.id, req.user.id);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        res.json(group);
    } catch (error) {
        console.error("[GROUP] GetOne error:", error);
        res.status(500).json({ error: "Failed to fetch group" });
    }
};

export const addMember = async (req, res) => {
    try {
        const value = addMemberSchema.parse(req.body);

        const result = await groupService.addMember({
            groupId: req.params.id,
            userId: req.user.id,
            ...value,
        });
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        res.status(201).json(result.member);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("[GROUP] AddMember error:", error);
        res.status(500).json({ error: "Failed to add member" });
    }
};

export const respondInvite = async (req, res) => {
    try {
        const { accept } = req.body;
        const result = await groupService.respondToInvite(req.user.id, req.params.id, accept);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        res.json({ status: result.status });
    } catch (error) {
        console.error("[GROUP] RespondInvite error:", error);
        res.status(500).json({ error: "Failed to respond to invite" });
    }
};

export const addExpense = async (req, res) => {
    try {
        const value = addExpenseSchema.parse(req.body);

        const result = await groupService.addGroupExpense({
            groupId: req.params.id,
            ...value,
        });
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("[GROUP] AddExpense error:", error);
        res.status(500).json({ error: "Failed to add expense" });
    }
};

export const settle = async (req, res) => {
    try {
        const value = settleSchema.parse(req.body);

        const result = await groupService.settleSplit(value.splitId, value.memberId);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        res.json(result.split);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("[GROUP] Settle error:", error);
        res.status(500).json({ error: "Failed to settle" });
    }
};

export const getBalances = async (req, res) => {
    try {
        const balances = await groupService.getBalances(req.params.id);
        res.json(balances);
    } catch (error) {
        console.error("[GROUP] GetBalances error:", error);
        res.status(500).json({ error: "Failed to fetch balances" });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await groupService.deleteGroup(req.params.id, req.user.id);
        if (!result.success) {
            return res.status(403).json({ error: result.error });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("[GROUP] Remove error:", error);
        res.status(500).json({ error: "Failed to delete group" });
    }
};
