import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Device = sequelize.define("Device", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    pushToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    platform: {
        type: DataTypes.ENUM("ios", "android", "web"),
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});

export default Device;
