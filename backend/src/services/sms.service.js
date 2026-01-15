import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getLLM, isLLMEnabled, extractJSON } from "../utils/llm.util.js";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from "../config/redis.js";
import * as ort from "onnxruntime-node";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const ML_MODEL_ENABLED = process.env.SMS_ML_MODEL_ENABLED === "true";
const ML_MODEL_PATH = process.env.SMS_ML_MODEL_PATH || path.join(PROJECT_ROOT, "ML/sms_classifier.onnx");
const VOCAB_PATH = process.env.SMS_VOCAB_PATH || path.join(PROJECT_ROOT, "ML/sms_model/vocab.txt");
const ML_CONFIDENCE_THRESHOLD = 0.7;
const MAX_LENGTH = 128;

let mlSession = null;
let mlModelLoaded = false;
let vocab = null;
let vocabMap = {};

const loadVocab = () => {
    if (vocab) return true;
    try {
        const vocabText = fs.readFileSync(VOCAB_PATH, "utf-8");
        vocab = vocabText.split("\n").map(line => line.trim());
        vocab.forEach((token, idx) => { vocabMap[token] = idx; });
        console.log("[SMS] Vocab loaded:", vocab.length, "tokens");
        return true;
    } catch (error) {
        console.error("[SMS] Failed to load vocab:", error.message);
        return false;
    }
};

const loadMLModel = async () => {
    if (mlModelLoaded) return mlSession !== null;

    try {
        loadVocab();
        mlSession = await ort.InferenceSession.create(ML_MODEL_PATH, {
            executionProviders: ['cpu'],
        });
        mlModelLoaded = true;
        console.log("[SMS] DistilBERT ONNX model loaded successfully");
        return true;
    } catch (error) {
        console.error("[SMS] Failed to load ML model:", error.message);
        mlModelLoaded = true;
        return false;
    }
};

const tokenize = (text) => {
    if (!vocab) return null;

    const tokens = ["[CLS]"];
    const words = text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 0);

    for (const word of words) {
        if (vocabMap[word] !== undefined) {
            tokens.push(word);
        } else {
            let remaining = word;
            while (remaining.length > 0) {
                let found = false;
                for (let end = remaining.length; end > 0; end--) {
                    const subword = (tokens.length > 1 && remaining !== word ? "##" : "") + remaining.slice(0, end);
                    if (vocabMap[subword] !== undefined) {
                        tokens.push(subword);
                        remaining = remaining.slice(end);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    tokens.push("[UNK]");
                    break;
                }
            }
        }
        if (tokens.length >= MAX_LENGTH - 1) break;
    }

    tokens.push("[SEP]");
    return tokens;
};

const tokensToIds = (tokens) => {
    const inputIds = new BigInt64Array(MAX_LENGTH).fill(BigInt(0));
    const attentionMask = new BigInt64Array(MAX_LENGTH).fill(BigInt(0));

    for (let i = 0; i < Math.min(tokens.length, MAX_LENGTH); i++) {
        const id = vocabMap[tokens[i]] ?? vocabMap["[UNK]"] ?? 100;
        inputIds[i] = BigInt(id);
        attentionMask[i] = BigInt(1);
    }

    return { inputIds, attentionMask };
};

const softmax = (logits) => {
    const maxLogit = Math.max(...logits);
    const expScores = logits.map(l => Math.exp(l - maxLogit));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(e => e / sumExp);
};

const classifyWithMLModel = async (messages) => {
    if (!ML_MODEL_ENABLED) return null;

    const modelReady = await loadMLModel();
    if (!modelReady || !mlSession) return null;

    try {
        const results = [];

        for (const msg of messages) {
            const tokens = tokenize(msg.body || "");
            if (!tokens) {
                results.push({ is_transactional: false, confidence: 0, transaction_type: null, entities: null });
                continue;
            }

            const { inputIds, attentionMask } = tokensToIds(tokens);

            const inputIdsTensor = new ort.Tensor("int64", inputIds, [1, MAX_LENGTH]);
            const attentionMaskTensor = new ort.Tensor("int64", attentionMask, [1, MAX_LENGTH]);

            const feeds = { input_ids: inputIdsTensor, attention_mask: attentionMaskTensor };
            const output = await mlSession.run(feeds);

            const logits = Array.from(output.logits.data);
            const probs = softmax(logits);

            const isTransactional = probs[1] > probs[0];
            const confidence = Math.max(probs[0], probs[1]);

            results.push({
                is_transactional: isTransactional && confidence >= ML_CONFIDENCE_THRESHOLD,
                confidence: confidence,
                transaction_type: isTransactional ? detectTransactionType(msg.body) : null,
                entities: isTransactional ? extractEntities(msg.body) : null,
            });
        }

        return results;
    } catch (error) {
        console.error("[SMS] ML inference error:", error.message);
        return null;
    }
};

const detectTransactionType = (text) => {
    const lower = text.toLowerCase();
    const creditPatterns = /credited|received|refund|cashback|deposit|cr\b/i;
    const debitPatterns = /debited|spent|paid|sent|withdrawn|purchase|dr\b/i;

    if (creditPatterns.test(lower)) return "credit";
    if (debitPatterns.test(lower)) return "debit";
    return "debit";
};

const extractEntities = (text) => {
    const entities = {};

    const amountMatch = text.match(/(?:Rs\.?|INR|₹|rs)[\s.]*([\d,]+\.?\d*)/i);
    if (amountMatch) entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    const accountMatch = text.match(/(?:a\/c|account|card|acct|ac)[\s\S]*?[xX*]*(\d{4})/i);
    if (accountMatch) entities.account_last4 = accountMatch[1];

    const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dateMatch) entities.date = dateMatch[1];

    const merchantMatch = text.match(/(?:to|at|@)\s*([A-Za-z0-9\s]+?)(?:\s+on|\s+ref|\s+upi|$|\.|,)/i);
    if (merchantMatch) entities.merchant = merchantMatch[1].trim();

    const refMatch = text.match(/(?:ref|txn|upi ref|reference)[:\s#]*([A-Za-z0-9]+)/i);
    if (refMatch) entities.reference = refMatch[1];

    return entities;
};

const mlResultToTransaction = (mlResult, rawMessage) => {
    if (!mlResult.is_transactional || mlResult.confidence < ML_CONFIDENCE_THRESHOLD) {
        return null;
    }

    if (!mlResult.entities || !mlResult.entities.amount) {
        return null;
    }

    const confidenceLevel = mlResult.confidence >= 0.9 ? "high"
        : mlResult.confidence >= 0.7 ? "medium"
            : "low";

    return {
        amount: mlResult.entities.amount,
        type: mlResult.transaction_type || "debit",
        merchant: mlResult.entities.merchant || null,
        description: mlResult.entities.merchant
            ? `${mlResult.transaction_type === "credit" ? "From" : "To"} ${mlResult.entities.merchant}`
            : `${mlResult.transaction_type === "credit" ? "Credit" : "Debit"} transaction`,
        date: mlResult.entities.date || null,
        account: mlResult.entities.account_last4 || null,
        source: "sms",
        confidence: confidenceLevel,
        rawMessage: rawMessage.substring(0, 150),
        reference: mlResult.entities.reference || null,
    };
};

export const parseTransactionSms = async (messages) => {
    if (!messages || messages.length === 0) {
        return [];
    }

    if (ML_MODEL_ENABLED) {
        console.log("[SMS] Using DistilBERT model for classification");
        const mlResults = await classifyWithMLModel(messages);

        if (mlResults && mlResults.length > 0) {
            const transactions = [];

            for (let i = 0; i < mlResults.length; i++) {
                const transaction = mlResultToTransaction(mlResults[i], messages[i]?.body || "");
                if (transaction) {
                    transactions.push(transaction);
                }
            }

            console.log(`[SMS] ML model extracted ${transactions.length} transactions from ${messages.length} messages`);
            return transactions;
        }

        console.log("[SMS] ML model returned no results, falling back");
    }

    if (isLLMEnabled()) {
        return parseWithLLM(messages);
    }

    return parseWithRegex(messages);
};

const parseWithLLM = async (messages) => {
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
        reference: /(?:ref|txn|upi ref|reference)[:\s#]*([A-Za-z0-9]+)/i,
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

            const refMatch = body.match(patterns.reference);
            if (refMatch) transaction.reference = refMatch[1];

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

export const getSmsParsingConfig = () => ({
    mlModelEnabled: ML_MODEL_ENABLED,
    mlModelPath: ML_MODEL_PATH,
    vocabPath: VOCAB_PATH,
    mlModelLoaded: mlModelLoaded && mlSession !== null,
    vocabLoaded: vocab !== null,
    llmEnabled: isLLMEnabled(),
    confidenceThreshold: ML_CONFIDENCE_THRESHOLD,
    maxLength: MAX_LENGTH,
});
