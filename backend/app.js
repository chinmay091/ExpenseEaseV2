import express from "express";
import cors from "cors";
import healthRoutes from "./src/routes/health.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import budgetRoutes from "./src/routes/budget.routes.js";
import devRoutes from "./src/routes/dev.routes.js";
import mlRoutes from "./src/routes/ml.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import { authMiddleware } from "./src/middlewares/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);

app.use("/api", authMiddleware);

app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/ml", mlRoutes);

export default app;
