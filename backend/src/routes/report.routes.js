import { Router } from "express";
import {
    getReportHandler,
    downloadCSVHandler,
    getPeriodsHandler,
} from "../controllers/report.controller.js";

const router = Router();

router.get("/", getReportHandler);         // GET /api/reports?year=2026&month=1
router.get("/csv", downloadCSVHandler);    // GET /api/reports/csv?year=2026&month=1
router.get("/periods", getPeriodsHandler); // GET /api/reports/periods

export default router;
