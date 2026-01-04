import {
    createGoal,
    getGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
    addContribution,
    getContributions,
} from "../services/goal.service.js";

export const createGoalHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, targetAmount, autoSavePercent, deadline, icon, color } = req.body;

        if (!name || !targetAmount) {
            return res.status(400).json({
                success: false,
                message: "Name and target amount are required",
            });
        }

        if (targetAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Target amount must be greater than 0",
            });
        }

        if (autoSavePercent !== undefined && (autoSavePercent < 0 || autoSavePercent > 100)) {
            return res.status(400).json({
                success: false,
                message: "Auto-save percent must be between 0 and 100",
            });
        }

        const goal = await createGoal({
            userId,
            name,
            description,
            targetAmount,
            autoSavePercent,
            deadline,
            icon,
            color,
        });

        return res.status(201).json({
            success: true,
            data: goal,
        });
    } catch (error) {
        console.error("Create goal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create goal",
        });
    }
};

export const getGoalsHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const goals = await getGoals(userId, status);

        return res.status(200).json({
            success: true,
            data: goals,
        });
    } catch (error) {
        console.error("Get goals error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch goals",
        });
    }
};

export const getGoalByIdHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const goal = await getGoalById(id, userId);

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: "Goal not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: goal,
        });
    } catch (error) {
        console.error("Get goal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch goal",
        });
    }
};

export const updateGoalHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        if (updates.autoSavePercent !== undefined &&
            (updates.autoSavePercent < 0 || updates.autoSavePercent > 100)) {
            return res.status(400).json({
                success: false,
                message: "Auto-save percent must be between 0 and 100",
            });
        }

        const goal = await updateGoal(id, userId, updates);

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: "Goal not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: goal,
        });
    } catch (error) {
        console.error("Update goal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update goal",
        });
    }
};

export const deleteGoalHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleted = await deleteGoal(id, userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Goal not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Goal deleted successfully",
        });
    } catch (error) {
        console.error("Delete goal error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete goal",
        });
    }
};

export const addContributionHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { amount, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0",
            });
        }

        const result = await addContribution(id, userId, { amount, note });

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.error === "GOAL_NOT_FOUND"
                    ? "Goal not found or already completed"
                    : "Failed to add contribution",
            });
        }

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Add contribution error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add contribution",
        });
    }
};

export const getContributionsHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const contributions = await getContributions(id, userId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        if (contributions === null) {
            return res.status(404).json({
                success: false,
                message: "Goal not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: contributions,
        });
    } catch (error) {
        console.error("Get contributions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contributions",
        });
    }
};
