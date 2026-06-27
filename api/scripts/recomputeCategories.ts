import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import { recomputeAllCategoryAverageReturns } from "../src/services/mfCategoryService";

async function run() {
  await mongoose.connect(process.env.MONGODB_URL as string);
  console.log("Connected to MongoDB.");

  console.log("Recomputing all category average returns...");
  const result = await recomputeAllCategoryAverageReturns();
  console.log(`Successfully recomputed averages for ${result.recomputed} categories.`);
  
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
