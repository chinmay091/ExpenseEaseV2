import { fetchTransactionEmails, parseTransactionEmails } from '../services/gmail.service.js';

/**
 * POST /api/gmail/fetch
 * Fetch and parse transaction emails from Gmail
 */
export const fetchGmailTransactions = async (req, res) => {
    try {
        const { accessToken, maxResults = 20 } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Gmail access token is required',
            });
        }

        // Fetch emails from Gmail
        const emails = await fetchTransactionEmails(accessToken, maxResults);

        // Parse emails for transactions
        const transactions = await parseTransactionEmails(emails);

        return res.status(200).json({
            success: true,
            data: {
                totalEmails: emails.length,
                transactions,
            },
        });
    } catch (error) {
        console.error('[GMAIL] Fetch error:', error.message);

        // Handle token errors
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
            return res.status(401).json({
                success: false,
                error: 'Gmail access token is invalid or expired',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to fetch Gmail transactions',
            message: error.message,
        });
    }
};
