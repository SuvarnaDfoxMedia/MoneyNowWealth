import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import MfApiScheme from '../src/models/mfApiSchemeModel';
import MFFund from '../src/models/mfFundModel';
import { syncApiSchemeToManual } from '../src/services/mf-import/MfApiSyncEngine';

async function run() {
  await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/moneynow');
  console.log('Connected to MongoDB');

  // Let's find the two schemes in mf_api_schemes
  const regularScheme = await MfApiScheme.findOne({ scheme_code: '152075', is_deleted: { $ne: true } });
  const directScheme = await MfApiScheme.findOne({ scheme_code: '152076', is_deleted: { $ne: true } });

  if (!regularScheme || !directScheme) {
    console.error('Test schemes 152075 or 152076 not found in mf_api_schemes.');
    process.exit(1);
  }

  console.log(`Found Regular Scheme: ${regularScheme.scheme_name} (ID: ${regularScheme._id}, Code: ${regularScheme.scheme_code})`);
  console.log(`Found Direct Scheme: ${directScheme.scheme_name} (ID: ${directScheme._id}, Code: ${directScheme.scheme_code})`);

  // Let's check if they exist in MFFund
  const regFundBefore = await MFFund.findOne({ scheme_code: '152075', is_deleted: false });
  const dirFundBefore = await MFFund.findOne({ scheme_code: '152076', is_deleted: false });

  console.log(`Before sync - Regular fund in MFFund:`, regFundBefore ? `Yes (ID: ${regFundBefore._id})` : 'No');
  console.log(`Before sync - Direct fund in MFFund:`, dirFundBefore ? `Yes (ID: ${dirFundBefore._id})` : 'No');

  // Now, let's run syncApiSchemeToManual for the regular scheme
  console.log('Syncing Regular Scheme...');
  const regResult = await syncApiSchemeToManual(regularScheme._id.toString(), { activating: true });
  console.log('Regular sync result:', regResult);

  // Now sync direct scheme
  console.log('Syncing Direct Scheme...');
  const dirResult = await syncApiSchemeToManual(directScheme._id.toString(), { activating: true });
  console.log('Direct sync result:', dirResult);

  // Let's query MFFund again to see what we have
  const regFundAfter = await MFFund.findOne({ scheme_code: '152075', is_deleted: false });
  const dirFundAfter = await MFFund.findOne({ scheme_code: '152076', is_deleted: false });

  console.log(`After sync - Regular fund in MFFund:`, regFundAfter ? `Yes (ID: ${regFundAfter._id}, Name: ${regFundAfter.fund_name}, Plan: ${regFundAfter.plan_type})` : 'No');
  console.log(`After sync - Direct fund in MFFund:`, dirFundAfter ? `Yes (ID: ${dirFundAfter._id}, Name: ${dirFundAfter.fund_name}, Plan: ${dirFundAfter.plan_type})` : 'No');

  if (regFundAfter && dirFundAfter) {
    if (String(regFundAfter._id) === String(dirFundAfter._id)) {
      console.error('FAILED: Both scheme codes resolved to the SAME database document! Overwriting still occurred.');
    } else {
      console.log('SUCCESS: Both schemes are bridged to SEPARATE database documents! No overwriting.');
    }
  } else {
    console.log('Could not find both funds after sync. Please check if sync succeeded.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(console.error);
