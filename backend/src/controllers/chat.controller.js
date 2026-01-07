import { processMessage, getSuggestedQuestions } from "../services/chat.service.js";

export const sendMessageHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const result = await processMessage(userId, message.trim(), history);

        return res.status(200).json({
            success: !result.error,
            data: {
                message: result.message,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Chat error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process message",
        });
    }
};

export const getSuggestionsHandler = async (req, res) => {
    try {
        const suggestions = getSuggestedQuestions();

        return res.status(200).json({
            success: true,
            data: suggestions,
        });
    } catch (error) {
        console.error("Suggestions error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get suggestions",
        });
    }
};
