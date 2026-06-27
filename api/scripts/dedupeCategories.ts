import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import MFMainCategory from "../src/models/mfMainCategoryModel";
import MFCategory from "../src/models/mfCategoryModel";
import MFFund from "../src/models/mfFundModel";

async function run() {
  await mongoose.connect(process.env.MONGODB_URL as string);
  console.log("Connected to MongoDB.");

  console.log("\n--- Deduplicating Main Categories ---");
  const mainCategories = await MFMainCategory.find({ is_deleted: false }).lean();
  const mainCatGroups: Record<string, any[]> = {};
  for (const cat of mainCategories) {
    const key = String(cat.name).trim().toLowerCase();
    if (!mainCatGroups[key]) mainCatGroups[key] = [];
    mainCatGroups[key].push(cat);
  }

  for (const [key, group] of Object.entries(mainCatGroups)) {
    if (group.length > 1) {
      console.log(`\nFound ${group.length} duplicates for Main Category: "${key}"`);
      // Sort to prefer active ones, then oldest
      group.sort((a, b) => {
        if (a.is_active !== b.is_active) return b.is_active - a.is_active;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const kept = group[0];
      const duplicates = group.slice(1);
      console.log(`  Keeping ID: ${kept._id} (${kept.name})`);

      for (const dup of duplicates) {
        console.log(`  Processing duplicate ID: ${dup._id} (${dup.name})`);
        // Update all MFCategory references
        const updated = await MFCategory.updateMany(
          { main_category_id: dup._id },
          { $set: { main_category_id: kept._id } }
        );
        console.log(`    Updated ${updated.modifiedCount} subcategories to point to kept main category.`);
        
        // Mark as deleted
        await MFMainCategory.updateOne(
          { _id: dup._id },
          { 
            $set: { 
              is_deleted: true, 
              name: `${dup.name}_dup_${Date.now()}` 
            } 
          }
        );
        console.log(`    Marked as deleted.`);
      }
    }
  }

  console.log("\n--- Deduplicating Subcategories (MFCategory) ---");
  const subCategories = await MFCategory.find({ is_deleted: false }).lean();
  const subCatGroups: Record<string, any[]> = {};
  for (const cat of subCategories) {
    // Group by both main category ID AND the normalized name
    const key = `${cat.main_category_id.toString()}||${String(cat.name).trim().toLowerCase()}`;
    if (!subCatGroups[key]) subCatGroups[key] = [];
    subCatGroups[key].push(cat);
  }

  for (const [key, group] of Object.entries(subCatGroups)) {
    if (group.length > 1) {
      console.log(`\nFound ${group.length} duplicates for Subcategory Key: "${key}"`);
      // Sort to prefer active ones, then oldest
      group.sort((a, b) => {
        if (a.is_active !== b.is_active) return b.is_active - a.is_active;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const kept = group[0];
      const duplicates = group.slice(1);
      console.log(`  Keeping ID: ${kept._id} (${kept.name})`);

      for (const dup of duplicates) {
        console.log(`  Processing duplicate ID: ${dup._id} (${dup.name})`);
        // Update all MFFund references
        const updated = await MFFund.updateMany(
          { category_id: dup._id },
          { $set: { category_id: kept._id } }
        );
        console.log(`    Updated ${updated.modifiedCount} funds to point to kept subcategory.`);
        
        // Mark as deleted
        await MFCategory.updateOne(
          { _id: dup._id },
          { 
            $set: { 
              is_deleted: true, 
              name: `${dup.name}_dup_${Date.now()}` 
            } 
          }
        );
        console.log(`    Marked as deleted.`);
      }
    }
  }

  console.log("\nDone.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error running dedupe script:", err);
  process.exit(1);
});
