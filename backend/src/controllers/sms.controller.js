import { parseTransactionSms, filterTransactionSms } from '../services/sms.service.js';

/**
 * POST /api/sms/parse
 * Parse SMS messages to extract transaction data
 */
export const parseSmsMessages = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: 'Messages array is required',
            });
        }

        // Filter to likely transaction messages first
        const filtered = filterTransactionSms(messages);

        // Parse the filtered messages
        const transactions = await parseTransactionSms(filtered);

        return res.status(200).json({
            success: true,
            data: {
                totalMessages: messages.length,
                filteredCount: filtered.length,
                transactions,
            },
        });
    } catch (error) {
        console.error('[SMS] Parse error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to parse SMS messages',
            message: error.message,
        });
    }
};
