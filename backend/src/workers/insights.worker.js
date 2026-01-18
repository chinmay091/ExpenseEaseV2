import { Worker } from "bullmq";
import { connection } from "../config/bullmq.config.js";
import { getAnalytics } from "../services/analytics.service.js";
import { Job } from "../models/index.js";
import { sendPushNotification } from "../services/notification.service.js";

const insightsWorker = new Worker(
    "ai-insights",
    async (job) => {
        const { userId } = job.data;
        console.log(`[INSIGHTS_WORKER] Processing job ${job.id} for user ${userId}`);

        try {
            // Update job status to processing
            await Job.update({ status: "processing" }, { where: { id: job.id } });

            // Get analytics data which includes insights
            const analyticsData = await getAnalytics(userId);

            // Store result
            await Job.update(
                {
                    status: "completed",
                    result: analyticsData,
                    completedAt: new Date(),
                },
                { where: { id: job.id } }
            );

            const insightCount = analyticsData.insights?.length || 0;
            console.log(`[INSIGHTS_WORKER] Job ${job.id} completed - ${insightCount} insights generated`);

            // Notify user
            await sendPushNotification(
                userId,
                "💡 Insights Ready",
                `${insightCount} new spending insights available`,
                { type: "job_complete", jobId: job.id, jobType: "insights" }
            );

            return analyticsData;
        } catch (error) {
            console.error(`[INSIGHTS_WORKER] Job ${job.id} failed:`, error.message);

            await Job.update(
                {
                    status: "failed",
                    error: error.message,
                    completedAt: new Date(),
                },
                { where: { id: job.id } }
            );

            throw error;
        }
    },
    {
        connection,
        concurrency: 2, // LLM calls are rate-limited
    }
);

insightsWorker.on("completed", (job) => {
    console.log(`[INSIGHTS_WORKER] Job ${job.id} completed successfully`);
});

insightsWorker.on("failed", (job, err) => {
    console.error(`[INSIGHTS_WORKER] Job ${job?.id} failed:`, err.message);
});

export default insightsWorker;
