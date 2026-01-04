import sequelize from "../config/database.js";
import User from "./user.model.js";
import Expense from "./expense.model.js";
import Category from "./category.model.js";
import Budget from "./budget.model.js";
import RefreshToken from "./refresh_token.model.js";

// Associations
User.hasMany(Expense, { foreignKey: "userId", onDelete: "CASCADE" });
Expense.belongsTo(User, { foreignKey: "userId" });

Category.hasMany(Expense, { foreignKey: "categoryId" });
Expense.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(Budget, { foreignKey: "userId" });
Budget.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(Budget, { foreignKey: "categoryId" });
Budget.belongsTo(Category, { foreignKey: "categoryId" });

// RefreshToken associations
User.hasMany(RefreshToken, { foreignKey: "userId", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

export { sequelize, User, Expense, Category, Budget, RefreshToken };