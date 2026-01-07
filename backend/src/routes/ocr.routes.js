import { Router } from 'express';
import { extractFromImage } from '../controllers/ocr.controller.js';

const router = Router();

router.post('/extract', extractFromImage);

export default router;
