import express from "express";
import { get } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", get);

export default router;
