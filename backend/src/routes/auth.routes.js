import { Router } from "express";
import {
    signupController,
    loginController,
    refreshTokenController,
    logoutController
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/signup", authLimiter, signupController);
router.post("/login", authLimiter, loginController);
router.post("/refresh", refreshTokenController);

router.post("/logout", authMiddleware, logoutController);

export default router;