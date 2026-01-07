import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const LLM_ENABLED = process.env.LLM_ENABLED === "true";

const createLLM = (options = {}) => {
    return new ChatGoogleGenerativeAI({
        model: options.model || "gemini-1.5-flash",
        temperature: options.temperature ?? 0.3,
        apiKey: process.env.GOOGLE_API_KEY,
        maxRetries: options.maxRetries ?? 2,
    });
};

const defaultLLM = createLLM();
const creativeLLM = createLLM({ temperature: 0.7 });
const preciseLLM = createLLM({ temperature: 0.2 });

export const getLLM = (type = "default") => {
    switch (type) {
        case "creative":
            return creativeLLM;
        case "precise":
            return preciseLLM;
        default:
            return defaultLLM;
    }
};

export const isLLMEnabled = () => LLM_ENABLED;

export const invokeLLM = async (messages, type = "default") => {
    if (!LLM_ENABLED) {
        return null;
    }

    try {
        const llm = getLLM(type);
        const response = await llm.invoke(messages);
        return typeof response.content === "string"
            ? response.content.trim()
            : response.content;
    } catch (error) {
        console.error("[LLM] Invoke error:", error.message);
        return null;
    }
};

export const extractJSON = (content, type = "object") => {
    if (!content) return null;

    try {
        const pattern = type === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
        const match = content.match(pattern);
        if (match) {
            return JSON.parse(match[0]);
        }
    } catch (error) {
        console.error("[LLM] JSON extraction error:", error.message);
    }
    return null;
};
