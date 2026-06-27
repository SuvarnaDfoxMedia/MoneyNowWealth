import mongoose from "mongoose";
import dotenv from "dotenv";
import { syncApiSchemeToManual } from "../src/services/mf-import/MfApiSyncEngine";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import MFFund from "../src/models/mfFundModel";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  const code = '153772';
  const apiScheme = await MfApiScheme.findOne({ scheme_code: code });
  if (!apiScheme) {
    console.error('No api scheme found for code:', code);
    await mongoose.disconnect();
    return;
  }

  const countBefore = await MFFund.countDocuments({ is_deleted: false });
  console.log('mfschemes count before sync:', countBefore);

  try {
    const result = await syncApiSchemeToManual(String(apiScheme._id), { activating: true });
    console.log('Sync result:', result);

    const countAfter = await MFFund.countDocuments({ is_deleted: false });
    console.log('mfschemes count after sync:', countAfter);

    const createdFund = await MFFund.findOne({ scheme_code: code });
    console.log('Created fund in DB:', createdFund);
  } catch (err: any) {
    console.error('Sync failed with error:', err);
  }

  await mongoose.disconnect();
}

run();
