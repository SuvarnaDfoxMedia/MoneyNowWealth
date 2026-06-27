import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  const code = '154047';
  const docByCode = await mongoose.connection.db.collection('mfschemes').findOne({ scheme_code: code });
  console.log('Document by code:', docByCode);

  const docByName = await mongoose.connection.db.collection('mfschemes').findOne({ fund_name: { $regex: /Abakkus Liquid/i } });
  console.log('Document by name pattern:', docByName);

  await mongoose.disconnect();
}

run();
