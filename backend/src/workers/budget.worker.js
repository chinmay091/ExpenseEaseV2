import { Worker } from "bullmq";
import { connection } from "../config/bullmq.config.js";
import { generateBudgetsForUser } from "../services/budget.service.js";
import { Job } from "../models/index.js";
import { sendPushNotification } from "../services/notification.service.js";

const budgetWorker = new Worker(
    "budget-generation",
    async (job) => {
        const { userId, months, bufferPercent } = job.data;
        console.log(`[BUDGET_WORKER] Processing job ${job.id} for user ${userId}`);

        try {
            // Update job status to processing
            await Job.update({ status: "processing" }, { where: { id: job.id } });

            // Run the actual budget generation
            const budgets = await generateBudgetsForUser({ userId, months, bufferPercent });

            // Store result
            await Job.update(
                {
                    status: "completed",
                    result: { budgets: budgets.map(b => b.toJSON()), count: budgets.length },
                    completedAt: new Date(),
                },
                { where: { id: job.id } }
            );

            console.log(`[BUDGET_WORKER] Job ${job.id} completed - ${budgets.length} budgets generated`);

            // Notify user
            await sendPushNotification(
                userId,
                "✅ Budgets Ready",
                `${budgets.length} budgets generated successfully`,
                { type: "job_complete", jobId: job.id, jobType: "budget" }
            );

            return { count: budgets.length };
        } catch (error) {
            console.error(`[BUDGET_WORKER] Job ${job.id} failed:`, error.message);

            await Job.update(
                {
                    status: "failed",
                    error: error.message,
                    completedAt: new Date(),
                },
                { where: { id: job.id } }
            );

            // Notify user of failure
            await sendPushNotification(
                userId,
                "❌ Budget Generation Failed",
                "There was an error generating your budgets. Please try again.",
                { type: "job_failed", jobId: job.id, jobType: "budget" }
            );

            throw error;
        }
    },
    {
        connection,
        concurrency: 2, // Process up to 2 budget jobs simultaneously
    }
);

budgetWorker.on("completed", (job) => {
    console.log(`[BUDGET_WORKER] Job ${job.id} completed successfully`);
});

budgetWorker.on("failed", (job, err) => {
    console.error(`[BUDGET_WORKER] Job ${job?.id} failed:`, err.message);
});

export default budgetWorker;
