import express from "express";
import cors from "cors";
import healthRoutes from "./src/routes/health.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", userRoutes);
app.use("/api", expenseRoutes);

export default app;
