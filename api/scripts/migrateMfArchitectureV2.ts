import mongoose from "mongoose";
import connectDatabase from "../src/db/dbConnection";
import MFBenchmark from "../src/models/mfBenchmarkModel";
import MFFund from "../src/models/mfFundModel";
import MFTopHolding from "../src/models/mfTopHoldingModel";
import MFCategory from "../src/models/mfCategoryModel";
import MFBenchmarkReturn from "../src/models/mfBenchmarkReturnModel";

const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeYearly = (raw: any) => {
  const entries = raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw || {});
  const out: Record<string, number | null> = {};
  for (const [key, value] of entries) {
    if (!/^\d{4}$/.test(String(key))) continue;
    out[String(key)] = toNumberOrNull(value);
  }
  return out;
};

const backup = async (collection: mongoose.Collection, name: string) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const backupName = `${name}_backup_${stamp}`;
  await collection.aggregate([{ $match: {} }, { $out: backupName }]).toArray();
  console.log(`[backup] ${name} -> ${backupName}`);
};

const run = async () => {
  try {
    await connectDatabase();
    await backup(MFFund.collection, "mfschemes");
    await backup(MFCategory.collection, "mfcategories");
    await backup(MFBenchmarkReturn.collection, "mfbenchmarkreturns");
    await backup(MFTopHolding.collection, "mf_top_holdings");

    const benchmarkByName = new Map<string, mongoose.Types.ObjectId>();
    const benchmarks = await MFBenchmark.find({ is_deleted: false }).select("_id name type").lean();
    for (const b of benchmarks as any[]) {
      benchmarkByName.set(`${String(b.name || "").trim().toLowerCase()}::${String(b.type || "index").trim().toLowerCase()}`, b._id);
    }

    const fundCursor = MFFund.find({}).lean().cursor();
    let fundsUpdated = 0;
    for await (const fund of fundCursor as any) {
      const annualLegacy = fund?.returns?.annual || {};
      const nextReturns = {
        trailing: {
          "1w": toNumberOrNull(fund?.returns?.["1w"] ?? fund?.returns?.w1),
          "1m": toNumberOrNull(fund?.returns?.["1m"] ?? fund?.returns?.m1),
          "3m": toNumberOrNull(fund?.returns?.["3m"] ?? fund?.returns?.m3),
          "6m": toNumberOrNull(fund?.returns?.["6m"] ?? fund?.returns?.m6),
          "1y": toNumberOrNull(fund?.returns?.["1y"] ?? fund?.returns?.y1),
          "3y": toNumberOrNull(fund?.returns?.["3y"] ?? fund?.returns?.y3_cagr),
          "5y": toNumberOrNull(fund?.returns?.["5y"] ?? fund?.returns?.y5_cagr),
          "10y": toNumberOrNull(fund?.returns?.["10y"] ?? fund?.returns?.y10_cagr),
          since_launch: toNumberOrNull(fund?.returns?.since_launch ?? fund?.returns?.since_inception),
        },
        annual: {
          ytd: toNumberOrNull(fund?.returns?.annual?.ytd ?? fund?.returns?.ytd),
          yearly_returns: normalizeYearly(annualLegacy?.yearly_returns ?? annualLegacy),
        },
      };

      let benchmarkId = fund?.benchmark_id || null;
      const legacyBenchmarkName = String(fund?.benchmark_index_name || "").trim();
      if (!benchmarkId && legacyBenchmarkName) {
        const key = `${legacyBenchmarkName.toLowerCase()}::index`;
        if (!benchmarkByName.has(key)) {
          const created = await MFBenchmark.create({
            name: legacyBenchmarkName,
            type: "index",
            category: "",
            is_active: 1,
            is_deleted: false,
          });
          benchmarkByName.set(key, created._id as mongoose.Types.ObjectId);
        }
        benchmarkId = benchmarkByName.get(key) || null;
      }

      await MFFund.updateOne(
        { _id: fund._id },
        {
          $set: { returns: nextReturns, benchmark_id: benchmarkId },
          $unset: {
            benchmark_index_name: "",
            benchmark_returns_trailing: "",
            benchmark_returns_annual: "",
            top_holdings: "",
            asset_allocation: "",
            tax_type: "",
            riskometer_label: "",
          },
        },
      );
      fundsUpdated += 1;
    }

    const categoryCursor = MFCategory.find({}).lean().cursor();
    let categoriesUpdated = 0;
    for await (const category of categoryCursor as any) {
      const source = category?.category_average_returns || {};
      const next = {
        trailing: {
          "1w": toNumberOrNull(source?.trailing?.["1w"] ?? source?.w1),
          "1m": toNumberOrNull(source?.trailing?.["1m"] ?? source?.m1),
          "3m": toNumberOrNull(source?.trailing?.["3m"] ?? source?.m3),
          "6m": toNumberOrNull(source?.trailing?.["6m"] ?? source?.m6),
          "1y": toNumberOrNull(source?.trailing?.["1y"] ?? source?.y1),
          "3y": toNumberOrNull(source?.trailing?.["3y"] ?? source?.y3),
          "5y": toNumberOrNull(source?.trailing?.["5y"] ?? source?.y5),
          "10y": toNumberOrNull(source?.trailing?.["10y"] ?? source?.y10),
          since_launch: toNumberOrNull(source?.trailing?.since_launch ?? source?.since_launch),
        },
        annual: {
          ytd: toNumberOrNull(source?.annual?.ytd ?? source?.ytd),
          yearly_returns: normalizeYearly(source?.annual?.yearly_returns ?? source?.annual),
        },
      };
      await MFCategory.updateOne(
        { _id: category._id },
        {
          $set: { category_average_returns: next },
          $unset: {
            benchmark_index_name: "",
            benchmark_return_type: "",
            benchmark_returns: "",
          },
        },
      );
      categoriesUpdated += 1;
    }

    const benchCursor = MFBenchmarkReturn.find({}).lean().cursor();
    let benchReturnsUpdated = 0;
    for await (const row of benchCursor as any) {
      const annualSrc = row?.annual || {};
      await MFBenchmarkReturn.updateOne(
        { _id: row._id },
        {
          $set: {
            trailing: {
              "1w": toNumberOrNull(row?.trailing?.["1w"] ?? row?.return_1w),
              "1m": toNumberOrNull(row?.trailing?.["1m"] ?? row?.return_1m),
              "3m": toNumberOrNull(row?.trailing?.["3m"] ?? row?.return_3m),
              "6m": toNumberOrNull(row?.trailing?.["6m"] ?? row?.return_6m),
              "1y": toNumberOrNull(row?.trailing?.["1y"] ?? row?.return_1y),
              "3y": toNumberOrNull(row?.trailing?.["3y"] ?? row?.return_3y),
              "5y": toNumberOrNull(row?.trailing?.["5y"] ?? row?.return_5y),
              "10y": toNumberOrNull(row?.trailing?.["10y"] ?? row?.return_10y),
              since_launch: toNumberOrNull(row?.trailing?.since_launch ?? row?.return_since_inception),
            },
            annual: {
              ytd: toNumberOrNull(row?.annual?.ytd ?? row?.return_ytd),
              yearly_returns: normalizeYearly(annualSrc?.yearly_returns ?? annualSrc),
            },
          },
          $unset: {
            return_1d: "",
            return_1w: "",
            return_1m: "",
            return_3m: "",
            return_6m: "",
            return_ytd: "",
            return_1y: "",
            return_3y: "",
            return_5y: "",
            return_10y: "",
            return_since_inception: "",
          },
        },
      );
      benchReturnsUpdated += 1;
    }

    const topCursor = MFTopHolding.find({}).lean().cursor();
    let topUpdated = 0;
    for await (const row of topCursor as any) {
      const date = row?.portfolio_date ? new Date(row.portfolio_date) : null;
      await MFTopHolding.updateOne(
        { _id: row._id },
        {
          $set: {
            asset_allocation: {
              domestic_equity_pct: toNumberOrNull(row?.asset_allocation?.domestic_equity_pct ?? row?.domestic_equity_pct),
              international_equity_pct: toNumberOrNull(row?.asset_allocation?.international_equity_pct ?? row?.international_equity_pct),
              debt_pct: toNumberOrNull(row?.asset_allocation?.debt_pct ?? row?.debt_pct),
              other_pct: toNumberOrNull(row?.asset_allocation?.other_pct ?? row?.other_pct),
              gold_pct: toNumberOrNull(row?.asset_allocation?.gold_pct ?? row?.gold_pct),
              cash_pct: toNumberOrNull(row?.asset_allocation?.cash_pct ?? row?.cash_pct),
            },
            market_cap_allocation: {
              large_cap_pct: toNumberOrNull(row?.market_cap_allocation?.large_cap_pct ?? row?.large_cap_pct),
              mid_cap_pct: toNumberOrNull(row?.market_cap_allocation?.mid_cap_pct ?? row?.mid_cap_pct),
              small_cap_pct: toNumberOrNull(row?.market_cap_allocation?.small_cap_pct ?? row?.small_cap_pct),
            },
            snapshot_month: date ? date.getUTCMonth() + 1 : null,
            snapshot_year: date ? date.getUTCFullYear() : null,
          },
          $unset: {
            domestic_equity_pct: "",
            international_equity_pct: "",
            debt_pct: "",
            other_pct: "",
            gold_pct: "",
            cash_pct: "",
            large_cap_pct: "",
            mid_cap_pct: "",
            small_cap_pct: "",
          },
        },
      );
      topUpdated += 1;
    }

    console.log(
      `[migrateMfArchitectureV2] done funds=${fundsUpdated} categories=${categoriesUpdated} benchmarkReturns=${benchReturnsUpdated} topHoldings=${topUpdated}`,
    );
  } catch (error) {
    console.error("[migrateMfArchitectureV2] failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
};

void run();
