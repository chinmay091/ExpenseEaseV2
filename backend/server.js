import app from "./app.js";
import { connectDB } from "./src/config/database.js";
import { sequelize } from "./src/models/index.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  // TODO: Remove sequelize.sync() and switch to migrations before production
  await sequelize.sync();
  console.log("🧱 All models synced");

  app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
};

startServer();
