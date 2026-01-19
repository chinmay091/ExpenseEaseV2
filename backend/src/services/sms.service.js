import { classifyByKeywords } from "../utils/categoryClassifier.util.js";
import { loadVocab, isVocabLoaded, tokenize, tokensToIds, softmax } from "../utils/tokenizer.util.js";
import { finalDecision, quickRegexCheck } from "../utils/smsDecision.util.js";
import { extractEntities, buildDescription, getConfidenceLevel } from "../utils/smsParser.util.js";
import { REGEX_PATTERNS, BANK_KEYWORDS, ML_CONFIG, isOfficialBankSender } from "../constants/smsPatterns.js";
import { isLLMEnabled } from "../utils/llm.util.js";
import * as ort from "onnxruntime-node";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const ML_MODEL_ENABLED = process.env.SMS_ML_MODEL_ENABLED === "true";
const ML_MODEL_PATH = process.env.SMS_ML_MODEL_PATH || path.join(PROJECT_ROOT, "ML/sms_classifier.onnx");
const VOCAB_PATH = process.env.SMS_VOCAB_PATH || path.join(PROJECT_ROOT, "ML/sms_model/vocab.txt");

let mlSession = null;
let mlModelLoaded = false;

const loadMLModel = async () => {
    if (mlModelLoaded) return mlSession !== null;

    try {
        loadVocab(VOCAB_PATH);
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

const classifyWithMLModel = async (messages) => {
    if (!ML_MODEL_ENABLED) return null;

    const modelReady = await loadMLModel();
    if (!modelReady || !mlSession) return null;

    try {
        const results = [];

        for (const msg of messages) {
            const body = msg.body || "";
            const tokens = tokenize(body, ML_CONFIG.MAX_LENGTH);

            if (!tokens) {
                results.push({
                    is_transactional: false,
                    confidence: 0,
                    transaction_type: null,
                    entities: null,
                    decision: { reason: "tokenization_failed" }
                });
                continue;
            }

            const { inputIds, attentionMask } = tokensToIds(tokens, ML_CONFIG.MAX_LENGTH);
            const inputIdsTensor = new ort.Tensor("int64", inputIds, [1, ML_CONFIG.MAX_LENGTH]);
            const attentionMaskTensor = new ort.Tensor("int64", attentionMask, [1, ML_CONFIG.MAX_LENGTH]);

            const feeds = { input_ids: inputIdsTensor, attention_mask: attentionMaskTensor };
            const output = await mlSession.run(feeds);

            const logits = Array.from(output.logits.data);
            const probs = softmax(logits);

            // 3-class model: probs[0]=NotTransaction, probs[1]=Debit, probs[2]=Credit
            const transactionProb = probs[1] + probs[2]; // Combined Debit + Credit probability
            const mlTransactionType = probs[1] > probs[2] ? "debit" : "credit";

            const decision = finalDecision(transactionProb, body);

            results.push({
                is_transactional: decision.is_transactional,
                confidence: decision.confidence,
                // Use ML-predicted transaction type instead of regex-based detection
                transaction_type: decision.is_transactional ? mlTransactionType : null,
                entities: decision.is_transactional ? extractEntities(body) : null,
                decision,
                ml_probs: { notTransaction: probs[0], debit: probs[1], credit: probs[2] },
            });
        }

        return results;
    } catch (error) {
        console.error("[SMS] ML inference error:", error.message);
        return null;
    }
};

const mlResultToTransaction = (mlResult, rawMessage) => {
    if (!mlResult.is_transactional || !mlResult.entities?.amount) {
        return null;
    }

    const categoryMatch = classifyByKeywords(rawMessage);

    return {
        amount: mlResult.entities.amount,
        type: mlResult.transaction_type || "debit",
        merchant: mlResult.entities.merchant || null,
        description: buildDescription(mlResult.entities.merchant, mlResult.transaction_type),
        date: mlResult.entities.date || null,
        account: mlResult.entities.account_last4 || null,
        source: "sms",
        confidence: getConfidenceLevel(mlResult.confidence),
        rawMessage: rawMessage.substring(0, 150),
        reference: mlResult.entities.reference || null,
        decision_reason: mlResult.decision?.reason || "unknown",
        suggestedCategory: categoryMatch?.category || null,
        categoryMatchSource: categoryMatch?.source || null,
        categoryMatchKeyword: categoryMatch?.matchedKeyword || null,
    };
};

export const parseTransactionSms = async (messages) => {
    if (!messages || messages.length === 0) {
        return [];
    }

    if (ML_MODEL_ENABLED) {
        console.log("[SMS] Using DistilBERT model with hybrid decision logic");
        const mlResults = await classifyWithMLModel(messages);

        if (mlResults?.length > 0) {
            const transactions = [];
            let stats = { accepted: 0, rejected: 0, rescued: 0 };

            for (let i = 0; i < mlResults.length; i++) {
                const result = mlResults[i];
                if (result.decision?.reason === "strong_positive_rescue") stats.rescued++;
                else if (result.is_transactional) stats.accepted++;
                else stats.rejected++;

                const transaction = mlResultToTransaction(result, messages[i]?.body || "");
                if (transaction) transactions.push(transaction);
            }

            console.log(`[SMS] ML hybrid: ${stats.accepted} accepted, ${stats.rejected} rejected, ${stats.rescued} rescued`);
            return transactions;
        }

        console.log("[SMS] ML model returned no results, falling back to regex");
    }

    return parseWithRegex(messages);
};

const parseWithRegex = (messages) => {
    const transactions = [];

    for (const msg of messages) {
        const body = msg.body || '';

        const decision = finalDecision(0.5, body);
        if (!decision.is_transactional && decision.reason === "hard_negative_keyword") {
            continue;
        }

        let transaction = null;

        const svcDebitMatch = body.match(REGEX_PATTERNS.svcDebit);
        const svcCreditMatch = body.match(REGEX_PATTERNS.svcCredit);

        if (svcDebitMatch) {
            transaction = { amount: parseFloat(svcDebitMatch[1].replace(/,/g, '')), type: 'debit', description: 'Debit transaction' };
        } else if (svcCreditMatch) {
            transaction = { amount: parseFloat(svcCreditMatch[1].replace(/,/g, '')), type: 'credit', description: 'Credit transaction' };
        }

        if (!transaction) {
            const debitMatch = body.match(REGEX_PATTERNS.debit) || body.match(REGEX_PATTERNS.debitAlt) || body.match(REGEX_PATTERNS.upiDebit);
            const creditMatch = body.match(REGEX_PATTERNS.credit) || body.match(REGEX_PATTERNS.creditAlt);

            if (creditMatch && !debitMatch) {
                transaction = { amount: parseFloat(creditMatch[1].replace(/,/g, '')), type: 'credit', description: 'Credit transaction' };
            } else if (debitMatch) {
                transaction = { amount: parseFloat(debitMatch[1].replace(/,/g, '')), type: 'debit', description: 'Debit transaction' };
            } else {
                const amountMatch = body.match(REGEX_PATTERNS.amount);
                if (amountMatch && body.toLowerCase().includes('bank')) {
                    const isCredit = /credit|receive|deposit|cr\b/i.test(body);
                    transaction = { amount: parseFloat(amountMatch[1].replace(/,/g, '')), type: isCredit ? 'credit' : 'debit', description: 'Bank transaction' };
                }
            }
        }

        if (transaction?.amount > 0) {
            const accountMatch = body.match(REGEX_PATTERNS.account);
            if (accountMatch) transaction.account = accountMatch[1];

            const dateMatch = body.match(REGEX_PATTERNS.date);
            if (dateMatch) transaction.date = dateMatch[1];

            const merchantMatch = body.match(REGEX_PATTERNS.merchant);
            if (merchantMatch) {
                transaction.merchant = merchantMatch[1].trim();
                transaction.description = `To ${transaction.merchant}`;
            }

            const refMatch = body.match(REGEX_PATTERNS.reference);
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
    return messages.filter(msg => {
        const body = (msg.body || '').toLowerCase();
        const sender = msg.address || msg.sender || '';

        // Check if message is from an official bank sender
        const isFromBank = isOfficialBankSender(sender);

        // If sender validation is available and sender is not a bank, skip
        if (sender && !isFromBank) {
            console.log(`[SMS] Skipping message from non-bank sender: ${sender}`);
            return false;
        }

        // Still check for bank keywords in the body
        return BANK_KEYWORDS.some(keyword => body.includes(keyword));
    });
};

export const classifySingleMessage = async (text) => {
    if (!ML_MODEL_ENABLED) {
        const regexResult = quickRegexCheck(text);
        return {
            text,
            is_transactional: regexResult.is_transactional,
            confidence: 0.5,
            reason: "ml_disabled_regex_only",
            entities: regexResult.is_transactional ? extractEntities(text) : null,
        };
    }

    const results = await classifyWithMLModel([{ body: text }]);
    if (results?.length > 0) {
        const categoryMatch = classifyByKeywords(text);
        return {
            text,
            ...results[0],
            suggestedCategory: categoryMatch?.category || null,
            categoryMatchKeyword: categoryMatch?.matchedKeyword || null,
        };
    }

    return {
        text,
        is_transactional: false,
        confidence: 0,
        reason: "ml_inference_failed",
    };
};

export const getSmsParsingConfig = () => ({
    mlModelEnabled: ML_MODEL_ENABLED,
    mlModelPath: ML_MODEL_PATH,
    vocabPath: VOCAB_PATH,
    mlModelLoaded: mlModelLoaded && mlSession !== null,
    vocabLoaded: isVocabLoaded(),
    llmEnabled: isLLMEnabled(),
    ...ML_CONFIG,
});
