import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config(); 

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl) {
      throw new Error("MONGODB_URL is not defined in .env");
    }

    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,   // fail fast if can't reach server
      socketTimeoutMS: 45000,            // close idle sockets after 45s
      connectTimeoutMS: 10000,           // TCP connection timeout
      maxPoolSize: 10,                   // limit concurrent connections
      heartbeatFrequencyMS: 10000,       // check connection health every 10s
    });

    mongoose.connection.on("disconnected", () => {
      logger.error("[MongoDB] Disconnected from database");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("[MongoDB] Reconnected to database");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("[MongoDB] Connection error: " + err);
    });
    logger.info("MongoDB connected successfully");
  } catch (error: any) {
    logger.error("MongoDB connection error: " + (error.message || error));
    process.exit(1);
  }
};

export default connectDatabase;
