import fs from "fs";

let vocab = null;
let vocabMap = {};

export const loadVocab = (vocabPath) => {
    if (vocab) return true;
    try {
        const vocabText = fs.readFileSync(vocabPath, "utf-8");
        vocab = vocabText.split("\n").map(line => line.trim());
        vocab.forEach((token, idx) => { vocabMap[token] = idx; });
        console.log("[Tokenizer] Vocab loaded:", vocab.length, "tokens");
        return true;
    } catch (error) {
        console.error("[Tokenizer] Failed to load vocab:", error.message);
        return false;
    }
};

export const isVocabLoaded = () => vocab !== null;

export const getVocabMap = () => vocabMap;

export const tokenize = (text, maxLength = 128) => {
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
        if (tokens.length >= maxLength - 1) break;
    }

    tokens.push("[SEP]");
    return tokens;
};

export const tokensToIds = (tokens, maxLength = 128) => {
    const inputIds = new BigInt64Array(maxLength).fill(BigInt(0));
    const attentionMask = new BigInt64Array(maxLength).fill(BigInt(0));

    for (let i = 0; i < Math.min(tokens.length, maxLength); i++) {
        const id = vocabMap[tokens[i]] ?? vocabMap["[UNK]"] ?? 100;
        inputIds[i] = BigInt(id);
        attentionMask[i] = BigInt(1);
    }

    return { inputIds, attentionMask };
};

export const softmax = (logits) => {
    const maxLogit = Math.max(...logits);
    const expScores = logits.map(l => Math.exp(l - maxLogit));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(e => e / sumExp);
};
