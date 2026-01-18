import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "postgres",
        logging: false,

        // Connection pool configuration
        pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 20,
            min: parseInt(process.env.DB_POOL_MIN) || 5,
            acquire: 30000,
            idle: 10000,
            evict: 1000,
        },

        // Retry logic for transient failures
        retry: {
            max: 3,
        },

        // SSL config for production
        ...(process.env.DB_SSL === "true" && {
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false,
                },
            },
        }),
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected!");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        throw error;
    }
};

export default sequelize;