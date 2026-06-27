import mongoose from "mongoose";
import dotenv from "dotenv";
import { syncApiSchemeToManual } from "../src/services/mf-import/MfApiSyncEngine";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import MFFund from "../src/models/mfFundModel";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);
  
  const code = '122612';
  const apiScheme = await MfApiScheme.findOne({ scheme_code: code });
  if (!apiScheme) {
    console.error('No api scheme found for code:', code);
    await mongoose.disconnect();
    return;
  }
  
  console.log('API Scheme found:', apiScheme.scheme_name, 'ID:', apiScheme._id);
  console.log('Attempting syncApiSchemeToManual...');

  try {
    const result = await syncApiSchemeToManual(String(apiScheme._id), { activating: true });
    console.log('Sync result:', result);
    
    // Check if fund was created
    const fund = await MFFund.findOne({ scheme_code: code });
    console.log('After sync: Fund in DB:', fund);
  } catch (err) {
    console.error('Error during sync:', err);
  }
  
  await mongoose.disconnect();
}

run();
