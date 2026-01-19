import { Router } from "express";
import {
    getCurrentUserController,
    deleteCurrentUserController,
    setInitialBalanceController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/me", getCurrentUserController);
router.delete("/me", deleteCurrentUserController);
router.put("/balance", setInitialBalanceController);

export default router;