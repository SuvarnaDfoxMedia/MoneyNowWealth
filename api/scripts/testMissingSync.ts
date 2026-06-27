import mongoose from "mongoose";
import dotenv from "dotenv";
import { syncApiSchemeToManual } from "../src/services/mf-import/MfApiSyncEngine";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import MFFund from "../src/models/mfFundModel";
import { MfAliasResolver } from "../src/services/mf-import/MfAliasResolver";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  // Find all active schemes
  const activeSchemes = await MfApiScheme.find({ is_active: true, is_deleted: { $ne: true } }).lean();
  console.log('Active schemes count:', activeSchemes.length);

  // Find all funds in mfschemes
  const funds = await MFFund.find({ is_deleted: false }).lean();
  const fundSchemeCodes = new Set(funds.map(f => f.scheme_code).filter(Boolean));
  const fundNamesNormalized = new Set(funds.map(f => MfAliasResolver.normalizeString(f.fund_name)));

  console.log('Total active funds in DB:', funds.length);

  // Find schemes that are not in funds by scheme_code AND have no exact/fuzzy name match
  const missingSchemes: any[] = [];
  for (const scheme of activeSchemes) {
    if (fundSchemeCodes.has(scheme.scheme_code)) continue;

    const normalizedName = MfAliasResolver.normalizeString(scheme.scheme_name);
    // Check if name is already matched
    if (fundNamesNormalized.has(normalizedName)) {
      continue;
    }

    missingSchemes.push(scheme);
  }

  console.log('Number of active schemes completely missing (no code, no name match):', missingSchemes.length);

  if (missingSchemes.length === 0) {
    console.log('No completely missing schemes found.');
    await mongoose.disconnect();
    return;
  }

  const target = missingSchemes[0];
  console.log('Selected completely missing scheme to test sync:', {
    id: target._id,
    scheme_code: target.scheme_code,
    scheme_name: target.scheme_name
  });

  const countBefore = await MFFund.countDocuments({ is_deleted: false });
  console.log('mfschemes count before sync:', countBefore);

  try {
    const result = await syncApiSchemeToManual(String(target._id), { activating: true });
    console.log('Sync result:', result);

    const countAfter = await MFFund.countDocuments({ is_deleted: false });
    console.log('mfschemes count after sync:', countAfter);

    const createdFund = await MFFund.findOne({ scheme_code: target.scheme_code });
    console.log('Created fund in DB:', createdFund);
  } catch (err: any) {
    console.error('Sync failed with error:', err);
  }

  await mongoose.disconnect();
}

run();
