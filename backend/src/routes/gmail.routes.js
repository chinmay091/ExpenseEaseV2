import { Router } from 'express';
import { fetchGmailTransactions } from '../controllers/gmail.controller.js';
const router = Router();

router.post('/fetch', fetchGmailTransactions);

export default router;
