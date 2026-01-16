import { DEFAULT_CATEGORY_KEYWORDS, DEFAULT_CATEGORY } from "../constants/categoryMappings.js";
import Category from "../models/category.model.js";
import Expense from "../models/expense.model.js";
import { Op, fn, col, literal } from "sequelize";

const userMerchantCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const normalizeText = (text) => {
    return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
};

const extractMerchant = (text) => {
    const normalized = normalizeText(text);

    const merchantPatterns = [
        /(?:to|at|@)\s+([a-z0-9\s]+?)(?:\s+on|\s+ref|\s+upi|$)/i,
        /(?:paid|sent|received)\s+(?:to|from)\s+([a-z0-9\s]+)/i,
    ];

    for (const pattern of merchantPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return normalizeText(match[1]);
        }
    }

    return normalized;
};

export const classifyByKeywords = (text) => {
    const normalized = normalizeText(text);

    for (const [category, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword.toLowerCase())) {
                return {
                    category,
                    confidence: "high",
                    matchedKeyword: keyword,
                    source: "default_keywords",
                };
            }
        }
    }

    return null;
};

export const getUserMerchantMappings = async (userId) => {
    const cacheKey = `user:${userId}`;
    const cached = userMerchantCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.mappings;
    }

    try {
        const expenses = await Expense.findAll({
            where: { userId },
            attributes: [
                "description",
                "categoryId",
                [fn("COUNT", col("id")), "count"],
            ],
            group: ["description", "categoryId"],
            having: literal("COUNT(id) >= 2"),
            order: [[literal("count"), "DESC"]],
            limit: 100,
            raw: true,
        });

        const categories = await Category.findAll({ raw: true });
        const categoryMap = {};
        categories.forEach(c => { categoryMap[c.id] = c.name; });

        const mappings = {};
        for (const exp of expenses) {
            const key = normalizeText(exp.description);
            if (key && !mappings[key]) {
                mappings[key] = {
                    categoryId: exp.categoryId,
                    categoryName: categoryMap[exp.categoryId] || DEFAULT_CATEGORY,
                    frequency: parseInt(exp.count),
                };
            }
        }

        userMerchantCache.set(cacheKey, {
            mappings,
            timestamp: Date.now(),
        });

        return mappings;
    } catch (error) {
        console.error("[CategoryClassifier] Error fetching user mappings:", error.message);
        return {};
    }
};

export const classifyTransaction = async (text, userId = null) => {
    const merchant = extractMerchant(text);

    if (userId) {
        const userMappings = await getUserMerchantMappings(userId);

        for (const [key, mapping] of Object.entries(userMappings)) {
            if (merchant.includes(key) || key.includes(merchant)) {
                return {
                    category: mapping.categoryName,
                    categoryId: mapping.categoryId,
                    confidence: "high",
                    source: "user_history",
                    matchedMerchant: key,
                    frequency: mapping.frequency,
                };
            }
        }
    }

    const keywordMatch = classifyByKeywords(text);
    if (keywordMatch) {
        return keywordMatch;
    }

    return {
        category: DEFAULT_CATEGORY,
        confidence: "low",
        source: "default",
    };
};

export const getCategoryIdByName = async (categoryName) => {
    try {
        const category = await Category.findOne({
            where: { name: { [Op.iLike]: categoryName } },
        });
        return category?.id || null;
    } catch (error) {
        console.error("[CategoryClassifier] Error finding category:", error.message);
        return null;
    }
};

export const classifyAndGetCategoryId = async (text, userId = null, fallbackCategoryId = null) => {
    const classification = await classifyTransaction(text, userId);

    if (classification.categoryId) {
        return {
            categoryId: classification.categoryId,
            ...classification,
        };
    }

    const categoryId = await getCategoryIdByName(classification.category);

    if (categoryId) {
        return {
            categoryId,
            ...classification,
        };
    }

    return {
        categoryId: fallbackCategoryId,
        category: DEFAULT_CATEGORY,
        confidence: "low",
        source: "fallback",
    };
};

export const invalidateUserCache = (userId) => {
    userMerchantCache.delete(`user:${userId}`);
};
