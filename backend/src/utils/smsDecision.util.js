import {
    HARD_NON_TRANSACTIONAL,
    SOFT_NEGATIVES,
    STRONG_POSITIVES,
    ML_CONFIG,
} from "../constants/smsPatterns.js";

export const quickRegexCheck = (text) => {
    const hasAmount = /(?:rs|inr|₹)[\s.]*[\d,]+\.?\d*/i.test(text);
    const hasDebitKeyword = /debited|spent|paid|sent|withdrawn|purchase|dr\b/i.test(text);
    const hasCreditKeyword = /credited|received|refund|cashback|deposit|cr\b/i.test(text);

    return {
        is_transactional: hasAmount && (hasDebitKeyword || hasCreditKeyword),
        type: hasCreditKeyword ? "credit" : "debit"
    };
};

export const checkHardNegatives = (text) => {
    const lower = text.toLowerCase();
    for (const kw of HARD_NON_TRANSACTIONAL) {
        if (lower.includes(kw)) {
            return { blocked: true, keyword: kw };
        }
    }
    return { blocked: false, keyword: null };
};

export const applySoftNegatives = (confidence, text) => {
    let adjustedConfidence = confidence;
    let appliedPenalties = [];

    for (const { pattern, penalty } of SOFT_NEGATIVES) {
        if (pattern.test(text)) {
            adjustedConfidence *= penalty;
            appliedPenalties.push({ pattern: pattern.toString(), penalty });
        }
    }

    return { adjustedConfidence, appliedPenalties };
};

export const checkStrongPositives = (text) => {
    return STRONG_POSITIVES.some(p => p.test(text));
};

export const finalDecision = (mlConfidence, text) => {
    const hardCheck = checkHardNegatives(text);
    if (hardCheck.blocked) {
        return {
            is_transactional: false,
            confidence: mlConfidence,
            reason: "hard_negative_keyword",
            blocked_by: hardCheck.keyword
        };
    }

    const { adjustedConfidence } = applySoftNegatives(mlConfidence, text);
    const hasStrongPositive = checkStrongPositives(text);

    if (adjustedConfidence >= ML_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
        return {
            is_transactional: true,
            confidence: adjustedConfidence,
            reason: "high_confidence_ml"
        };
    }

    if (adjustedConfidence <= ML_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
        if (hasStrongPositive) {
            return {
                is_transactional: true,
                confidence: ML_CONFIG.RESCUE_CONFIDENCE,
                reason: "strong_positive_rescue"
            };
        }
        return {
            is_transactional: false,
            confidence: adjustedConfidence,
            reason: "low_confidence_ml"
        };
    }

    const regexResult = quickRegexCheck(text);
    return {
        is_transactional: regexResult.is_transactional,
        confidence: adjustedConfidence,
        reason: "regex_fallback",
        regex_type: regexResult.type
    };
};
