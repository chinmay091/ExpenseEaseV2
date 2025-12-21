import { Router } from "express";
import { createUserController, getAllUsersController, getUserByIdController, deleteUserByIdController } from "../controllers/user.controller.js";

const router = Router();

router.post("/users", createUserController);
router.get("/users", getAllUsersController);
router.get("/users/:id", getUserByIdController);
router.delete("/users/:id", deleteUserByIdController);

export default router;