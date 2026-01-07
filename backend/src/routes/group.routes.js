import express from "express";
import * as groupController from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", groupController.create);
router.get("/", groupController.getAll);
router.get("/:id", groupController.getOne);
router.post("/:id/members", groupController.addMember);
router.post("/:id/respond", groupController.respondInvite);
router.post("/:id/expenses", groupController.addExpense);
router.post("/:id/settle", groupController.settle);
router.get("/:id/balances", groupController.getBalances);
router.delete("/:id", groupController.remove);

export default router;
