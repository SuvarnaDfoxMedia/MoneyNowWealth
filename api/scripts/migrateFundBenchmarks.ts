import mongoose from "mongoose";
import connectDatabase from "../src/db/dbConnection";
import MFFund from "../src/models/mfFundModel";
import MFBenchmark from "../src/models/mfBenchmarkModel";
import MFBenchmarkReturn from "../src/models/mfBenchmarkReturnModel";

const backupCollectionName = () => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `mfschemes_benchmark_backup_${stamp}`;
};

const normalizedKey = (name: string, type: string, category: string) =>
  `${name.trim().toLowerCase()}::${type.trim().toLowerCase()}::${category.trim().toLowerCase()}`;

const run = async () => {
  try {
    await connectDatabase();

    const existingCount = await MFFund.collection.countDocuments({});
    if (existingCount > 0) {
      const backupName = backupCollectionName();
      await MFFund.collection
        .aggregate([{ $match: {} }, { $out: backupName }], { allowDiskUse: true })
        .toArray();
      console.log(`[MF Benchmark Migration] Backup created: ${backupName}`);
    }

    const benchmarks = await MFBenchmark.find({ is_deleted: false }).lean();
    const benchmarkMap = new Map<string, string>();
    benchmarks.forEach((item) => {
      benchmarkMap.set(
        normalizedKey(item.name || "", item.type || "index", item.category || ""),
        String(item._id),
      );
    });

    const cursor = MFFund.find({ is_deleted: false }).lean().cursor();
    let migratedFunds = 0;
    let createdBenchmarks = 0;
    let upsertedReturns = 0;
    let skipped = 0;

    for await (const fund of cursor) {
      const legacyName = String((fund as any).benchmark_index_name || "").trim();
      if (!legacyName) {
        skipped += 1;
        continue;
      }

      const category = "";
      const type = "index";
      const key = normalizedKey(legacyName, type, category);

      let benchmarkId = benchmarkMap.get(key);
      if (!benchmarkId) {
        const benchmark = await MFBenchmark.create({
          name: legacyName,
          category,
          type,
          is_active: 1,
          is_deleted: false,
        });
        benchmarkId = String(benchmark._id);
        benchmarkMap.set(key, benchmarkId);
        createdBenchmarks += 1;
      }

      const trailing = (fund as any).benchmark_returns_trailing || {};
      const hasAnyReturn = [trailing?.y1, trailing?.y3, trailing?.y5].some(
        (value) => value !== null && value !== undefined && value !== "",
      );

      if (hasAnyReturn) {
        await MFBenchmarkReturn.findOneAndUpdate(
          {
            benchmark_id: new mongoose.Types.ObjectId(benchmarkId),
            date: new Date(),
            is_deleted: false,
          },
          {
            $set: {
              return_1y: trailing?.y1 ?? null,
              return_3y: trailing?.y3 ?? null,
              return_5y: trailing?.y5 ?? null,
              return_since_inception: (fund as any)?.returns?.since_inception ?? null,
            },
          },
          { upsert: true, setDefaultsOnInsert: true },
        );
        upsertedReturns += 1;
      }

      await MFFund.updateOne(
        { _id: fund._id },
        {
          $set: {
            benchmark_id: new mongoose.Types.ObjectId(benchmarkId),
          },
          $unset: {
            benchmark_index_name: "",
            benchmark_returns_trailing: "",
            benchmark_returns_annual: "",
          },
        },
      );
      migratedFunds += 1;
    }

    console.log(
      `[MF Benchmark Migration] Completed. migratedFunds=${migratedFunds}, createdBenchmarks=${createdBenchmarks}, upsertedReturns=${upsertedReturns}, skipped=${skipped}`,
    );
  } catch (error) {
    console.error("[MF Benchmark Migration] Failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
};

void run();
