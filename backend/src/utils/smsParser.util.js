import { REGEX_PATTERNS, CREDIT_PATTERNS, DEBIT_PATTERNS } from "../constants/smsPatterns.js";

export const detectTransactionType = (text) => {
    const lower = text.toLowerCase();
    if (CREDIT_PATTERNS.test(lower)) return "credit";
    if (DEBIT_PATTERNS.test(lower)) return "debit";
    return "debit";
};

export const extractEntities = (text) => {
    const entities = {};

    const amountMatch = text.match(/(?:Rs\.?|INR|₹|rs)[\s.]*([0-9,]+\.?\d*)/i);
    if (amountMatch) entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    const accountMatch = text.match(REGEX_PATTERNS.account);
    if (accountMatch) entities.account_last4 = accountMatch[1];

    const dateMatch = text.match(REGEX_PATTERNS.date);
    if (dateMatch) entities.date = dateMatch[1];

    const merchantMatch = text.match(REGEX_PATTERNS.merchant);
    if (merchantMatch) entities.merchant = merchantMatch[1].trim();

    const refMatch = text.match(REGEX_PATTERNS.reference);
    if (refMatch) entities.reference = refMatch[1];

    return entities;
};

export const parseAmount = (amountString) => {
    if (!amountString) return null;
    return parseFloat(amountString.replace(/,/g, ''));
};

export const buildDescription = (merchant, transactionType) => {
    if (merchant) {
        return `${transactionType === "credit" ? "From" : "To"} ${merchant}`;
    }
    return `${transactionType === "credit" ? "Credit" : "Debit"} transaction`;
};

export const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return "high";
    if (confidence >= 0.7) return "medium";
    return "low";
};
