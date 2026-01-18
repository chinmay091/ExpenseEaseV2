import { Router } from 'express';
import { extractFromImage, extractFromImageAsync } from '../controllers/ocr.controller.js';
import { ocrLimiter, llmLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Sync version (waits for result)
router.post('/extract', ocrLimiter, llmLimiter, extractFromImage);

// Async version (returns jobId, poll for result)
router.post('/extract/async', ocrLimiter, extractFromImageAsync);

export default router;
