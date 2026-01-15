import { Router } from "express";
import { mlPredictController, getConfigController } from "../controllers/mlStub.controller.js";

const router = Router();

router.post("/predict", mlPredictController);
router.get("/config", getConfigController);

export default router;