import mongoose from "mongoose";
import connectDatabase from "../src/db/dbConnection";
import { cleanupLegacyMfIndexes } from "../src/db/cleanupLegacyMfIndexes";

const run = async () => {
  try {
    await connectDatabase();
    await cleanupLegacyMfIndexes();
    console.log("[MF Cleanup] Legacy index repair completed");
  } catch (error) {
    console.error("[MF Cleanup] Repair failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
};

void run();
