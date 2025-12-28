import sequelize from "../config/database.js";
import Category from "../models/category.model.js";

const categories = [
  { name: "Food" },
  { name: "Salary"},
  { name: "Travel" },
  { name: "Rent" },
  { name: "Shopping" },
  { name: "Entertainment" },
  { name: "Utilities" },
  { name: "Health" },
  { name: "Other" },
];

const seedCategories = async () => {
  try {
    await sequelize.sync();

    for (const cat of categories) {
      await Category.findOrCreate({
        where: { name: cat.name },
      });
    }

    console.log("✅ Categories seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to seed categories", err);
    process.exit(1);
  }
};

seedCategories();
