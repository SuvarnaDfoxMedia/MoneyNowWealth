import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/moneynowwealth");

const MFBenchmarkReturn = mongoose.model("MFBenchmarkReturn", new mongoose.Schema({}, { strict: false }), "mfbenchmarkreturns");

// Find a benchmark return entry
const returns = await MFBenchmarkReturn.findOne({});

if (returns) {
  console.log("Benchmark Return Entry found:");
  console.log(JSON.stringify(returns.toObject(), null, 2));
} else {
  console.log("No benchmark returns found.");
}

await mongoose.disconnect();
process.exit(0);
