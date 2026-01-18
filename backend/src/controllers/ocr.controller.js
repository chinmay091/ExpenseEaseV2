import { v4 as uuidv4 } from "uuid";
import { extractTextFromImage, parseReceiptData } from '../services/ocr.service.js';
import { ocrQueue } from "../config/bullmq.config.js";
import { Job } from "../models/index.js";

// Async version - queues the OCR job
export const extractFromImageAsync = async (req, res) => {
    try {
        console.log('[OCR] Received async extract request');
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image data is required',
            });
        }

        // Remove data URL prefix if present
        const base64Data = image.includes('base64,')
            ? image.split('base64,')[1]
            : image;

        console.log('[OCR] Base64 data length:', base64Data.length);

        // Generate unique job ID
        const jobId = uuidv4();

        // Create job record in database
        await Job.create({
            id: jobId,
            userId: req.user.id,
            type: "ocr",
            status: "pending",
        });

        // Enqueue for background processing
        await ocrQueue.add(
            "scan",
            { userId: req.user.id, imageBase64: base64Data },
            { jobId }
        );

        console.log(`[OCR] Job ${jobId} queued for user ${req.user.id}`);

        // Return immediately with job ID
        return res.status(202).json({
            success: true,
            jobId,
            message: "Receipt scan started",
            pollUrl: `/api/jobs/${jobId}`,
        });
    } catch (error) {
        console.error('[OCR] Queue error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to start receipt scan',
            message: error.message,
        });
    }
};

// Sync version - kept for backwards compatibility or quick scans
export const extractFromImage = async (req, res) => {
    try {
        console.log('[OCR] Received extract request');
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image data is required',
            });
        }

        console.log('[OCR] Image data length:', image.length);

        // Remove data URL prefix if present
        const base64Data = image.includes('base64,')
            ? image.split('base64,')[1]
            : image;

        console.log('[OCR] Base64 data length:', base64Data.length);

        // Extract text from image
        const extractedData = await extractTextFromImage(base64Data);
        console.log('[OCR] Extraction complete');

        // Parse into expense format
        const expenseData = parseReceiptData(extractedData);
        console.log('[OCR] Parsed expense:', expenseData);

        return res.status(200).json({
            success: true,
            data: {
                extracted: extractedData,
                expense: expenseData,
            },
        });
    } catch (error) {
        console.error('[OCR] Extraction error:', error);
        console.error('[OCR] Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Failed to process image',
            message: error.message,
        });
    }
};
