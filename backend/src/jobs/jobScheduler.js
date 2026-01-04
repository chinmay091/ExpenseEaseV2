import { CronJob } from "cron";
import { generateBudgetsForUser } from "../services/budget.service.js";
import { cleanupExpiredTokens } from "../services/auth.service.js";
import { autoContributeToGoals } from "../services/goal.service.js";
import { User } from "../models/index.js";

/**
 * Budget Recalculation Job
 * Runs daily at midnight to regenerate budgets for all users
 */
const budgetRecalculationJob = new CronJob(
    "0 0 * * *", // Every day at midnight
    async () => {
        console.log("[CRON] Starting budget recalculation job...");

        try {
            const users = await User.findAll({ attributes: ["id"] });
            console.log(`[CRON] Found ${users.length} users to process`);

            for (const user of users) {
                try {
                    await generateBudgetsForUser({ userId: user.id });
                    console.log(`[CRON] Budgets regenerated for user ${user.id}`);
                } catch (err) {
                    console.error(`[CRON] Failed for user ${user.id}:`, err.message);
                }
            }

            console.log("[CRON] Budget recalculation job completed");
        } catch (err) {
            console.error("[CRON] Budget recalculation job failed:", err.message);
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

/**
 * Token Cleanup Job
 * Runs daily at 3 AM to remove expired refresh tokens
 */
const tokenCleanupJob = new CronJob(
    "0 3 * * *", // Every day at 3 AM
    async () => {
        console.log("[CRON] Starting token cleanup job...");

        try {
            const deleted = await cleanupExpiredTokens();
            console.log(`[CRON] Cleaned up ${deleted} expired tokens`);
        } catch (err) {
            console.error("[CRON] Token cleanup job failed:", err.message);
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

/**
 * Goal Auto-Contribution Job
 * Runs when income is added - triggered by expense service, not cron
 * This cron runs daily at 6 AM to catch any missed auto-contributions
 */
const goalAutoContributionJob = new CronJob(
    "0 6 * * *", // Every day at 6 AM
    async () => {
        console.log("[CRON] Starting goal auto-contribution check...");

        try {
            const users = await User.findAll({ attributes: ["id"] });

            for (const user of users) {
                try {
                    await autoContributeToGoals(user.id);
                } catch (err) {
                    console.error(`[CRON] Auto-contribution failed for user ${user.id}:`, err.message);
                }
            }

            console.log("[CRON] Goal auto-contribution check completed");
        } catch (err) {
            console.error("[CRON] Goal auto-contribution job failed:", err.message);
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

/**
 * Start all scheduled jobs
 */
export const startJobScheduler = () => {
    console.log("[CRON] Initializing job scheduler...");

    budgetRecalculationJob.start();
    console.log("[CRON] Budget recalculation job scheduled (daily at midnight)");

    tokenCleanupJob.start();
    console.log("[CRON] Token cleanup job scheduled (daily at 3 AM)");

    goalAutoContributionJob.start();
    console.log("[CRON] Goal auto-contribution job scheduled (daily at 6 AM)");

    console.log("[CRON] All jobs started successfully");
};

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export const stopJobScheduler = () => {
    budgetRecalculationJob.stop();
    tokenCleanupJob.stop();
    goalAutoContributionJob.stop();
    console.log("[CRON] All jobs stopped");
};
