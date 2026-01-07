import { Router } from 'express';
import { parseSmsMessages } from '../controllers/sms.controller.js';

const router = Router();

router.post('/parse', parseSmsMessages);

export default router;
