import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  // Find all documents matching "PSU Debt"
  const matches = await mongoose.connection.db.collection('mfschemes').find({
    fund_name: { $regex: /PSU Debt/i }
  }).toArray();

  console.log('Matches for "PSU Debt":', matches.map(m => ({
    _id: m._id,
    fund_name: m.fund_name,
    scheme_code: m.scheme_code,
    isin: m.isin,
    created_at: m.created_at
  })));

  await mongoose.disconnect();
}

run();
