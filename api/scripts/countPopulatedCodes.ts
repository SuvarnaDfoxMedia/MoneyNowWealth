import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  const total = await mongoose.connection.db.collection('mfschemes').countDocuments({});
  const withCode = await mongoose.connection.db.collection('mfschemes').countDocuments({ scheme_code: { $ne: "" } });
  const withCodeNotNull = await mongoose.connection.db.collection('mfschemes').countDocuments({ scheme_code: { $exists: true, $nin: [null, ""] } });
  const isinCount = await mongoose.connection.db.collection('mfschemes').countDocuments({ isin: { $exists: true, $nin: [null, ""] } });

  console.log('Total documents in mfschemes:', total);
  console.log('Documents with scheme_code not empty:', withCode);
  console.log('Documents with scheme_code not null/empty:', withCodeNotNull);
  console.log('Documents with ISIN not empty:', isinCount);

  // Print all distinct scheme_codes in mfschemes
  const codes = await mongoose.connection.db.collection('mfschemes').distinct('scheme_code');
  console.log('Distinct scheme codes count:', codes.filter(Boolean).length);

  await mongoose.disconnect();
}

run();
