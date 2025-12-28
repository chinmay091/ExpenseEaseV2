import express from "express";
import cors from "cors";
import healthRoutes from "./src/routes/health.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import budgetRoutes from "./src/routes/budget.routes.js";
import devRoutes from "./src/routes/dev.routes.js";
import mlRoutes from "./src/routes/ml.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", userRoutes);
app.use("/api", expenseRoutes);
app.use("/api", categoryRoutes);
app.use("/api", budgetRoutes);
app.use("/api", devRoutes);
app.use("/api", mlRoutes);

export default app;
