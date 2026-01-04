import { signupUser, loginUser, refreshTokens, logoutUser } from "../services/auth.service.js";

export const signupController = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        const { user, accessToken, refreshToken } = await signupUser({ name, email, password });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                }
            }
        });
    } catch (error) {
        console.error(error);

        if (error.message === "USER_ALREADY_EXISTS") {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to register user",
        });
    }
};

export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const { user, accessToken, refreshToken } = await loginUser({ email, password });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        console.error(error);

        if (error.message === "USER_NOT_FOUND" || error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to login user",
        });
    }
};

export const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required.",
            });
        }

        const { accessToken, refreshToken: newRefreshToken } = await refreshTokens({ refreshToken });

        res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error) {
        console.error(error);

        if (error.message === "INVALID_REFRESH_TOKEN" || error.message === "REFRESH_TOKEN_REVOKED") {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token. Please login again.",
                code: "REFRESH_TOKEN_INVALID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to refresh tokens",
        });
    }
};

export const logoutController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { refreshToken, logoutAll } = req.body;

        if (logoutAll) {
            // Logout from all devices
            await logoutUser({ userId });
        } else if (refreshToken) {
            // Logout from current device only
            await logoutUser({ userId, refreshToken });
        } else {
            // Logout from all devices if no specific token provided
            await logoutUser({ userId });
        }

        res.status(200).json({
            success: true,
            message: logoutAll ? "Logged out from all devices" : "Logged out successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to logout",
        });
    }
};