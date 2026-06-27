import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import MfApiScheme from '../src/models/mfApiSchemeModel';
import { syncApiSchemeToManual } from '../src/services/mf-import/MfApiSyncEngine';

async function run() {
  await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/moneynow');
  
  const scheme = await MfApiScheme.findOne({ scheme_name: /SBI Short Term Debt Fund/i });
  if (scheme) {
    console.log('Found scheme ID:', scheme._id);
    const res = await syncApiSchemeToManual(scheme._id.toString(), { activating: true });
    console.log('Sync result:', res);
  } else {
    console.log('Scheme not found');
  }
  process.exit(0);
}

run().catch(console.error);
