import mongoose from "mongoose";
import dotenv from "dotenv";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import MFFund from "../src/models/mfFundModel";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL!);

  const activeSchemes = await MfApiScheme.find({ is_active: true, is_deleted: { $ne: true } }).lean();
  const funds = await MFFund.find({ is_deleted: false }).lean();

  const fundCodes = new Set(funds.map(f => f.scheme_code).filter(Boolean));
  
  const missing = activeSchemes.filter(s => !fundCodes.has(s.scheme_code));
  console.log('Total active schemes missing by scheme_code:', missing.length);

  if (missing.length > 0) {
    const sample = missing[0];
    console.log('Sample missing scheme:', {
      scheme_code: sample.scheme_code,
      scheme_name: sample.scheme_name,
      isin: sample.isin
    });

    // Let's find any fund with same name or similar name
    const exactNameMatch = await MFFund.findOne({ fund_name: sample.scheme_name });
    console.log('Exact name match in funds:', exactNameMatch ? {
      _id: exactNameMatch._id,
      fund_name: exactNameMatch.fund_name,
      scheme_code: exactNameMatch.scheme_code,
      isin: exactNameMatch.isin
    } : 'None');

    // Let's find any fund with same ISIN
    if (sample.isin) {
      const isinMatch = await MFFund.findOne({ isin: sample.isin });
      console.log('ISIN match in funds:', isinMatch ? {
        _id: isinMatch._id,
        fund_name: isinMatch.fund_name,
        scheme_code: isinMatch.scheme_code,
        isin: isinMatch.isin
      } : 'None');
    }
  }

  await mongoose.disconnect();
}

run();
