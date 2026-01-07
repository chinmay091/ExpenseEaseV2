import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Bill = sequelize.define("Bill", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    dueDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 31,
        },
    },
    frequency: {
        type: DataTypes.ENUM("weekly", "monthly", "yearly"),
        defaultValue: "monthly",
    },
    reminderDays: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    lastPaidAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});

export default Bill;
