import sequelize from "../config/database.js";
import User from "./user.model.js";
import Expense from "./expense.model.js";

// Associations
User.hasMany(Expense, { foreignKey: "userId", onDelete: "CASCADE"});

Expense.belongsTo(User, { foreignKey: "userId" });

export { sequelize, User, Expense };