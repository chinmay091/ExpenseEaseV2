import { Router } from "express";
import {
  createCategoryController,
  getAllCategoriesController
} from "../controllers/category.controller.js";

const router = Router();

router.post("/categories", createCategoryController);
router.get("/categories", getAllCategoriesController);

export default router;
