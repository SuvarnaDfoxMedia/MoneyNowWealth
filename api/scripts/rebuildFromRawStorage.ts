import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

import MfApiScheme from "../src/models/mfApiSchemeModel";
import MfApiSyncLog from "../src/models/mfApiSyncLogModel";
import { processDetailedSyncBatch } from "../src/services/mfApiService";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/moneynowwealth";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    // Queue all active schemes for sync
    const activeCount = await MfApiScheme.countDocuments({ is_active: true, is_deleted: { $ne: true } });
    console.log(`Queueing ${activeCount} active schemes for rebuild...`);
    
    await MfApiScheme.updateMany(
      { is_active: true, is_deleted: { $ne: true } },
      { $set: { sync_status: "queued" } }
    );

    const log = await MfApiSyncLog.create({
      action: "offline-rebuild",
      status: "queued",
      message: "Initiating offline rebuild from raw storage",
    });

    console.log(`Starting offline rebuild batch (Log ID: ${log._id})...`);
    
    // Process offline
    await processDetailedSyncBatch(String(log._id), { role: "admin" }, { activeOnly: true, offlineMode: true });

    const finalLog = await MfApiSyncLog.findById(log._id);
    console.log(`Rebuild finished with status: ${finalLog?.status}. Message: ${finalLog?.message}`);
    
  } catch (err) {
    console.error("Rebuild failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

run();
