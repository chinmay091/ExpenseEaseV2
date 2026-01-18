import { v4 as uuidv4 } from "uuid";
import { getBudgetsWithUsage } from "../services/budget.service.js";
import { budgetQueue } from "../config/bullmq.config.js";
import { Job } from "../models/index.js";

export const getBudgetsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    const data = await getBudgetsWithUsage(userId, month);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch budgets",
    });
  }
};

export const generateBudgetsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 3, bufferPercent = 10 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId required",
      });
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Create job record in database
    await Job.create({
      id: jobId,
      userId,
      type: "budget",
      status: "pending",
    });

    // Enqueue for background processing
    await budgetQueue.add(
      "generate",
      { userId, months, bufferPercent },
      { jobId }
    );

    console.log(`[BUDGET] Job ${jobId} queued for user ${userId}`);

    // Return immediately with job ID
    return res.status(202).json({
      success: true,
      jobId,
      message: "Budget generation started",
      pollUrl: `/api/jobs/${jobId}`,
    });
  } catch (error) {
    console.error("[BUDGET] Queue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start budget generation",
    });
  }
};