import { Queue } from "bullmq";
import Redis from "ioredis";

// Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

connection.on("connect", () => {
    console.log("[REDIS] BullMQ connected");
});

connection.on("error", (err) => {
    console.error("[REDIS] BullMQ error:", err.message);
});

// Queue definitions
export const budgetQueue = new Queue("budget-generation", { connection });
export const ocrQueue = new Queue("ocr-processing", { connection });
export const insightsQueue = new Queue("ai-insights", { connection });

// Export connection for workers
export { connection };
