import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "postgres",
        logging: false,
    }
);

export const connectDB = async() => {
    try{
        await sequelize.authenticate();
        console.log("Database connected!");
    } catch (error) {
        console.log(error);
    }
}

export default sequelize;