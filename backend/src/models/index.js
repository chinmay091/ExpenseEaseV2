import sequelize from "../config/database.js";
import User from "./user.model.js";
import Expense from "./expense.model.js";
import Category from "./category.model.js";

// Associations
User.hasMany(Expense, { foreignKey: "userId", onDelete: "CASCADE"});
Expense.belongsTo(User, { foreignKey: "userId" });

Category.hasMany(Expense, { foreignKey: "categoryId" });
Expense.belongsTo(Category, { foreignKey: "categoryId" });

export { sequelize, User, Expense };