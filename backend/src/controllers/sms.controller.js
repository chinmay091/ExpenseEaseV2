import { parseTransactionSms, filterTransactionSms, getSmsParsingConfig, classifySingleMessage } from '../services/sms.service.js';

export const parseSmsMessages = async (req, res) => {
    try {
        const { messages, skipFilter } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: 'Messages array is required',
            });
        }

        const toProcess = skipFilter ? messages : filterTransactionSms(messages);
        const transactions = await parseTransactionSms(toProcess);

        return res.status(200).json({
            success: true,
            data: {
                totalMessages: messages.length,
                filteredCount: toProcess.length,
                transactionCount: transactions.length,
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

export const getSmsConfig = async (req, res) => {
    try {
        const config = getSmsParsingConfig();
        return res.status(200).json({ success: true, data: config });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to get SMS config' });
    }
};

export const classifySingleSms = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, error: 'Message string is required' });
        }

        const result = await classifySingleMessage(message);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[SMS] Classify error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to classify SMS' });
    }
};
