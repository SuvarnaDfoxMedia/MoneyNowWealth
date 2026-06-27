import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import MfApiScheme from "../src/models/mfApiSchemeModel";
import { syncApiSchemeToManual } from "../src/services/mf-import/MfApiSyncEngine";

async function run() {
  await mongoose.connect(process.env.MONGODB_URL as string);
  console.log("Connected to MongoDB.");

  const schemes = await MfApiScheme.find({ is_active: true }).select("_id").lean();
  console.log(`Found ${schemes.length} active schemes. Re-syncing to manual models...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < schemes.length; i++) {
    const schemeId = String(schemes[i]._id);
    try {
      await syncApiSchemeToManual(schemeId, { activating: true });
      success++;
      if (i % 100 === 0) console.log(`Processed ${i} / ${schemes.length}...`);
    } catch (err) {
      failed++;
      console.error(`Failed to sync scheme ${schemeId}:`, err);
    }
  }

  console.log(`\nSync Complete. Success: ${success}, Failed: ${failed}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
