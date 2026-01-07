import express from "express";
import { register, unregister } from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/unregister", unregister);

export default router;
