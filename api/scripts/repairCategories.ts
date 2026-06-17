import mongoose from "mongoose";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

import MFMainCategory from "../src/models/mfMainCategoryModel";
import MFCategory from "../src/models/mfCategoryModel";
import MFFund from "../src/models/mfFundModel";
import { normalizeCategoryName } from "../src/utils/categoryNameUtils";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/moneynowwealth";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const report: any = {
      mainCategoriesMerged: [],
      subCategoriesMerged: [],
      mainCategoriesNormalized: [],
      subCategoriesNormalized: [],
    };

    // 1. Process Main Categories
    const allMain = await MFMainCategory.find({}).lean() as any[];
    const mainMap: Record<string, any[]> = {};
    
    for (const mc of allMain) {
      const normalized = normalizeCategoryName(mc.name);
      if (normalized !== mc.name) {
        // Name needs to be updated natively
        await MFMainCategory.findByIdAndUpdate(mc._id, { name: normalized });
        report.mainCategoriesNormalized.push({ before: mc.name, after: normalized });
      }
      
      if (!mainMap[normalized]) mainMap[normalized] = [];
      mainMap[normalized].push(mc);
    }

    for (const [normName, docs] of Object.entries(mainMap)) {
      if (docs.length > 1) {
        // Sort by creation time (usually embedded in ObjectId)
        docs.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
        const master = docs[0];
        const duplicates = docs.slice(1);

        for (const dup of duplicates) {
          // Repoint SubCategories
          await MFCategory.updateMany(
            { main_category_id: dup._id },
            { $set: { main_category_id: master._id } }
          );

          // Delete duplicate
          await MFMainCategory.findByIdAndDelete(dup._id);
          report.mainCategoriesMerged.push({ kept: master._id, deleted: dup._id, name: normName });
          console.log(`Merged MainCategory: ${normName}`);
        }
      }
    }

    // 2. Process Sub Categories
    const allSub = await MFCategory.find({}).lean() as any[];
    const subMap: Record<string, any[]> = {};

    for (const sc of allSub) {
      const normalized = normalizeCategoryName(sc.name);
      if (normalized !== sc.name) {
        // Update natively
        await MFCategory.findByIdAndUpdate(sc._id, { name: normalized });
        report.subCategoriesNormalized.push({ before: sc.name, after: normalized });
      }

      // Group by main_category_id AND normalized name
      const key = `${sc.main_category_id.toString()}_${normalized}`;
      if (!subMap[key]) subMap[key] = [];
      subMap[key].push(sc);
    }

    for (const [key, docs] of Object.entries(subMap)) {
      if (docs.length > 1) {
        docs.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
        const master = docs[0];
        const duplicates = docs.slice(1);

        for (const dup of duplicates) {
          // Repoint Funds
          const updateResult = await MFFund.updateMany(
            { category_id: dup._id },
            { $set: { category_id: master._id } }
          );

          // Delete duplicate
          await MFCategory.findByIdAndDelete(dup._id);
          report.subCategoriesMerged.push({ 
            kept: master._id, 
            deleted: dup._id, 
            name: master.name,
            fundsMoved: updateResult.modifiedCount
          });
          console.log(`Merged SubCategory: ${master.name} (moved ${updateResult.modifiedCount} funds)`);
        }
      }
    }

    const reportPath = path.join(process.cwd(), "scratch/category_repair_report.json");
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nRepair completed successfully. Report saved to: ${reportPath}`);

  } catch (err) {
    console.error("Repair failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

run();
