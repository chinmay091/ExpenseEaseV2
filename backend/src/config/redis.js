import Redis from "ioredis";
import crypto from "crypto";

let client = null;
let isConnected = false;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DEFAULT_TTL = 3600;

export const initRedis = async () => {
    if (client) return client;

    try {
        client = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn("[REDIS] Retry limit reached");
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
        });

        client.on("error", (err) => {
            console.error("[REDIS] Connection error:", err.message);
            isConnected = false;
        });

        client.on("connect", () => {
            console.log("[REDIS] Connected");
            isConnected = true;
        });

        await new Promise((resolve, reject) => {
            client.once("ready", resolve);
            client.once("error", reject);
        });

        return client;
    } catch (error) {
        console.error("[REDIS] Failed to connect:", error.message);
        isConnected = false;
        return null;
    }
};

export const getRedisClient = () => client;

export const redisClient = {
    sendCommand: (...args) => client?.call(...args),
};

export const isRedisConnected = () => isConnected;

const hashKey = (input) => {
    return crypto.createHash("md5").update(input).digest("hex");
};

export const getCached = async (prefix, key) => {
    if (!isConnected || !client) return null;

    try {
        const cacheKey = `${prefix}:${hashKey(key)}`;
        const cached = await client.get(cacheKey);
        if (cached) {
            console.log(`[CACHE] Hit: ${prefix}`);
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error("[CACHE] Get error:", error.message);
        return null;
    }
};

export const setCache = async (prefix, key, value, ttl = DEFAULT_TTL) => {
    if (!isConnected || !client) return false;

    try {
        const cacheKey = `${prefix}:${hashKey(key)}`;
        await client.setex(cacheKey, ttl, JSON.stringify(value));
        console.log(`[CACHE] Set: ${prefix} (TTL: ${ttl}s)`);
        return true;
    } catch (error) {
        console.error("[CACHE] Set error:", error.message);
        return false;
    }
};

export const invalidateCache = async (prefix) => {
    if (!isConnected || !client) return;

    try {
        const keys = await client.keys(`${prefix}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
            console.log(`[CACHE] Invalidated ${keys.length} keys for ${prefix}`);
        }
    } catch (error) {
        console.error("[CACHE] Invalidate error:", error.message);
    }
};

export const CACHE_KEYS = {
    SMS_PARSE: "sms_parse",
    EMAIL_PARSE: "email_parse",
    BUDGET_EXPLAIN: "budget_explain",
    ANALYTICS: "analytics",
};

export const CACHE_TTL = {
    SMS_PARSE: 86400,
    EMAIL_PARSE: 86400,
    BUDGET_EXPLAIN: 3600,
    ANALYTICS: 1800,
};

export { client as ioredisClient };
