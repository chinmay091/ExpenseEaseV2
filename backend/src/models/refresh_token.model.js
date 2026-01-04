import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RefreshToken = sequelize.define(
    "RefreshToken",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
    tableName: "refresh_tokens",
    timestamps: true,
});

export default RefreshToken;