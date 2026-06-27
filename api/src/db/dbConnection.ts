import mongoose from "mongoose";
import dotenv from "dotenv";

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
      console.error("[MongoDB] Disconnected from database");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[MongoDB] Reconnected to database");
    });

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
    });
    console.log("MongoDB connected successfully");
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message || error);
    process.exit(1);
  }
};

export default connectDatabase;
