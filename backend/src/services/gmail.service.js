import axios from 'axios';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from "../config/redis.js";

const LLM_ENABLED = process.env.LLM_ENABLED === "true";

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0.3,
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 2,
});

export const fetchTransactionEmails = async (accessToken, maxResults = 20) => {
    try {
        const searchQuery = 'subject:(transaction OR payment OR receipt OR order OR invoice OR statement)';

        const listResponse = await axios.get(
            'https://www.googleapis.com/gmail/v1/users/me/messages',
            {
                params: {
                    q: searchQuery,
                    maxResults,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
            return [];
        }

        const emails = await Promise.all(
            listResponse.data.messages.slice(0, maxResults).map(async (msg) => {
                try {
                    const msgResponse = await axios.get(
                        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                        {
                            params: { format: 'full' },
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        }
                    );
                    return msgResponse.data;
                } catch (error) {
                    console.error(`Failed to fetch email ${msg.id}:`, error.message);
                    return null;
                }
            })
        );

        return emails.filter(Boolean);
    } catch (error) {
        console.error('[GMAIL] Fetch error:', error.message);
        throw new Error('Failed to fetch emails from Gmail');
    }
};

const extractEmailBody = (message) => {
    const payload = message.payload;
    let body = '';

    const getBody = (part) => {
        if (part.body && part.body.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
            for (const subPart of part.parts) {
                if (subPart.mimeType === 'text/plain') {
                    return getBody(subPart);
                }
            }
            for (const subPart of part.parts) {
                const result = getBody(subPart);
                if (result) return result;
            }
        }
        return '';
    };

    body = getBody(payload);
    return body.substring(0, 5000);
};

const getEmailHeaders = (message) => {
    const headers = {};
    const headerList = message.payload?.headers || [];

    for (const header of headerList) {
        if (['From', 'Subject', 'Date'].includes(header.name)) {
            headers[header.name.toLowerCase()] = header.value;
        }
    }

    return headers;
};

const EMAIL_PARSING_PROMPT = `You are an email parser that extracts transaction details from transaction notification emails.

For each email, determine if it contains a financial transaction and extract:
- amount: The transaction amount (number only)
- type: Either "debit" or "credit"
- merchant: The merchant/vendor name
- description: Brief description of the transaction
- date: Transaction date (YYYY-MM-DD format)

Return a JSON object with the extracted data. If the email is not a transaction notification, return {"isTransaction": false}.

Example outputs:
{"isTransaction": true, "amount": 1500, "type": "debit", "merchant": "Zomato", "description": "Food order", "date": "2024-01-15"}
{"isTransaction": false}`;

export const parseTransactionEmails = async (emails) => {
    const transactions = [];

    for (const email of emails) {
        try {
            const headers = getEmailHeaders(email);
            const body = extractEmailBody(email);

            if (!body) continue;

            const cacheKey = `${headers.subject || ''}_${body.substring(0, 200)}`;
            const cached = await getCached(CACHE_KEYS.EMAIL_PARSE, cacheKey);
            if (cached) {
                if (cached.isTransaction !== false && cached.amount) {
                    transactions.push(cached);
                }
                continue;
            }

            if (LLM_ENABLED) {
                const response = await llm.invoke([
                    new SystemMessage(EMAIL_PARSING_PROMPT),
                    new HumanMessage(`Parse this email:\n\nFrom: ${headers.from}\nSubject: ${headers.subject}\nDate: ${headers.date}\n\nBody:\n${body.substring(0, 2000)}`),
                ]);

                const content = typeof response.content === 'string'
                    ? response.content.trim()
                    : response.content;

                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);

                    await setCache(CACHE_KEYS.EMAIL_PARSE, cacheKey, parsed, CACHE_TTL.EMAIL_PARSE);

                    if (parsed.isTransaction !== false && parsed.amount) {
                        transactions.push({
                            ...parsed,
                            source: 'gmail',
                            emailSubject: headers.subject,
                            emailFrom: headers.from,
                            confidence: 'high',
                        });
                    }
                }
            } else {
                const amount = body.match(/(?:Rs\.?|INR|₹|USD|\$)\s*([\d,]+\.?\d*)/i);
                if (amount) {
                    const isCredit = /(?:credit|refund|received|cashback)/i.test(body);
                    const result = {
                        amount: parseFloat(amount[1].replace(/,/g, '')),
                        type: isCredit ? 'credit' : 'debit',
                        description: headers.subject || 'Email transaction',
                        source: 'gmail',
                        emailSubject: headers.subject,
                        emailFrom: headers.from,
                        confidence: 'medium',
                    };
                    transactions.push(result);
                }
            }
        } catch (error) {
            console.error('[GMAIL] Parse error for email:', error.message);
        }
    }

    return transactions;
};
