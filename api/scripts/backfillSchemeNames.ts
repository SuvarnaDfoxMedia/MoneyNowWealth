import mongoose from "mongoose";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

import MFFund from "../src/models/mfFundModel";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import { parseSchemeTitle } from "../src/utils/schemeParser";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/moneynowwealth";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const funds = await MFFund.find({
      mf_api_scheme_id: { $ne: null },
    });

    console.log(`Found ${funds.length} funds mapped to API schemes.`);

    let updatedCount = 0;
    const reportData: Array<{
      _id: string;
      originalName: string;
      before: { fund_name: string; plan_type: string; option_type: string };
      after: { fund_name: string; plan_type: string; option_type: string };
    }> = [];

    for (const fund of funds) {
      if (!fund.mf_api_scheme_id) continue;

      const scheme = await MfApiScheme.findById(fund.mf_api_scheme_id).lean() as any;
      if (!scheme || !scheme.scheme_name) continue;

      const parsed = parseSchemeTitle(scheme.scheme_name);

      const before = {
        fund_name: fund.fund_name,
        plan_type: fund.plan_type || "",
        option_type: fund.option_type || "",
      };

      const after = {
        fund_name: parsed.baseName,
        plan_type: parsed.planType,
        option_type: parsed.optionType,
      };

      let changed = false;
      if (before.fund_name !== after.fund_name) changed = true;
      if (before.plan_type !== after.plan_type) changed = true;
      if (before.option_type !== after.option_type) changed = true;

      if (changed) {
        fund.set("fund_name", after.fund_name);
        fund.set("plan_type", after.plan_type);
        fund.set("option_type", after.option_type);
        await fund.save();

        reportData.push({
          _id: fund._id.toString(),
          originalName: scheme.scheme_name,
          before,
          after,
        });
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} funds.`);

    const reportPath = path.join(process.cwd(), "scratch/parsing_report.json");
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`Report generated at ${reportPath}`);

  } catch (err) {
    console.error("Backfill failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

run();
