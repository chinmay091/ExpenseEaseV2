import { Router } from "express";
import { mlPredictController } from "../controllers/mlStub.controller.js";

const router = Router();

router.post("/ml/predict", mlPredictController);

export default router;