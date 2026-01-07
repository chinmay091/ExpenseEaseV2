import express from "express";
import * as billController from "../controllers/bill.controller.js";

const router = express.Router();

router.post("/", billController.create);
router.get("/", billController.getAll);
router.get("/upcoming", billController.getUpcoming);
router.get("/:id", billController.getOne);
router.patch("/:id", billController.update);
router.delete("/:id", billController.remove);
router.post("/:id/pay", billController.markPaid);

export default router;
