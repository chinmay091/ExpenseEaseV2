import app from "./app.js";
import { connectDB } from "./src/config/database.js";
import { sequelize } from "./src/models/index.js";
import { startJobScheduler } from "./src/jobs/jobScheduler.js";
import { initRedis } from "./src/config/redis.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  await sequelize.sync();
  console.log("🧱 All models synced");

  try {
    await initRedis();
  } catch (error) {
    console.warn("⚠️ Redis not available, caching disabled");
  }

  startJobScheduler();

  app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
};

startServer();

