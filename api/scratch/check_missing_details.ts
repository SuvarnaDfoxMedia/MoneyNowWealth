import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/moneynowwealth";
  await mongoose.connect(MONGODB_URI);

  const MfApiScheme = mongoose.model(
    "MfApiScheme",
    new mongoose.Schema({}, { strict: false }),
    "mf_api_schemes"
  );
  const MFFund = mongoose.model(
    "MFFund",
    new mongoose.Schema({}, { strict: false }),
    "mfschemes"
  );

  const result = await MFFund.updateMany(
    { scheme_code: { $in: ["151796", "141950"] }, is_deleted: false },
    { $set: { is_active: 0 } }
  );

  console.log(`Deactivated manual funds: ${result.modifiedCount}`);

  // Re-verify counts
  const activeCount = await MfApiScheme.countDocuments({ is_deleted: { $ne: true }, is_active: true });
  const activeBridgedCount = await MFFund.countDocuments({
    mf_api_scheme_id: { $ne: null, $exists: true },
    is_deleted: false,
    is_active: 1
  });

  console.log(`Active API schemes: ${activeCount}`);
  console.log(`Active Bridged Funds in manual module: ${activeBridgedCount}`);

  await mongoose.disconnect();
}

run().catch(console.error);
