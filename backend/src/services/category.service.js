import { Category } from "../models/index.js";

export const createCategory = async (name) => {
    const category = await Category.create({ name });

    return category;
};

export const getAllCategories = async () => {
    const categories = await Category.findAll({
        order: [['name', 'ASC']],
    });

    return categories;
};