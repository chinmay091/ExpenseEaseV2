export const HARD_NON_TRANSACTIONAL = [
    "otp", "one time password", "verification code", "login code", "security code",
    "valid for", "expires in", "do not share", "never share",
    "promo code", "offer code", "discount code", "coupon code", "use code",
    "balance is", "available balance", "avl bal", "closing balance", "current balance",
    "emi due", "bill due", "payment due", "due date", "reminder:",
    "welcome to", "thank you for registering", "successfully registered",
    "track your order", "order delivered", "shipment", "out for delivery",
    "your subscription", "renew your", "plan expires",
    "login attempt", "password reset", "account locked", "suspicious activity",
    "free trial", "upgrade to premium", "special offer",
];

export const SOFT_NEGATIVES = [
    { pattern: /balance.*(?:is|:)\s*(?:rs|inr|₹)/i, penalty: 0.4 },
    { pattern: /available.*balance/i, penalty: 0.4 },
    { pattern: /minimum.*balance/i, penalty: 0.3 },
    { pattern: /check.*balance/i, penalty: 0.3 },
    { pattern: /rewards?\s*(?:points?|balance)/i, penalty: 0.5 },
];

export const STRONG_POSITIVES = [
    /(?:debited|credited).*(?:rs|inr|₹)[\s.]*[\d,]+/i,
    /(?:rs|inr|₹)[\s.]*[\d,]+.*(?:debited|credited|spent|paid|received)/i,
    /(?:sent|paid|received).*(?:rs|inr|₹)[\s.]*[\d,]+.*(?:to|from|via)/i,
    /upi.*(?:ref|txn|id)/i,
    /(?:imps|neft|rtgs).*(?:rs|inr|₹)/i,
    /a\/c\s*[xX*]+\d{4}.*(?:debited|credited)/i,
];

export const BANK_KEYWORDS = [
    "debited", "credited", "transaction", "payment", "spent",
    "received", "transfer", "withdrawn", "balance", "upi",
    "neft", "imps", "rtgs", "atm", "purchase", "refund",
    "cashback", "a/c", "account", "bank", "card"
];

export const REGEX_PATTERNS = {
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

// Explicit transaction type patterns - ONLY match actual transaction keywords
// DO NOT include cr\b or dr\b as these often match balance notations like "Bal: Rs.1000 Cr."
export const CREDIT_PATTERNS = /\b(credited|received|refund|cashback|deposited)\b/i;
export const DEBIT_PATTERNS = /\b(debited|spent|paid|sent|withdrawn|purchase|transferred|deducted)\b/i;

// Balance notation patterns (should NOT be used for transaction type detection)
export const BALANCE_CREDIT_INDICATOR = /(?:bal|balance)[.\s:]*(?:rs|inr|₹)?[.\s]*[\d,]+[.\s]*cr\b/i;

export const ML_CONFIG = {
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_LENGTH: 128,
    HIGH_CONFIDENCE_THRESHOLD: 0.85,
    LOW_CONFIDENCE_THRESHOLD: 0.30,
    RESCUE_CONFIDENCE: 0.6,
};

// Official bank sender ID patterns (Indian banks)
// Format: XX-XXXXXX where XX is prefix (AD/AM/VM/VD etc.) and XXXXXX is bank code
export const OFFICIAL_BANK_SENDERS = [
    // Major bank patterns
    /^[AV][DM]-SBI/i,           // State Bank of India
    /^[AV][DM]-HDFC/i,          // HDFC Bank
    /^[AV][DM]-ICICI/i,         // ICICI Bank
    /^[AV][DM]-AXIS/i,          // Axis Bank
    /^[AV][DM]-KOTAK/i,         // Kotak Mahindra Bank
    /^[AV][DM]-PNBSMS/i,        // Punjab National Bank
    /^[AV][DM]-BOBIN/i,         // Bank of Baroda
    /^[AV][DM]-CANBNK/i,        // Canara Bank
    /^[AV][DM]-UNIONB/i,        // Union Bank
    /^[AV][DM]-IDFCFB/i,        // IDFC First Bank
    /^[AV][DM]-YESBK/i,         // Yes Bank
    /^[AV][DM]-INDUSB/i,        // IndusInd Bank
    /^[AV][DM]-FEDERL/i,        // Federal Bank
    /^[AV][DM]-PAYTMB/i,        // Paytm Payments Bank
    /^[AV][DM]-AIRTEL/i,        // Airtel Payments Bank
    /^[AV][DM]-JIOBNK/i,        // Jio Payments Bank
    // SVC Bank (from example message)
    /^[AV][DM]-SVCBNK/i,        // SVC Co-operative Bank
    /^[AV][DM]-SVCOBL/i,        // SVC Bank alternate
    // Generic bank patterns (6+ alphanumeric after prefix)
    /^[AV][DM]-[A-Z]{4,}BK/i,   // Standard bank format ending with BK
    /^[AV][DM]-[A-Z]{4,}BNK/i,  // Standard bank format ending with BNK
    /^[AV][DM]-[A-Z]{2,}BANK/i, // Standard bank format ending with BANK
    // UPI apps
    /^[AV][DM]-GPAY/i,          // Google Pay
    /^[AV][DM]-PAYTM/i,         // Paytm
    /^[AV][DM]-PHONEPE/i,       // PhonePe
    /^[AV][DM]-BHIM/i,          // BHIM UPI
];

// Function to check if sender is an official bank
export const isOfficialBankSender = (sender) => {
    if (!sender) return false;
    const cleaned = sender.trim().toUpperCase();
    return OFFICIAL_BANK_SENDERS.some(pattern => pattern.test(cleaned));
};
