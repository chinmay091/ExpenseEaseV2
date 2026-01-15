import { Router } from 'express';
import { parseSmsMessages, getSmsConfig, classifySingleSms } from '../controllers/sms.controller.js';

const router = Router();

// Parse multiple SMS messages
router.post('/parse', parseSmsMessages);

// Test classify a single SMS (for ML model testing)
router.post('/classify', classifySingleSms);

// Get current SMS parsing configuration (debug)
router.get('/config', getSmsConfig);

export default router;
