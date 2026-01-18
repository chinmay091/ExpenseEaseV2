import { api } from "./axios";

// Job status types
export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type JobType = "budget" | "ocr" | "insights";

export interface JobResponse {
    id: string;
    type: JobType;
    status: JobStatus;
    result: unknown | null;
    error: string | null;
    createdAt: string;
    completedAt: string | null;
}

export interface JobQueuedResponse {
    success: boolean;
    jobId: string;
    message: string;
    pollUrl: string;
}

/**
 * Get the current status of a job
 */
export const getJobStatus = async (jobId: string): Promise<JobResponse> => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
};

/**
 * Poll a job until it completes or fails
 * @param jobId - The job ID to poll
 * @param onProgress - Optional callback for progress updates
 * @param maxAttempts - Maximum polling attempts (default: 60 = ~1 minute)
 * @param intervalMs - Milliseconds between polls (default: 1000ms)
 */
export const pollJobUntilComplete = async <T = unknown>(
    jobId: string,
    onProgress?: (status: JobStatus) => void,
    maxAttempts: number = 60,
    intervalMs: number = 1000
): Promise<T> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const job = await getJobStatus(jobId);
        
        // Notify progress callback
        if (onProgress) {
            onProgress(job.status);
        }

        if (job.status === "completed") {
            return job.result as T;
        }

        if (job.status === "failed") {
            throw new Error(job.error || "Job failed without error message");
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Job ${jobId} timed out after ${maxAttempts} attempts`);
};

/**
 * List recent jobs for the current user
 */
export const listRecentJobs = async (): Promise<{ jobs: JobResponse[] }> => {
    const response = await api.get("/jobs");
    return response.data;
};

// Convenience function for budget generation
export const generateBudgetsAsync = async (
    months: number = 3,
    bufferPercent: number = 10
): Promise<JobQueuedResponse> => {
    const response = await api.post("/budgets/generate", { months, bufferPercent });
    return response.data;
};

// Convenience function for OCR scanning
export const scanReceiptAsync = async (imageBase64: string): Promise<JobQueuedResponse> => {
    const response = await api.post("/ocr/extract/async", { image: imageBase64 });
    return response.data;
};
