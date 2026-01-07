import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (base64Image) => {
    console.log('[OCR] Starting Tesseract OCR...');

    try {
        // Convert base64 to data URL format for Tesseract
        const imageData = `data:image/jpeg;base64,${base64Image}`;

        const result = await Tesseract.recognize(imageData, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });
        console.log('[OCR] Raw result keys:', Object.keys(result.data));

        // Use text and split by newlines (more reliable than lines array)
        const rawText = result.data.text || '';
        const textLines = rawText.split('\n').map(line => line.trim()).filter(Boolean);

        console.log('[OCR] Extracted lines:', textLines.length);
        console.log('[OCR] First 3 lines:', textLines.slice(0, 3));

        return {
            raw_text: textLines,
            confidence: result.data.confidence || 0,
        };
    } catch (error) {
        console.error('[OCR] Tesseract error:', error.message);
        throw new Error('Failed to extract text from image');
    }
};

export const parseReceiptData = (extractedData) => {
    const textLines = extractedData.raw_text || [];

    const result = {
        amount: extractTotalAmount(textLines),
        description: null,
        merchant: extractBusinessName(textLines),
        date: extractDate(textLines),
        type: 'debit',
        confidence: extractedData.confidence > 70 ? 'high' : 'low',
    };

    // Generate description from merchant
    if (result.merchant && result.merchant !== 'Not Found') {
        result.description = `Purchase at ${result.merchant}`;
    }

    return result;
};

const extractBusinessName = (textLines) => {
    const ignoreKeywords = new Set([
        'BILL', 'INVOICE', 'GSTIN', 'TAX', 'NO', 'DATE', 'TOTAL', 'DUE',
        'ORIGINALRECEPIENT', 'MOBILE', 'NUMBER', 'E.&O.E.', 'CUSTOMER',
        'TAX INVOICE', 'ITEM', 'QTY', 'AMOUNT', 'TABLE', 'ORDER TYPE',
        'SOURCE', 'CASHIER', 'POWERED', 'SGST', 'CGST', 'FSSAI', 'LICENSE',
        'SUB TOTAL', 'MODE OF PAYMENT', 'CASH', 'BILL TO', 'RECEIPT',
        'THANK', 'WELCOME', 'PHONE', 'TEL', 'FAX', 'ADDRESS'
    ]);

    // Step 1: Check first meaningful line
    for (const line of textLines) {
        const cleanLine = line.trim();
        if (cleanLine && cleanLine.length > 2) {
            const upperLine = cleanLine.toUpperCase();
            const hasIgnoreKeyword = [...ignoreKeywords].some(kw => upperLine.includes(kw));
            if (!hasIgnoreKeyword) {
                return cleanLine;
            }
        }
    }

    // Step 2: Find first ALL-CAPS business name
    for (const line of textLines) {
        const cleanLine = line.trim();
        if (/^[A-Z\s&]+$/.test(cleanLine) && cleanLine.length > 2) {
            return cleanLine;
        }
    }

    return 'Not Found';
};

const extractTotalAmount = (textLines) => {
    const patterns = [
        /(?:GRAND\s*)?TOTAL[\s:]*[₹$]?\s*(\d+[.,]?\d*)/i,
        /(?:AMOUNT|AMT)[\s:]*[₹$]?\s*(\d+[.,]?\d*)/i,
        /[₹$]\s*(\d+[.,]?\d*)/,
        /(\d+[.,]\d{2})\s*$/,
    ];

    // Join all text for pattern matching
    const fullText = textLines.join(' ');

    for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
            const amount = parseFloat(match[1].replace(',', ''));
            if (!isNaN(amount) && amount > 0) {
                return amount;
            }
        }
    }

    // Fallback: find the largest number that looks like a price
    let maxAmount = null;
    for (const line of textLines) {
        const matches = line.match(/(\d+[.,]?\d*)/g);
        if (matches) {
            for (const m of matches) {
                const num = parseFloat(m.replace(',', ''));
                if (!isNaN(num) && num > 0 && num < 1000000) {
                    if (!maxAmount || num > maxAmount) {
                        maxAmount = num;
                    }
                }
            }
        }
    }

    return maxAmount;
};

const extractDate = (textLines) => {
    // Common date patterns
    const patterns = [
        /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,           // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,             // YYYY-MM-DD
        /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
    ];

    const fullText = textLines.join(' ');

    for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};
