import { Bill, Expense, Category } from "../models/index.js";
import { Op } from "sequelize";

export const createBill = async ({ userId, name, amount, dueDay, frequency, reminderDays, categoryId }) => {
    return Bill.create({
        userId,
        name,
        amount,
        dueDay,
        frequency: frequency || "monthly",
        reminderDays: reminderDays || 3,
        categoryId: categoryId || null,
        isPaid: false,
        isActive: true,
    });
};

export const getBills = async (userId) => {
    return Bill.findAll({
        where: { userId, isActive: true },
        include: [{ model: Category, attributes: ["id", "name"] }],
        order: [["dueDay", "ASC"]],
    });
};

export const getBillById = async (billId, userId) => {
    return Bill.findOne({
        where: { id: billId, userId },
        include: [{ model: Category, attributes: ["id", "name"] }],
    });
};

export const updateBill = async (billId, userId, updates) => {
    const bill = await Bill.findOne({ where: { id: billId, userId } });
    if (!bill) return null;

    const allowedFields = ["name", "amount", "dueDay", "frequency", "reminderDays", "categoryId", "isActive"];
    for (const key of allowedFields) {
        if (updates[key] !== undefined) {
            bill[key] = updates[key];
        }
    }

    await bill.save();
    return bill;
};

export const deleteBill = async (billId, userId) => {
    const bill = await Bill.findOne({ where: { id: billId, userId } });
    if (!bill) return false;

    bill.isActive = false;
    await bill.save();
    return true;
};

export const markBillPaid = async (billId, userId) => {
    const bill = await Bill.findOne({
        where: { id: billId, userId },
        include: [{ model: Category, attributes: ["id", "name"] }],
    });

    if (!bill) return { success: false, error: "BILL_NOT_FOUND" };

    const expense = await Expense.create({
        userId,
        amount: bill.amount,
        description: `${bill.name} (Bill Payment)`,
        type: "debit",
        categoryId: bill.categoryId,
    });

    bill.isPaid = true;
    bill.lastPaidAt = new Date();
    await bill.save();

    if (bill.frequency === "monthly") {
        await resetBillForNextMonth(bill);
    }

    return { success: true, expense, bill };
};

const resetBillForNextMonth = async (bill) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    if (today.getDate() >= bill.dueDay) {
        bill.isPaid = false;
        await bill.save();
    }
};

export const getUpcomingBills = async (userId, days = 7) => {
    const today = new Date();
    const currentDay = today.getDate();

    const bills = await Bill.findAll({
        where: {
            userId,
            isActive: true,
            isPaid: false,
            dueDay: { [Op.between]: [currentDay, currentDay + days] },
        },
        include: [{ model: Category, attributes: ["id", "name"] }],
        order: [["dueDay", "ASC"]],
    });

    return bills.map((bill) => ({
        ...bill.toJSON(),
        daysUntilDue: bill.dueDay - currentDay,
    }));
};
