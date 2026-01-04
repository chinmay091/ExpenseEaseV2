import jwt from "jsonwebtoken";
import crypto from "crypto";

// Access Token - short lived (for API authentication)
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { 
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" 
    });
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// Refresh Token - long lived (for getting new access tokens)
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" 
    });
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Helper to decode token without verification (to get expiry)
export const decodeToken = (token) => {
    return jwt.decode(token);
};

// Generate a random token string for additional security
export const generateTokenHash = () => {
    return crypto.randomBytes(32).toString("hex");
};

// Legacy functions for backward compatibility (deprecated)
export const generateToken = (payload) => {
    console.warn("generateToken is deprecated, use generateAccessToken instead");
    return generateAccessToken(payload);
};

export const verifyToken = (token) => {
    console.warn("verifyToken is deprecated, use verifyAccessToken instead");
    return verifyAccessToken(token);
};