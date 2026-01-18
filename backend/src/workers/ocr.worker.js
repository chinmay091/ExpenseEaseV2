import { Worker } from "bullmq";
import { connection } from "../config/bullmq.config.js";
import { extractTextFromImage, parseReceiptData } from "../services/ocr.service.js";
import { Job } from "../models/index.js";
import { sendPushNotification } from "../services/notification.service.js";

const ocrWorker = new Worker(
    "ocr-processing",
    async (job) => {
        const { userId, imageBase64 } = job.data;
        console.log(`[OCR_WORKER] Processing job ${job.id} for user ${userId}`);

        try {
            // Update job status to processing
            await Job.update({ status: "processing" }, { where: { id: job.id } });

            // Run OCR extraction
            const extracted = await extractTextFromImage(imageBase64);
            const parsed = parseReceiptData(extracted);

            // Store result
            await Job.update(
                {
                    status: "completed",
                    result: parsed,
                    completedAt: new Date(),
                },
                { where: { id: job.id } }
            );

            console.log(`[OCR_WORKER] Job ${job.id} completed - Amount: ${parsed.amount}`);

            // Notify user
            await sendPushNotification(
                userId,
                "📸 Receipt Scanned",
                parsed.amount
                    ? `Found: ₹${parsed.amount.toLocaleString()} at ${parsed.merchant || "Unknown"}`
                    : "Scan complete - please verify the details",
                { type: "job_complete", jobId: job.id, jobType: "ocr" }
            );

            return parsed;
        } catch (error) {
            console.error(`[OCR_WORKER] Job ${job.id} failed:`, error.message);

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
                "❌ Receipt Scan Failed",
                "Could not read the receipt. Try taking a clearer photo.",
                { type: "job_failed", jobId: job.id, jobType: "ocr" }
            );

            throw error;
        }
    },
    {
        connection,
        concurrency: 3, // OCR is CPU-intensive, limit concurrency
    }
);

ocrWorker.on("completed", (job) => {
    console.log(`[OCR_WORKER] Job ${job.id} completed successfully`);
});

ocrWorker.on("failed", (job, err) => {
    console.error(`[OCR_WORKER] Job ${job?.id} failed:`, err.message);
});

export default ocrWorker;
