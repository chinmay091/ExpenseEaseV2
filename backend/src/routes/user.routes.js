import { Router } from "express";
import {
    getCurrentUserController,
    deleteCurrentUserController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/me", getCurrentUserController);
router.delete("/me", deleteCurrentUserController);

export default router;