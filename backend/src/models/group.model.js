import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Group = sequelize.define("Group", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdById: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: "👥",
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});

const GroupMember = sequelize.define("GroupMember", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    groupId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("pending", "joined", "declined"),
        defaultValue: "pending",
    },
    balance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
    },
});

const GroupExpense = sequelize.define("GroupExpense", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    groupId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    paidById: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    splitType: {
        type: DataTypes.ENUM("equal", "exact", "percent"),
        defaultValue: "equal",
    },
});

const Split = sequelize.define("Split", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    groupExpenseId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    settled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    settledAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
});

Group.hasMany(GroupMember, { foreignKey: "groupId", as: "members" });
GroupMember.belongsTo(Group, { foreignKey: "groupId" });

Group.hasMany(GroupExpense, { foreignKey: "groupId", as: "expenses" });
GroupExpense.belongsTo(Group, { foreignKey: "groupId" });

GroupMember.hasMany(GroupExpense, { foreignKey: "paidById", as: "paidExpenses" });
GroupExpense.belongsTo(GroupMember, { foreignKey: "paidById", as: "paidBy" });

GroupExpense.hasMany(Split, { foreignKey: "groupExpenseId", as: "splits" });
Split.belongsTo(GroupExpense, { foreignKey: "groupExpenseId" });

GroupMember.hasMany(Split, { foreignKey: "memberId", as: "splitItems" });
Split.belongsTo(GroupMember, { foreignKey: "memberId", as: "member" });

export { Group, GroupMember, GroupExpense, Split };
