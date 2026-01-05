import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); 

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl) {
      throw new Error("MONGODB_URL is not defined in .env");
    }

    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message || error);
    process.exit(1);
  }
};

export default connectDatabase;
