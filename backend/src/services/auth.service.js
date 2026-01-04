import { User, RefreshToken } from "../models/index.js";
import { hashedPassword, comparePassword } from "../utils/password.util.js";
import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken,
    decodeToken 
} from "../utils/jwt.util.js";
import { Op } from "sequelize";

// Helper to create and store refresh token
const createRefreshTokenForUser = async (userId) => {
    const refreshToken = generateRefreshToken({ id: userId });
    const decoded = decodeToken(refreshToken);
    
    // Store refresh token in database
    await RefreshToken.create({
        token: refreshToken,
        userId: userId,
        expiresAt: new Date(decoded.exp * 1000), // Convert Unix timestamp to Date
    });
    
    return refreshToken;
};

// Helper to generate both tokens
const generateTokens = async (userId) => {
    const accessToken = generateAccessToken({ id: userId });
    const refreshToken = await createRefreshTokenForUser(userId);
    
    return { accessToken, refreshToken };
};

export const signupUser = async ({ name, email, password }) => {
    const existing = await User.findOne({ where: { email }});

    if (existing) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    const hashed = await hashedPassword(password);

    const user = await User.create({
        name,
        email,
        password: hashed,
    });

    const { accessToken, refreshToken } = await generateTokens(user.id);

    return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ where: { email }});

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    const valid = await comparePassword(password, user.password);

    if (!valid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const { accessToken, refreshToken } = await generateTokens(user.id);

    return { user, accessToken, refreshToken }; 
};

export const refreshTokens = async ({ refreshToken }) => {
    // Verify the refresh token is valid JWT
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    // Check if token exists in database (not revoked)
    const storedToken = await RefreshToken.findOne({
        where: {
            token: refreshToken,
            userId: decoded.id,
            expiresAt: { [Op.gt]: new Date() }, // Not expired
        },
    });

    if (!storedToken) {
        // Token was revoked or doesn't exist - potential token reuse attack
        // Optionally: revoke all tokens for this user for security
        await RefreshToken.destroy({ where: { userId: decoded.id } });
        throw new Error("REFRESH_TOKEN_REVOKED");
    }

    // Delete the old refresh token (token rotation)
    await storedToken.destroy();

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.id);

    return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async ({ userId, refreshToken }) => {
    // If refreshToken provided, only delete that specific token
    if (refreshToken) {
        await RefreshToken.destroy({
            where: {
                token: refreshToken,
                userId: userId,
            },
        });
    } else {
        // Otherwise delete all refresh tokens for user (logout from all devices)
        await RefreshToken.destroy({
            where: { userId: userId },
        });
    }

    return true;
};

// Cleanup expired tokens (can be called by a cron job)
export const cleanupExpiredTokens = async () => {
    const deleted = await RefreshToken.destroy({
        where: {
            expiresAt: { [Op.lt]: new Date() },
        },
    });
    
    return deleted;
};