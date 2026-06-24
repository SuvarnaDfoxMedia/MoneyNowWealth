import mongoose from "mongoose";
import connectDatabase from "../src/db/dbConnection";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import { syncApiSchemeToManual } from "../src/services/mfApiService";

const run = async () => {
  await connectDatabase();
  console.log("[resyncActiveFunds] Starting...");

  const schemes = await MfApiScheme.find({
    is_deleted: { $ne: true },
    is_active: true,
    sync_status: "success",
  }).select("_id scheme_name trailing_returns").lean();

  console.log(`[resyncActiveFunds] Found ${schemes.length} active synced schemes`);

  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const scheme of schemes) {
    try {
      const result = await syncApiSchemeToManual(String(scheme._id), { activating: true });
      if (result.action === "created") created++;
      else if (result.action === "updated") updated++;
      else skipped++;

      if ((created + updated + skipped) % 50 === 0) {
        console.log(`[resyncActiveFunds] Progress: ${created + updated + skipped}/${schemes.length} (created=${created} updated=${updated} skipped=${skipped} errors=${errors})`);
      }
    } catch (err: any) {
      errors++;
      console.error(`[resyncActiveFunds] Failed for ${scheme.scheme_name}:`, err?.message);
    }
  }

  console.log(`[resyncActiveFunds] Done: created=${created} updated=${updated} skipped=${skipped} errors=${errors}`);
  await mongoose.disconnect();
};

void run();
