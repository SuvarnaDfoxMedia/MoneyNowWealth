import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import MFCategory from "../src/models/mfCategoryModel";
import MFMainCategory from "../src/models/mfMainCategoryModel";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/moneynowwealth";

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  
  const mainCategories = await MFMainCategory.find({}).lean() as any[];
  const categories = await MFCategory.find({}).lean() as any[];
  
  console.log("Main Categories ():");
  mainCategories.forEach(c => console.log("  - " + c.name));
  
  console.log("\nCategories ():");
  categories.forEach(c => console.log("  - " + c.name));
  
  await mongoose.disconnect();
};
run();
