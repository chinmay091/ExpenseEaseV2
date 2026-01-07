import * as billService from "../services/bill.service.js";

export const create = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, amount, dueDay, frequency, reminderDays, categoryId } = req.body;

        if (!name || !amount || !dueDay) {
            return res.status(400).json({ error: "name, amount, and dueDay are required" });
        }

        const bill = await billService.createBill({
            userId,
            name,
            amount,
            dueDay,
            frequency,
            reminderDays,
            categoryId,
        });

        res.status(201).json(bill);
    } catch (error) {
        console.error("[BILL] Create error:", error);
        res.status(500).json({ error: "Failed to create bill" });
    }
};

export const getAll = async (req, res) => {
    try {
        const bills = await billService.getBills(req.user.id);
        res.json(bills);
    } catch (error) {
        console.error("[BILL] GetAll error:", error);
        res.status(500).json({ error: "Failed to fetch bills" });
    }
};

export const getOne = async (req, res) => {
    try {
        const bill = await billService.getBillById(req.params.id, req.user.id);
        if (!bill) {
            return res.status(404).json({ error: "Bill not found" });
        }
        res.json(bill);
    } catch (error) {
        console.error("[BILL] GetOne error:", error);
        res.status(500).json({ error: "Failed to fetch bill" });
    }
};

export const update = async (req, res) => {
    try {
        const bill = await billService.updateBill(req.params.id, req.user.id, req.body);
        if (!bill) {
            return res.status(404).json({ error: "Bill not found" });
        }
        res.json(bill);
    } catch (error) {
        console.error("[BILL] Update error:", error);
        res.status(500).json({ error: "Failed to update bill" });
    }
};

export const remove = async (req, res) => {
    try {
        const deleted = await billService.deleteBill(req.params.id, req.user.id);
        if (!deleted) {
            return res.status(404).json({ error: "Bill not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("[BILL] Delete error:", error);
        res.status(500).json({ error: "Failed to delete bill" });
    }
};

export const markPaid = async (req, res) => {
    try {
        const result = await billService.markBillPaid(req.params.id, req.user.id);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        res.json(result);
    } catch (error) {
        console.error("[BILL] MarkPaid error:", error);
        res.status(500).json({ error: "Failed to mark bill as paid" });
    }
};

export const getUpcoming = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const bills = await billService.getUpcomingBills(req.user.id, days);
        res.json(bills);
    } catch (error) {
        console.error("[BILL] GetUpcoming error:", error);
        res.status(500).json({ error: "Failed to fetch upcoming bills" });
    }
};
