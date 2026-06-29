import mongoose from "mongoose";
import MfApiScheme from "../src/models/mfApiSchemeModel";
import MFFund from "../src/models/mfFundModel";
import { syncSchemeToManual } from "../src/controllers/mfApiController";

class MockRes {
  statusCode = 200;
  body: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(payload: any) {
    this.body = payload;
    return this;
  }
}

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/moneynowwealth");

  const linkedFund = await MFFund.findOne({
    is_deleted: false,
    is_active: 1,
    scheme_code: { $ne: "" },
  }).lean();

  if (!linkedFund) {
    console.log("No active manual fund found for UAT.");
    await mongoose.disconnect();
    return;
  }

  const scheme = await MfApiScheme.findOne({
    scheme_code: linkedFund.scheme_code,
    is_deleted: { $ne: true },
    is_active: false,
  }).lean();

  if (!scheme) {
    console.log("No inactive MF API scheme with an active manual fund was found for UAT.");
    await mongoose.disconnect();
    return;
  }

  const before = await MFFund.countDocuments({
    scheme_code: scheme.scheme_code,
    is_deleted: false,
    is_active: 1,
  });

  const res = new MockRes();
  await syncSchemeToManual(
    { params: { id: String(scheme._id) } } as any,
    res as any,
  );

  const after = await MFFund.countDocuments({
    scheme_code: scheme.scheme_code,
    is_deleted: false,
    is_active: 1,
  });

  console.log(
    JSON.stringify(
      {
        scheme_code: scheme.scheme_code,
        before_active_manual_count: before,
        after_active_manual_count: after,
        http_status: res.statusCode,
        response_message: res.body?.message ?? null,
        response_data: res.body?.data ?? null,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
