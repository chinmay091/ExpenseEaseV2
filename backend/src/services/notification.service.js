import { Expo } from "expo-server-sdk";
import { Device, User, Budget, Expense, Category, Bill } from "../models/index.js";
import { Op, fn, col } from "sequelize";

const expo = new Expo();

export const registerDevice = async (userId, pushToken, platform) => {
    const existing = await Device.findOne({ where: { pushToken } });

    if (existing) {
        if (existing.userId !== userId) {
            existing.userId = userId;
            existing.isActive = true;
            await existing.save();
        }
        return existing;
    }

    return Device.create({ userId, pushToken, platform, isActive: true });
};

export const unregisterDevice = async (pushToken) => {
    const device = await Device.findOne({ where: { pushToken } });
    if (device) {
        device.isActive = false;
        await device.save();
    }
    return device;
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
    const devices = await Device.findAll({
        where: { userId, isActive: true },
    });

    if (!devices.length) return { sent: 0 };

    const messages = devices
        .filter((d) => Expo.isExpoPushToken(d.pushToken))
        .map((d) => ({
            to: d.pushToken,
            sound: "default",
            title,
            body,
            data,
        }));

    if (!messages.length) return { sent: 0 };

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error("[NOTIFICATION] Send error:", error);
        }
    }

    return { sent: tickets.length, tickets };
};

export const sendBulkNotifications = async (notifications) => {
    const messages = [];

    for (const { userId, title, body, data } of notifications) {
        const devices = await Device.findAll({
            where: { userId, isActive: true },
        });

        for (const device of devices) {
            if (Expo.isExpoPushToken(device.pushToken)) {
                messages.push({
                    to: device.pushToken,
                    sound: "default",
                    title,
                    body,
                    data: data || {},
                });
            }
        }
    }

    if (!messages.length) return { sent: 0 };

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error("[NOTIFICATION] Bulk send error:", error);
        }
    }

    return { sent: tickets.length };
};

export const checkBudgetWarnings = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const budgets = await Budget.findAll({
        where: { period: "monthly" },
        include: [
            { model: Category, attributes: ["name"] },
            { model: User, attributes: ["id", "name"] },
        ],
    });

    const notifications = [];

    for (const budget of budgets) {
        const spent = await Expense.sum("amount", {
            where: {
                userId: budget.userId,
                categoryId: budget.categoryId,
                type: "debit",
                createdAt: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth },
            },
        });

        const limit = Number(budget.monthlyLimit);
        const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;

        if (usagePercent >= 90 && usagePercent < 100) {
            notifications.push({
                userId: budget.userId,
                title: "⚠️ Budget Warning",
                body: `You've used ${Math.round(usagePercent)}% of your ${budget.Category?.name} budget`,
                data: { type: "budget_warning", categoryId: budget.categoryId },
            });
        }
    }

    if (notifications.length > 0) {
        await sendBulkNotifications(notifications);
    }

    return { checked: budgets.length, warnings: notifications.length };
};

export const checkBillReminders = async () => {
    const today = new Date();
    const currentDay = today.getDate();

    const bills = await Bill.findAll({
        where: { isActive: true, isPaid: false },
        include: [{ model: User, attributes: ["id", "name"] }],
    });

    const notifications = [];

    for (const bill of bills) {
        const daysUntilDue = bill.dueDay - currentDay;

        if (daysUntilDue === bill.reminderDays || daysUntilDue === 1 || daysUntilDue === 0) {
            let body = "";
            if (daysUntilDue === 0) {
                body = `${bill.name} (₹${Number(bill.amount).toLocaleString()}) is due today!`;
            } else if (daysUntilDue === 1) {
                body = `${bill.name} (₹${Number(bill.amount).toLocaleString()}) is due tomorrow`;
            } else {
                body = `${bill.name} (₹${Number(bill.amount).toLocaleString()}) is due in ${daysUntilDue} days`;
            }

            notifications.push({
                userId: bill.userId,
                title: "📅 Bill Reminder",
                body,
                data: { type: "bill_reminder", billId: bill.id },
            });
        }
    }

    if (notifications.length > 0) {
        await sendBulkNotifications(notifications);
    }

    return { checked: bills.length, reminders: notifications.length };
};

export const checkAnomalies = async (userId, expense) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const avgResult = await Expense.findOne({
        where: {
            userId,
            categoryId: expense.categoryId,
            type: "debit",
            createdAt: { [Op.gte]: thirtyDaysAgo },
            id: { [Op.ne]: expense.id },
        },
        attributes: [[fn("AVG", col("amount")), "avgAmount"]],
    });

    const avgAmount = Number(avgResult?.get("avgAmount")) || 0;
    const currentAmount = Number(expense.amount);

    if (avgAmount > 0 && currentAmount > avgAmount * 3) {
        const category = await Category.findByPk(expense.categoryId);
        await sendPushNotification(
            userId,
            "🔔 Unusual Transaction",
            `₹${currentAmount.toLocaleString()} on ${category?.name || "this category"} is ${Math.round(currentAmount / avgAmount)}x your average`,
            { type: "anomaly", expenseId: expense.id }
        );
        return true;
    }

    return false;
};

export const sendWeeklySummary = async (userId) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const totalSpent = await Expense.sum("amount", {
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: weekAgo },
        },
    }) || 0;

    const topCategory = await Expense.findOne({
        where: {
            userId,
            type: "debit",
            createdAt: { [Op.gte]: weekAgo },
        },
        include: [{ model: Category, attributes: ["name"] }],
        attributes: [
            "categoryId",
            [fn("SUM", col("Expense.amount")), "total"],
        ],
        group: ["categoryId", "Category.id"],
        order: [[fn("SUM", col("Expense.amount")), "DESC"]],
        limit: 1,
    });

    const categoryName = topCategory?.Category?.name || "various categories";

    await sendPushNotification(
        userId,
        "📊 Weekly Spending Summary",
        `You spent ₹${totalSpent.toLocaleString()} this week. Top category: ${categoryName}`,
        { type: "weekly_summary" }
    );
};
