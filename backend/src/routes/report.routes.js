import { Router } from "express";
import {
    getReportHandler,
    downloadCSVHandler,
    getPeriodsHandler,
} from "../controllers/report.controller.js";

const router = Router();

router.get("/", getReportHandler);
router.get("/csv", downloadCSVHandler);
router.get("/periods", getPeriodsHandler);

export default router;
