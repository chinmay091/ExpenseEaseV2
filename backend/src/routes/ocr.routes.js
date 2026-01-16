import { Router } from 'express';
import { extractFromImage } from '../controllers/ocr.controller.js';
import { ocrLimiter, llmLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/extract', ocrLimiter, llmLimiter, extractFromImage);

export default router;
