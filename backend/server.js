import app from "./app.js";
import { connectDB } from "./src/config/database.js";
import { sequelize } from "./src/models/index.js";
import { startJobScheduler } from "./src/jobs/jobScheduler.js";
import { initRedis } from "./src/config/redis.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  // In development, sync models to database (creates/updates tables)
  // In production, use migrations instead: npx sequelize-cli db:migrate
  if (process.env.NODE_ENV !== "production") {
    await sequelize.sync();
    console.log("🧱 All models synced (development mode)");
  } else {
    console.log("🧱 Production mode - using migrations for schema management");
  }


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

