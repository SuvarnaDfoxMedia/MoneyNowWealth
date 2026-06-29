import mongoose from "mongoose";
import MFCategory from "../models/mfCategoryModel";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFFund from "../models/mfFundModel";
import MFBenchmark from "../models/mfBenchmarkModel";
import MfApiScheme from "../models/mfApiSchemeModel";
import { parseCategoryPath } from "../utils/categoryParser";
import { logger } from "../utils/logger";

const STANDARD_MAIN_MAP: Record<string, string> = {
  "Retirement Fund": "Solution Oriented",
  "Childrens Fund": "Solution Oriented",
  "Children's Fund": "Solution Oriented",
  "Arbitrage": "Hybrid",
  "Aggressive": "Hybrid",
  "Conservative": "Hybrid",
  "Equity Savings": "Hybrid",
  "Balanced": "Hybrid",
  "Dynamic Asset Allocation": "Hybrid",
  "Multi Asset Allocation": "Hybrid",
  "Balanced Advantage": "Hybrid"
};

export const cleanupLegacyCategoryFormats = async () => {
  try {
    const categories = await MFCategory.find({ is_deleted: false }).populate("main_category_id", "name").lean() as any[];
    
    logger.info(`[MF Category Cleanup] Starting cleanup scan for ${categories.length} categories...`);

    for (const cat of categories) {
      const originalName = String(cat.name || "").trim();
      if (!originalName) continue;

      const parsed = parseCategoryPath(originalName);
      let cleanSubName = parsed.categoryName.trim();
      let cleanMainName = parsed.mainCategoryName.trim();

      // If main category equals sub category (e.g. "Overnight" / "Overnight"),
      // dynamically resolve the correct main category from MfApiScheme raw data.
      if (cleanMainName === cleanSubName) {
        const escapedSub = cleanSubName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const apiScheme = await MfApiScheme.findOne({
          category: { $regex: new RegExp(`(?:-|:\\s*|^)${escapedSub}$`, "i") },
          is_deleted: { $ne: true }
        }).lean();

        if (apiScheme && apiScheme.category) {
          const apiParsed = parseCategoryPath(apiScheme.category);
          if (apiParsed.mainCategoryName && apiParsed.mainCategoryName !== apiParsed.categoryName) {
            cleanMainName = apiParsed.mainCategoryName.trim();
          }
        }
      }

      // Secondary fallback
      if (cleanMainName === cleanSubName && STANDARD_MAIN_MAP[cleanSubName]) {
        cleanMainName = STANDARD_MAIN_MAP[cleanSubName];
      }

      const parentMainName = cat.main_category_id?.name || "";
      const mainCategoryChanged = parentMainName !== cleanMainName;
      const subCategoryChanged = originalName !== cleanSubName;

      if (subCategoryChanged || mainCategoryChanged) {
        // Find or create main category
        let mainCat = await MFMainCategory.findOne({ name: cleanMainName, is_deleted: false });
        if (!mainCat) {
          mainCat = await MFMainCategory.create({
            name: cleanMainName,
            is_active: 1,
            is_deleted: false,
          });
          logger.info(`[MF Category Cleanup] Created Main Category: "${cleanMainName}"`);
        }

        if (subCategoryChanged) {
          // Check if clean category already exists
          const targetCategory = await MFCategory.findOne({ name: cleanSubName, is_deleted: false });
          if (targetCategory) {
            // MERGE: Update funds and benchmarks to point to the clean one
            const fundRes = await MFFund.updateMany(
              { category_id: cat._id },
              { $set: { category_id: targetCategory._id } }
            );
            const benchmarkRes = await MFBenchmark.updateMany(
              { category_id: cat._id },
              { $set: { category_id: targetCategory._id } }
            );

            // Delete the old legacy/dirty category
            await MFCategory.updateOne(
              { _id: cat._id },
              { $set: { is_deleted: true, is_active: 0, deleted_at: new Date() } }
            );

            logger.info(
              `[MF Category Cleanup] Merged legacy category "${originalName}" into "${cleanSubName}" (Updated ${fundRes.modifiedCount} funds, ${benchmarkRes.modifiedCount} benchmarks)`
            );
          } else {
            // RENAME in-place
            await MFCategory.updateOne(
              { _id: cat._id },
              { $set: { name: cleanSubName, main_category_id: mainCat._id } }
            );
            logger.info(`[MF Category Cleanup] Renamed legacy category "${originalName}" to "${cleanSubName}" under main category "${cleanMainName}"`);
          }
        } else if (mainCategoryChanged) {
          // Just main category changed (e.g. Overnight -> Debt)
          await MFCategory.updateOne(
            { _id: cat._id },
            { $set: { main_category_id: mainCat._id } }
          );
          logger.info(`[MF Category Cleanup] Updated category "${originalName}" main category to "${cleanMainName}"`);
        }
      }
    }

    // Clean up empty legacy main categories
    const activeCategories = await MFCategory.find({ is_deleted: false }).distinct("main_category_id");
    const emptyMainCats = await MFMainCategory.find({
      _id: { $nin: activeCategories },
      is_deleted: false,
    });

    if (emptyMainCats.length > 0) {
      for (const mc of emptyMainCats) {
        await MFMainCategory.updateOne(
          { _id: mc._id },
          { $set: { is_deleted: true, is_active: 0, deleted_at: new Date() } }
        );
        logger.info(`[MF Category Cleanup] Cleaned up legacy empty Main Category: "${mc.name}"`);
      }
    }

    logger.info("[MF Category Cleanup] Finished category scan and cleanup successfully.");
  } catch (err: any) {
    logger.error("[MF Category Cleanup] Error during category scan: " + (err.message || err));
  }
};
