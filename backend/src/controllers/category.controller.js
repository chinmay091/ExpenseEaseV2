import { createCategory, getAllCategories } from "../services/category.service.js";

export const createCategoryController = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        const category = await createCategory(name);

        return res.status(200).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create category",
        });
    }
};

export const getAllCategoriesController = async (req, res) => {
    try {
        const categories = await getAllCategories();

        return res.status(200).json({
            success: true,
            count: categories.lenght,
            data: categories,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
        });
    }
};