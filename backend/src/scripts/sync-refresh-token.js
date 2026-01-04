// Script to create the refresh_tokens table
// Run with: node src/scripts/sync-refresh-token.js

import "dotenv/config";
import { RefreshToken } from "../models/index.js";

const syncRefreshToken = async () => {
    try {
        await RefreshToken.sync({ force: false });
        console.log("✅ refresh_tokens table created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating refresh_tokens table:", error.message);
        process.exit(1);
    }
};

syncRefreshToken();
