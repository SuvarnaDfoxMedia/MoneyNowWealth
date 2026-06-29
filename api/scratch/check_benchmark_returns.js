import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/moneynowwealth");

const MfApiScheme = mongoose.model("MfApiScheme", new mongoose.Schema({}, { strict: false }), "mf_api_schemes");

// Find a synced scheme (sync_status: success)
const scheme = await MfApiScheme.findOne({ sync_status: "success", latest_info_raw: { $ne: null } });

if (scheme) {
  const obj = scheme.toObject();
  console.log("Scheme Name:", obj.scheme_name);
  console.log("Benchmark Name:", obj.scheme_benchmark);
  console.log("Benchmark Returns Object:", JSON.stringify(obj.benchmark_returns, null, 2));

  // Let's inspect the raw performance list from AdvisorKhoj
  if (obj.latest_info_raw && obj.latest_info_raw.scheme_performance_list) {
    console.log("Raw AdvisorKhoj Scheme Performance List:");
    console.log(JSON.stringify(obj.latest_info_raw.scheme_performance_list, null, 2));
  } else {
    console.log("No raw performance list found in latest_info_raw.");
  }
} else {
  console.log("No synced scheme with latest_info_raw found.");
}

await mongoose.disconnect();
process.exit(0);
