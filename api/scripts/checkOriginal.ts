import mongoose from "mongoose";
import dotenv from "dotenv";
import MFFund from "../src/models/mfFundModel";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  // Find by name pattern
  const matches = await MFFund.find({
    fund_name: { $regex: /360 One/i }
  }).lean();

  console.log('Matches for "360 One":', matches.map(m => ({
    _id: m._id,
    fund_name: m.fund_name,
    scheme_code: m.scheme_code,
    created_at: m.created_at
  })));

  await mongoose.disconnect();
}

run();
