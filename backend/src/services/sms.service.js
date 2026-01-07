import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getLLM, isLLMEnabled, extractJSON } from "../utils/llm.util.js";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from "../config/redis.js";

const SMS_PARSING_PROMPT = `You are an SMS parser that extracts transaction details from bank SMS messages.

Parse the following SMS messages and extract transaction information. For each SMS that contains a financial transaction, extract:
- amount: The transaction amount (number only, no currency symbol)
- type: Either "debit" or "credit" 
- merchant: The merchant/recipient name if available
- description: Brief description of the transaction
- date: Transaction date if mentioned (YYYY-MM-DD format)
- account: Last 4 digits of account/card if mentioned

Return a JSON array of extracted transactions. If an SMS is not a transaction message, skip it.
Only include messages that are clearly financial transactions (payments, purchases, transfers, refunds, etc.)

Example output:
[
  {"amount": 500, "type": "debit", "merchant": "Amazon", "description": "Online purchase", "date": "2024-01-15", "account": "1234"},
  {"amount": 25000, "type": "credit", "merchant": null, "description": "Salary credit", "date": "2024-01-01", "account": "5678"}
]

If no valid transactions are found, return an empty array: []`;

export const parseTransactionSms = async (messages) => {
    if (!messages || messages.length === 0) {
        return [];
    }

    if (!isLLMEnabled()) {
        return parseWithRegex(messages);
    }

    const smsText = messages.map((msg, i) => `[${i + 1}] ${msg.body}`).join("\n\n");

    const cached = await getCached(CACHE_KEYS.SMS_PARSE, smsText);
    if (cached) return cached;

    try {
        const llm = getLLM("precise");
        const response = await llm.invoke([
            new SystemMessage(SMS_PARSING_PROMPT),
            new HumanMessage(`Parse these SMS messages:\n\n${smsText}`),
        ]);

        const content = typeof response.content === 'string' ? response.content.trim() : response.content;
        const parsed = extractJSON(content, "array");

        if (parsed) {
            const result = parsed.map(tx => ({ ...tx, source: 'sms', confidence: 'high' }));
            await setCache(CACHE_KEYS.SMS_PARSE, smsText, result, CACHE_TTL.SMS_PARSE);
            return result;
        }

        return [];
    } catch (error) {
        console.error('[SMS] LLM parsing error:', error.message);
        return parseWithRegex(messages);
    }
};

const parseWithRegex = (messages) => {
    const transactions = [];

    const patterns = {
        svcDebit: /DEBITED\s+for\s+Rs\.?\s*([\d,]+\.?\d*)/i,
        svcCredit: /CREDITED\s+(?:with|for)?\s*Rs\.?\s*([\d,]+\.?\d*)/i,
        debit: /(?:debited|spent|paid|sent|withdrawn|transferred|debit|payment of|purchase of|dr\b)[\s\S]*?(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)/i,
        debitAlt: /(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)[\s\S]*?(?:debited|sent|paid|dr\b|withdrawn)/i,
        credit: /(?:credited|received|refund|cashback|credit|cr\b|deposited)[\s\S]*?(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)/i,
        creditAlt: /(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)[\s\S]*?(?:credited|received|cr\b|deposited)/i,
        upiDebit: /(?:sent|paid|upi|phonepe|gpay|paytm)[\s\S]*?(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)/i,
        amount: /(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)/i,
        account: /(?:a\/c|account|card|acct|ac)[\s\S]*?[xX*]*(\d{4})/i,
        date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        merchant: /(?:to|at|@)\s*([A-Za-z0-9\s]+?)(?:\s+on|\s+ref|\s+upi|$|\.|,)/i,
    };

    for (const msg of messages) {
        const body = msg.body || '';
        let transaction = null;

        let svcDebitMatch = body.match(patterns.svcDebit);
        let svcCreditMatch = body.match(patterns.svcCredit);

        if (svcDebitMatch) {
            transaction = { amount: parseFloat(svcDebitMatch[1].replace(/,/g, '')), type: 'debit', description: 'Debit transaction' };
        } else if (svcCreditMatch) {
            transaction = { amount: parseFloat(svcCreditMatch[1].replace(/,/g, '')), type: 'credit', description: 'Credit transaction' };
        }

        if (!transaction) {
            let debitMatch = body.match(patterns.debit) || body.match(patterns.debitAlt) || body.match(patterns.upiDebit);
            let creditMatch = body.match(patterns.credit) || body.match(patterns.creditAlt);

            if (creditMatch && !debitMatch) {
                transaction = { amount: parseFloat(creditMatch[1].replace(/,/g, '')), type: 'credit', description: 'Credit transaction' };
            } else if (debitMatch) {
                transaction = { amount: parseFloat(debitMatch[1].replace(/,/g, '')), type: 'debit', description: 'Debit transaction' };
            } else {
                const amountMatch = body.match(patterns.amount);
                if (amountMatch && body.toLowerCase().includes('bank')) {
                    const isCredit = /credit|receive|deposit|cr\b/i.test(body);
                    transaction = { amount: parseFloat(amountMatch[1].replace(/,/g, '')), type: isCredit ? 'credit' : 'debit', description: 'Bank transaction' };
                }
            }
        }

        if (transaction && transaction.amount > 0) {
            const accountMatch = body.match(patterns.account);
            if (accountMatch) transaction.account = accountMatch[1];

            const dateMatch = body.match(patterns.date);
            if (dateMatch) transaction.date = dateMatch[1];

            const merchantMatch = body.match(patterns.merchant);
            if (merchantMatch) {
                transaction.merchant = merchantMatch[1].trim();
                transaction.description = `To ${transaction.merchant}`;
            }

            transaction.source = 'sms';
            transaction.confidence = 'medium';
            transaction.rawMessage = body.substring(0, 150);

            transactions.push(transaction);
        }
    }

    return transactions;
};

export const filterTransactionSms = (messages) => {
    const bankKeywords = [
        'debited', 'credited', 'transaction', 'payment', 'spent',
        'received', 'transfer', 'withdrawn', 'balance', 'upi',
        'neft', 'imps', 'rtgs', 'atm', 'purchase', 'refund',
        'cashback', 'a/c', 'account', 'bank', 'card'
    ];

    return messages.filter(msg => {
        const body = (msg.body || '').toLowerCase();
        return bankKeywords.some(keyword => body.includes(keyword));
    });
};
