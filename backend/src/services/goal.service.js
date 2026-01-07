import { Goal, GoalContribution, Expense } from "../models/index.js";
import { Op } from "sequelize";

const parseDeadline = (deadline) => {
    if (!deadline || typeof deadline !== "string") return null;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(deadline.trim())) return null;
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return null;
    return deadline.trim();
};

export const createGoal = async ({
    userId,
    name,
    description,
    targetAmount,
    autoSavePercent,
    deadline,
    icon,
    color,
}) => {
    const goal = await Goal.create({
        userId,
        name,
        description,
        targetAmount,
        autoSavePercent: autoSavePercent || null,
        deadline: parseDeadline(deadline),
        icon: icon || "🎯",
        color: color || "#4F46E5",
    });
    return goal;
};

export const getGoals = async (userId, status = null) => {
    const where = { userId };
    if (status) {
        where.status = status;
    }

    const goals = await Goal.findAll({
        where,
        order: [["createdAt", "DESC"]],
    });

    return goals.map((goal) => formatGoalWithProgress(goal));
};

export const getGoalById = async (goalId, userId) => {
    const goal = await Goal.findOne({
        where: { id: goalId, userId },
        include: [
            {
                model: GoalContribution,
                as: "contributions",
                order: [["createdAt", "DESC"]],
                limit: 50,
            },
        ],
    });

    if (!goal) return null;

    return {
        ...formatGoalWithProgress(goal),
        contributions: goal.contributions,
    };
};

export const updateGoal = async (goalId, userId, updates) => {
    const goal = await Goal.findOne({
        where: { id: goalId, userId },
    });

    if (!goal) return null;

    const allowedUpdates = [
        "name",
        "description",
        "targetAmount",
        "autoSavePercent",
        "deadline",
        "icon",
        "color",
        "status",
    ];

    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            goal[key] = updates[key];
        }
    }

    if (Number(goal.currentAmount) >= Number(goal.targetAmount) && goal.status === "active") {
        goal.status = "completed";
        goal.completedAt = new Date();
    }

    await goal.save();
    return formatGoalWithProgress(goal);
};

export const deleteGoal = async (goalId, userId) => {
    const deleted = await Goal.destroy({
        where: { id: goalId, userId },
    });
    return deleted > 0;
};

export const addContribution = async (goalId, userId, { amount, note }) => {
    const goal = await Goal.findOne({
        where: { id: goalId, userId, status: "active" },
    });

    if (!goal) return { success: false, error: "GOAL_NOT_FOUND" };

    const contribution = await GoalContribution.create({
        goalId,
        amount,
        note: note || null,
        isAutomatic: false,
    });

    goal.currentAmount = Number(goal.currentAmount) + Number(amount);

    if (Number(goal.currentAmount) >= Number(goal.targetAmount)) {
        goal.status = "completed";
        goal.completedAt = new Date();
    }

    await goal.save();

    return {
        success: true,
        contribution,
        goal: formatGoalWithProgress(goal),
    };
};

export const getContributions = async (goalId, userId, { limit = 50, offset = 0 } = {}) => {
    const goal = await Goal.findOne({
        where: { id: goalId, userId },
        attributes: ["id"],
    });

    if (!goal) return null;

    const contributions = await GoalContribution.findAll({
        where: { goalId },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    return contributions;
};

export const processAutoContribution = async (userId, incomeAmount, expenseId) => {
    const goals = await Goal.findAll({
        where: {
            userId,
            status: "active",
            autoSavePercent: { [Op.gt]: 0 },
        },
    });

    if (!goals.length) return [];

    const contributions = [];

    for (const goal of goals) {
        const percent = Number(goal.autoSavePercent);
        const contributionAmount = (incomeAmount * percent) / 100;

        if (contributionAmount <= 0) continue;

        const contribution = await GoalContribution.create({
            goalId: goal.id,
            amount: contributionAmount.toFixed(2),
            note: `Auto-saved ${percent}% of income`,
            isAutomatic: true,
            expenseId,
        });

        goal.currentAmount = Number(goal.currentAmount) + contributionAmount;

        if (Number(goal.currentAmount) >= Number(goal.targetAmount)) {
            goal.status = "completed";
            goal.completedAt = new Date();
        }

        await goal.save();

        contributions.push({
            goalId: goal.id,
            goalName: goal.name,
            amount: contributionAmount,
        });
    }

    return contributions;
};

export const autoContributeToGoals = async (userId) => {
    console.log(`[GOAL] Auto-contribution check for user ${userId}`);
    return [];
};

const formatGoalWithProgress = (goal) => {
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    const progress = target > 0 ? (current / target) * 100 : 0;

    let daysRemaining = null;
    if (goal.deadline) {
        const today = new Date();
        const deadline = new Date(goal.deadline);
        daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    }

    let monthlyRequired = null;
    if (goal.deadline && goal.status === "active" && daysRemaining > 0) {
        const remaining = target - current;
        const monthsRemaining = daysRemaining / 30;
        monthlyRequired = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
    }

    return {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        targetAmount: target,
        currentAmount: current,
        autoSavePercent: goal.autoSavePercent ? Number(goal.autoSavePercent) : null,
        deadline: goal.deadline,
        status: goal.status,
        icon: goal.icon,
        color: goal.color,
        completedAt: goal.completedAt,
        createdAt: goal.createdAt,
        progress: Number(progress.toFixed(2)),
        remaining: Math.max(target - current, 0),
        daysRemaining,
        monthlyRequired: monthlyRequired ? Number(monthlyRequired.toFixed(2)) : null,
    };
};
