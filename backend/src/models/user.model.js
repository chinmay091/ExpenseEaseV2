import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: null,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    initialBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    balanceSetAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

export default User;
