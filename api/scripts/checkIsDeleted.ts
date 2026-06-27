import mongoose from "mongoose";
import dotenv from "dotenv";
import MFFund from "../src/models/mfFundModel";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  const total = await mongoose.connection.db.collection('mfschemes').countDocuments({});
  const isDeletedTrue = await mongoose.connection.db.collection('mfschemes').countDocuments({ is_deleted: true });
  const isDeletedFalse = await mongoose.connection.db.collection('mfschemes').countDocuments({ is_deleted: false });
  const isDeletedMissing = await mongoose.connection.db.collection('mfschemes').countDocuments({ is_deleted: { $exists: false } });
  const isDeletedNeTrue = await mongoose.connection.db.collection('mfschemes').countDocuments({ is_deleted: { $ne: true } });

  console.log('Total documents in mfschemes:', total);
  console.log('is_deleted: true count:', isDeletedTrue);
  console.log('is_deleted: false count:', isDeletedFalse);
  console.log('is_deleted: exists false count:', isDeletedMissing);
  console.log('is_deleted: ne true count:', isDeletedNeTrue);

  await mongoose.disconnect();
}

run();
