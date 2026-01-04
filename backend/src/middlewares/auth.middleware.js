import { verifyAccessToken } from "../utils/jwt.util.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing.",
        code: "TOKEN_MISSING",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    // Check if token is expired vs invalid
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired. Please refresh your token.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid access token.",
      code: "TOKEN_INVALID",
    });
  }
};
