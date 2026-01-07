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
import goalRoutes from "./src/routes/goal.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import reportRoutes from "./src/routes/report.routes.js";
import ocrRoutes from "./src/routes/ocr.routes.js";
import smsRoutes from "./src/routes/sms.routes.js";
import gmailRoutes from "./src/routes/gmail.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import billRoutes from "./src/routes/bill.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import groupRoutes from "./src/routes/group.routes.js";
import { authMiddleware } from "./src/middlewares/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);

app.use("/api", authMiddleware);

app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/ml", mlRoutes);

export default app;


