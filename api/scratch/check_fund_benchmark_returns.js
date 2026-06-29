import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/moneynowwealth");

const MFFund = mongoose.model("MFFund", new mongoose.Schema({}, { strict: false }), "mfschemes");

// Find a fund that has been synced from API
const fund = await MFFund.findOne({ mf_api_scheme_id: { $ne: null } });

if (fund) {
  const obj = fund.toObject();
  console.log("Fund Name:", obj.fund_name);
  console.log("Scheme Code:", obj.scheme_code);
  console.log("Benchmark Index Name:", obj.benchmark_index_name);
  console.log("Fund Returns Trailing:", JSON.stringify(obj.returns?.trailing, null, 2));
  console.log("Fund Returns Annual:", JSON.stringify(obj.returns?.annual, null, 2));
  console.log("Benchmark Returns Trailing:", JSON.stringify(obj.benchmark_returns_trailing, null, 2));
} else {
  console.log("No synced fund found.");
}

await mongoose.disconnect();
process.exit(0);
