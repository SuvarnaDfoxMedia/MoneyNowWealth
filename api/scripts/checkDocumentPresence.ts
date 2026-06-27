import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  const id = new mongoose.Types.ObjectId('6a3d0b0360570d4e1688100d');
  const doc = await mongoose.connection.db.collection('mfschemes').findOne({ _id: id });
  console.log('Document by ID:', doc);

  const countByCode = await mongoose.connection.db.collection('mfschemes').countDocuments({ scheme_code: '151799' });
  console.log('Count of mfschemes with scheme_code 151799:', countByCode);

  await mongoose.disconnect();
}

run();
