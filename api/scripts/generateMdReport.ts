import mongoose from "mongoose";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

import MfApiScheme from "../src/models/mfApiSchemeModel";
import { parseSchemeTitle } from "../src/utils/schemeParser";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/moneynowwealth";

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  const schemes = await MfApiScheme.find({}).lean() as any[];
  
  let md = "# Universal Scheme Parser - Results Report\n\n";
  md += "This report shows how the raw AdvisorKhoj scheme names map out against the new parser.\n\n";
  
  md += "| Raw AdvisorKhoj Name | Base Fund Name | Plan Type | Option Type |\n";
  md += "|----------------------|----------------|-----------|-------------|\n";
  
  for (const scheme of schemes) {
    if (!scheme.scheme_name) continue;
    const parsed = parseSchemeTitle(scheme.scheme_name);
    md += "| \" + scheme.scheme_name + "\ | \" + parsed.baseName + "\ | \" + (parsed.planType || "N/A") + "\ | \" + (parsed.optionType || "N/A") + "\ |\n";
  }
  
  const reportPath = path.join(process.cwd(), "scratch/parsing_report.md");
  fs.writeFileSync(reportPath, md);
  console.log("Done!");
  await mongoose.disconnect();
};
run();
