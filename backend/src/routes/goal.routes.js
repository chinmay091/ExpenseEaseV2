import { Router } from "express";
import {
    createGoalHandler,
    getGoalsHandler,
    getGoalByIdHandler,
    updateGoalHandler,
    deleteGoalHandler,
    addContributionHandler,
    getContributionsHandler,
} from "../controllers/goal.controller.js";

const router = Router();

router.post("/", createGoalHandler);
router.get("/", getGoalsHandler);
router.get("/:id", getGoalByIdHandler);
router.put("/:id", updateGoalHandler);
router.delete("/:id", deleteGoalHandler);

router.post("/:id/contribute", addContributionHandler);
router.get("/:id/contributions", getContributionsHandler);

export default router;
