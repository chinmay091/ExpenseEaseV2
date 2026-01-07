import { CronJob } from "cron";
import { generateBudgetsForUser } from "../services/budget.service.js";
import { cleanupExpiredTokens } from "../services/auth.service.js";
import { autoContributeToGoals } from "../services/goal.service.js";
import { checkBudgetWarnings, checkBillReminders, sendWeeklySummary } from "../services/notification.service.js";
import { User } from "../models/index.js";

const budgetRecalculationJob = new CronJob(
    "0 0 * * *",
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

const tokenCleanupJob = new CronJob(
    "0 3 * * *",
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

const goalAutoContributionJob = new CronJob(
    "0 6 * * *",
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

const budgetWarningsJob = new CronJob(
    "0 9 * * *",
    async () => {
        console.log("[CRON] Starting budget warnings check...");
        try {
            const result = await checkBudgetWarnings();
            console.log(`[CRON] Budget warnings: checked ${result.checked}, sent ${result.warnings}`);
        } catch (err) {
            console.error("[CRON] Budget warnings job failed:", err.message);
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

const billRemindersJob = new CronJob(
    "0 8 * * *",
    async () => {
        console.log("[CRON] Starting bill reminders check...");
        try {
            const result = await checkBillReminders();
            console.log(`[CRON] Bill reminders: checked ${result.checked}, sent ${result.reminders}`);
        } catch (err) {
            console.error("[CRON] Bill reminders job failed:", err.message);
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

const weeklySummaryJob = new CronJob(
    "0 10 * * 0",
    async () => {
        console.log("[CRON] Starting weekly summary notifications...");
        try {
            const users = await User.findAll({ attributes: ["id"] });
            for (const user of users) {
                try {
                    await sendWeeklySummary(user.id);
                } catch (err) {
                    console.error(`[CRON] Weekly summary failed for user ${user.id}:`, err.message);
                }
            }
            console.log("[CRON] Weekly summary notifications completed");
        } catch (err) {
            console.error("[CRON] Weekly summary job failed:", err.message);
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

export const startJobScheduler = () => {
    console.log("[CRON] Initializing job scheduler...");

    budgetRecalculationJob.start();
    console.log("[CRON] Budget recalculation job scheduled (daily at midnight)");

    tokenCleanupJob.start();
    console.log("[CRON] Token cleanup job scheduled (daily at 3 AM)");

    goalAutoContributionJob.start();
    console.log("[CRON] Goal auto-contribution job scheduled (daily at 6 AM)");

    billRemindersJob.start();
    console.log("[CRON] Bill reminders job scheduled (daily at 8 AM)");

    budgetWarningsJob.start();
    console.log("[CRON] Budget warnings job scheduled (daily at 9 AM)");

    weeklySummaryJob.start();
    console.log("[CRON] Weekly summary job scheduled (Sundays at 10 AM)");

    console.log("[CRON] All jobs started successfully");
};

export const stopJobScheduler = () => {
    budgetRecalculationJob.stop();
    tokenCleanupJob.stop();
    goalAutoContributionJob.stop();
    budgetWarningsJob.stop();
    billRemindersJob.stop();
    weeklySummaryJob.stop();
    console.log("[CRON] All jobs stopped");
};
