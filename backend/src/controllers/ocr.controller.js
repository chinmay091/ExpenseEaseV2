import { extractTextFromImage, parseReceiptData } from '../services/ocr.service.js';

export const extractFromImage = async (req, res) => {
    try {
        console.log('[OCR] Received extract request');
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image data is required',
            });
        }

        console.log('[OCR] Image data length:', image.length);

        // Remove data URL prefix if present
        const base64Data = image.includes('base64,')
            ? image.split('base64,')[1]
            : image;

        console.log('[OCR] Base64 data length:', base64Data.length);

        // Extract text from image
        const extractedData = await extractTextFromImage(base64Data);
        console.log('[OCR] Extraction complete');

        // Parse into expense format
        const expenseData = parseReceiptData(extractedData);
        console.log('[OCR] Parsed expense:', expenseData);

        return res.status(200).json({
            success: true,
            data: {
                extracted: extractedData,
                expense: expenseData,
            },
        });
    } catch (error) {
        console.error('[OCR] Extraction error:', error);
        console.error('[OCR] Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Failed to process image',
            message: error.message,
        });
    }
};
