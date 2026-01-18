import { Queue, Worker } from "bullmq";
import { connection } from "../config/bullmq.config.js";
import { generateBudgetsForUser } from "../services/budget.service.js";
import { cleanupExpiredTokens } from "../services/auth.service.js";
import { autoContributeToGoals } from "../services/goal.service.js";
import { checkBudgetWarnings, checkBillReminders, sendWeeklySummary } from "../services/notification.service.js";
import { User } from "../models/index.js";

// Create queue for scheduled jobs
export const scheduledQueue = new Queue("scheduled-jobs", { connection });

// Job processor definitions
const jobProcessors = {
    "budget-recalculation": async () => {
        console.log("[CRON] Starting daily budget recalculation");
        const users = await User.findAll({ attributes: ["id"] });
        console.log(`[CRON] Found ${users.length} users to process`);

        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            try {
                await generateBudgetsForUser({ userId: user.id });
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`[CRON] Budget failed for user ${user.id}:`, err.message);
            }
        }

        console.log(`[CRON] Budget recalculation completed: ${successCount} success, ${failCount} failed`);
        return { successCount, failCount };
    },

    "token-cleanup": async () => {
        console.log("[CRON] Starting token cleanup");
        const deleted = await cleanupExpiredTokens();
        console.log(`[CRON] Cleaned up ${deleted} expired tokens`);
        return { deleted };
    },

    "goal-auto-contribution": async () => {
        console.log("[CRON] Starting goal auto-contribution check");
        const users = await User.findAll({ attributes: ["id"] });

        let processedCount = 0;
        for (const user of users) {
            try {
                await autoContributeToGoals(user.id);
                processedCount++;
            } catch (err) {
                console.error(`[CRON] Auto-contribution failed for user ${user.id}:`, err.message);
            }
        }

        console.log(`[CRON] Goal auto-contribution completed: ${processedCount} processed`);
        return { processedCount };
    },

    "budget-warnings": async () => {
        console.log("[CRON] Starting budget warnings check");
        const result = await checkBudgetWarnings();
        console.log(`[CRON] Budget warnings: checked ${result.checked}, sent ${result.warnings}`);
        return result;
    },

    "bill-reminders": async () => {
        console.log("[CRON] Starting bill reminders check");
        const result = await checkBillReminders();
        console.log(`[CRON] Bill reminders: checked ${result.checked}, sent ${result.reminders}`);
        return result;
    },

    "weekly-summary": async () => {
        console.log("[CRON] Starting weekly summary notifications");
        const users = await User.findAll({ attributes: ["id"] });

        let sentCount = 0;
        for (const user of users) {
            try {
                await sendWeeklySummary(user.id);
                sentCount++;
            } catch (err) {
                console.error(`[CRON] Weekly summary failed for user ${user.id}:`, err.message);
            }
        }

        console.log(`[CRON] Weekly summary completed: ${sentCount} sent`);
        return { sentCount };
    },
};

// Create worker to process scheduled jobs
const scheduledWorker = new Worker(
    "scheduled-jobs",
    async (job) => {
        const processor = jobProcessors[job.name];
        if (!processor) {
            throw new Error(`Unknown job: ${job.name}`);
        }
        return await processor(job.data);
    },
    { connection, concurrency: 1 }
);

scheduledWorker.on("completed", (job) => {
    console.log(`[CRON] Job ${job.name} completed`);
});

scheduledWorker.on("failed", (job, err) => {
    console.error(`[CRON] Job ${job?.name} failed:`, err.message);
});

// Schedule definitions with cron patterns
const schedules = [
    { name: "budget-recalculation", pattern: "0 0 * * *", description: "Daily budget recalculation" },
    { name: "token-cleanup", pattern: "0 3 * * *", description: "Daily token cleanup" },
    { name: "goal-auto-contribution", pattern: "0 6 * * *", description: "Daily goal auto-contribution" },
    { name: "bill-reminders", pattern: "0 8 * * *", description: "Daily bill reminders" },
    { name: "budget-warnings", pattern: "0 9 * * *", description: "Daily budget warnings" },
    { name: "weekly-summary", pattern: "0 10 * * 0", description: "Weekly spending summary" },
];

export const startScheduledJobs = async () => {
    console.log("[CRON] Initializing BullMQ scheduled jobs...");

    // Remove any existing repeatable jobs first
    const existingJobs = await scheduledQueue.getRepeatableJobs();
    for (const job of existingJobs) {
        await scheduledQueue.removeRepeatableByKey(job.key);
    }

    // Add all scheduled jobs as repeatable
    for (const schedule of schedules) {
        await scheduledQueue.add(
            schedule.name,
            {},
            {
                repeat: { pattern: schedule.pattern, tz: "Asia/Kolkata" },
                removeOnComplete: { age: 86400 },
                removeOnFail: { age: 604800 },
            }
        );
        console.log(`[CRON] ${schedule.description} scheduled (${schedule.pattern})`);
    }

    console.log("[CRON] All jobs started successfully");
};

export const stopScheduledJobs = async () => {
    await scheduledWorker.close();
    await scheduledQueue.close();
    console.log("[CRON] All jobs stopped");
};

export default { startScheduledJobs, stopScheduledJobs, scheduledQueue };
