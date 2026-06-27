import mongoose from "mongoose";
import dotenv from "dotenv";
import MFFund from "../src/models/mfFundModel";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  console.log('MFFund collection name:', MFFund.collection.name);
  console.log('MFFund database name:', MFFund.db.name);
  console.log('MFFund host:', MFFund.db.host);

  // Let's count using mongoose MFFund
  const mongooseCount = await MFFund.countDocuments({});
  console.log('MFFund.countDocuments({}):', mongooseCount);

  // Let's count using native driver on same collection name
  const nativeCount = await mongoose.connection.db.collection(MFFund.collection.name).countDocuments({});
  console.log(`Native db.collection('${MFFund.collection.name}').countDocuments({}):`, nativeCount);

  // Let's print the collection list on MFFund's connection
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  await mongoose.disconnect();
}

run();
