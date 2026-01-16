import { Router } from 'express';
import { parseSmsMessages, getSmsConfig, classifySingleSms } from '../controllers/sms.controller.js';
import { smsLimiter, llmLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/parse', smsLimiter, llmLimiter, parseSmsMessages);
router.post('/classify', smsLimiter, classifySingleSms);
router.get('/config', getSmsConfig);

export default router;
