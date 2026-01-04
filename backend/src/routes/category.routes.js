import { Router } from "express";
import {
  createCategoryController,
  getAllCategoriesController
} from "../controllers/category.controller.js";

const router = Router();

router.post("/", createCategoryController);
router.get("/", getAllCategoriesController);

export default router;
