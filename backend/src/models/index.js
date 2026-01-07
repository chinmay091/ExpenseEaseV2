import sequelize from "../config/database.js";
import User from "./user.model.js";
import Expense from "./expense.model.js";
import Category from "./category.model.js";
import Budget from "./budget.model.js";
import RefreshToken from "./refresh_token.model.js";
import { Goal, GoalContribution } from "./goal.model.js";
import Device from "./device.model.js";
import Bill from "./bill.model.js";
import { Group, GroupMember, GroupExpense, Split } from "./group.model.js";

User.hasMany(Expense, { foreignKey: "userId", onDelete: "CASCADE" });
Expense.belongsTo(User, { foreignKey: "userId" });

Category.hasMany(Expense, { foreignKey: "categoryId" });
Expense.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(Budget, { foreignKey: "userId" });
Budget.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(Budget, { foreignKey: "categoryId" });
Budget.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(RefreshToken, { foreignKey: "userId", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Goal, { foreignKey: "userId", onDelete: "CASCADE" });
Goal.belongsTo(User, { foreignKey: "userId" });

GoalContribution.belongsTo(Expense, { foreignKey: "expenseId" });

User.hasMany(Device, { foreignKey: "userId", onDelete: "CASCADE" });
Device.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Bill, { foreignKey: "userId", onDelete: "CASCADE" });
Bill.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(Bill, { foreignKey: "categoryId" });
Bill.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(Group, { foreignKey: "createdById", as: "createdGroups" });
Group.belongsTo(User, { foreignKey: "createdById", as: "creator" });

User.hasMany(GroupMember, { foreignKey: "userId", as: "groupMemberships" });
GroupMember.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
    sequelize, User, Expense, Category, Budget, RefreshToken,
    Goal, GoalContribution, Device, Bill,
    Group, GroupMember, GroupExpense, Split
};


