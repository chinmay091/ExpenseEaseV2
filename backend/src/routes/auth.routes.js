import { Router } from "express";
import {
    signupController,
    loginController,
    refreshTokenController,
    logoutController
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);

router.post("/logout", authMiddleware, logoutController);

export default router;