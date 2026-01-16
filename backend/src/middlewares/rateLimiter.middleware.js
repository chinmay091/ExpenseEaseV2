import rateLimit from "express-rate-limit";

const getKey = (req, prefix = "") => {
    if (req.user?.id) {
        return prefix ? `${prefix}:${req.user.id}` : req.user.id;
    }
    return prefix ? `${prefix}:anonymous` : "anonymous";
};

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, error: "Too many requests, please try again later.", code: "RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getKey(req),
});

export const llmLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { success: false, error: "LLM rate limit exceeded. Please wait before making more AI requests.", code: "LLM_RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getKey(req, "llm"),
    skip: (req) => process.env.LLM_ENABLED !== "true",
    handler: (req, res) => {
        console.warn(`[RATE_LIMIT] LLM limit exceeded for user: ${req.user?.id || "anonymous"}`);
        res.status(429).json({
            success: false,
            error: "You've made too many AI requests. Please wait a moment.",
            code: "LLM_RATE_LIMITED",
            retryAfter: 60,
        });
    },
});

export const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, error: "Chat rate limit exceeded.", code: "CHAT_RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getKey(req, "chat"),
});

export const budgetGenerateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: { success: false, error: "Budget generation limit exceeded. Try again in a few minutes.", code: "BUDGET_GEN_RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getKey(req, "budget"),
});

export const ocrLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, error: "OCR rate limit exceeded.", code: "OCR_RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getKey(req, "ocr"),
});

export const smsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: "SMS parsing rate limit exceeded.", code: "SMS_RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getKey(req, "sms"),
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: "Too many auth attempts. Try again later.", code: "AUTH_RATE_LIMITED" },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
