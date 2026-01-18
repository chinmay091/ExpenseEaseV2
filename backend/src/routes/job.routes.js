import { Router } from "express";
import { Job } from "../models/index.js";

const router = Router();

// GET /api/jobs/:jobId - Get job status and result
router.get("/:jobId", async (req, res) => {
    try {
        const job = await Job.findOne({
            where: {
                id: req.params.jobId,
                userId: req.user.id,
            },
        });

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        res.json({
            id: job.id,
            type: job.type,
            status: job.status,
            result: job.status === "completed" ? job.result : null,
            error: job.status === "failed" ? job.error : null,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
        });
    } catch (error) {
        console.error("[JOB] Get status error:", error);
        res.status(500).json({ error: "Failed to get job status" });
    }
});

// GET /api/jobs - List recent jobs for user
router.get("/", async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
            limit: 20,
        });

        res.json({
            jobs: jobs.map((job) => ({
                id: job.id,
                type: job.type,
                status: job.status,
                createdAt: job.createdAt,
                completedAt: job.completedAt,
            })),
        });
    } catch (error) {
        console.error("[JOB] List jobs error:", error);
        res.status(500).json({ error: "Failed to list jobs" });
    }
});

export default router;
