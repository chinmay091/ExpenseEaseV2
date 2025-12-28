import { Expense, Category, User } from "../models/index.js";

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const PROFILE_RULES = {
  student: {
    Food: [150, 300],
    Travel: [50, 150],
    Entertainment: [200, 500],
    Shopping: [300, 700],
    Rent: [3000, 5000],
  },
  salaried: {
    Food: [300, 600],
    Travel: [200, 500],
    Entertainment: [400, 800],
    Shopping: [500, 1500],
    Rent: [8000, 12000],
    Utilities: [1000, 2000],
  },
  freelancer: {
    Food: [200, 700],
    Travel: [0, 600],
    Shopping: [0, 2000],
    Rent: [6000, 10000],
    Utilities: [800, 1800],
  },
};

export const generateSyntheticExpenses = async ({
  userId,
  months = 6,
  profile = "student",
}) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const rules = PROFILE_RULES[profile];
  if (!rules) throw new Error("Invalid profile");

  const categories = await Category.findAll();
  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c.name] = c.id;
  });

  const createdExpenses = [];

  for (let m = 0; m < months; m++) {
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - m);

    for (const [categoryName, [min, max]] of Object.entries(rules)) {
      const categoryId = categoryMap[categoryName];
      if (!categoryId) continue;

      const entries = categoryName === "Food" ? randomBetween(10, 20) : 1;

      for (let i = 0; i < entries; i++) {
        const expenseDate = new Date(baseDate);
        expenseDate.setDate(randomBetween(1, 28));

        const expense = await Expense.create({
          userId,
          categoryId,
          type: "debit",
          amount: randomBetween(min, max),
          description: `Synthetic ${categoryName} expense`,
          createdAt: expenseDate,
        });

        createdExpenses.push(expense);
      }
    }
  }

  return createdExpenses;
};
