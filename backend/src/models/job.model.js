import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Job = sequelize.define(
    "Job",
    {
        id: {
            type: DataTypes.STRING(50),
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
        type: {
            type: DataTypes.ENUM("budget", "ocr", "insights"),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
            allowNull: false,
            defaultValue: "pending",
        },
        result: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at",
        },
    },
    {
        tableName: "jobs",
        timestamps: true,
        indexes: [
            {
                fields: ["user_id", "status"],
            },
            {
                fields: ["type", "status"],
            },
        ],
    }
);

export default Job;
