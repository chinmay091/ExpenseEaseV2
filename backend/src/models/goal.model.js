import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Goal = sequelize.define(
    "Goal",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id",
            references: {
                model: "users",
                key: "id",
                onDelete: "CASCADE",
            },
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        targetAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            field: "target_amount",
        },

        currentAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: "current_amount",
        },

        // Auto-save percentage of income (0-100)
        autoSavePercent: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: null,
            field: "auto_save_percent",
            validate: {
                min: 0,
                max: 100,
            },
        },

        deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM("active", "completed", "cancelled"),
            allowNull: false,
            defaultValue: "active",
        },

        icon: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "🎯",
        },

        color: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "#4F46E5",
        },

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at",
        },
    },
    {
        tableName: "goals",
        timestamps: true,
        indexes: [
            {
                fields: ["user_id", "status"],
            },
        ],
    }
);

const GoalContribution = sequelize.define(
    "GoalContribution",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },

        goalId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "goal_id",
            references: {
                model: "goals",
                key: "id",
                onDelete: "CASCADE",
            },
        },

        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        // Track if this was auto-contributed from income
        isAutomatic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_automatic",
        },

        // Link to the income expense that triggered this (if automatic)
        expenseId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "expense_id",
            references: {
                model: "expenses",
                key: "id",
                onDelete: "SET NULL",
            },
        },
    },
    {
        tableName: "goal_contributions",
        timestamps: true,
        updatedAt: false, // Contributions are immutable
    }
);

// Associations
Goal.hasMany(GoalContribution, { foreignKey: "goalId", as: "contributions" });
GoalContribution.belongsTo(Goal, { foreignKey: "goalId" });

export { Goal, GoalContribution };
