import mongoose from "mongoose";

import connectDatabase from "../src/db/dbConnection";
import MFCategory from "../src/models/mfCategoryModel";
import MfApiNavHistory from "../src/models/mfApiNavHistoryModel";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import { recomputeCategoryAverageReturns } from "../src/services/mfCategoryService";

const run = async () => {
  try {
    await connectDatabase();

    let categoriesRecomputed = 0;
    const categoryCursor = MFCategory.find({ is_deleted: false }).select("_id").lean().cursor();
    for await (const category of categoryCursor as any) {
      await recomputeCategoryAverageReturns(String(category._id)).catch((error) => {
        console.error(`[rebuildMfApiDerivedData] category recompute failed for ${category._id}:`, error?.message);
      });
      categoriesRecomputed += 1;
    }

    let navHistoryUpserts = 0;
    const schemeCursor = MfApiScheme.find({
      is_deleted: { $ne: true },
      latest_nav: { $ne: null },
      latest_date: { $ne: null },
    })
      .select("_id scheme_name external_key latest_nav latest_date nav_change nav_change_percentage")
      .lean()
      .cursor();

    for await (const scheme of schemeCursor as any) {
      await MfApiNavHistory.findOneAndUpdate(
        { scheme_id: scheme._id, date: scheme.latest_date },
        {
          $setOnInsert: {
            scheme_id: scheme._id,
            scheme_name: scheme.scheme_name,
            external_key: scheme.external_key,
            date: scheme.latest_date,
            nav: scheme.latest_nav,
            nav_change: scheme.nav_change ?? null,
            nav_change_pct: scheme.nav_change_percentage ?? null,
          },
        },
        { upsert: true, new: false },
      );
      navHistoryUpserts += 1;
    }

    console.log(
      `[rebuildMfApiDerivedData] done categories=${categoriesRecomputed} navHistoryUpserts=${navHistoryUpserts}`,
    );
  } catch (error) {
    console.error("[rebuildMfApiDerivedData] failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
};

void run();
