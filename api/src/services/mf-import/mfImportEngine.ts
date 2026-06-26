import NavHistory from "../../models/navHistoryModel";
import { normalizeDateOnly } from "../navCalculationService";
import { Types } from "mongoose";
import { MfRepository } from "../../db/mfRepository";
import { WorkbookDTO, ImportSummary } from "../../types/mfImportDto";
import { MfTransactionService } from "./mfTransactionService";
import { MfImportSummary } from "./mfImportSummary";
import { MfAliasResolver } from "./MfAliasResolver";
import { recomputeCategoryAverageReturns, recomputeAllCategoryAverageReturns } from "../mfCategoryService";

const normalizeLookupKey = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export class MfImportEngine {
  summary: MfImportSummary;

  constructor() {
    this.summary = new MfImportSummary();
  }

  async processWorkbook(dto: WorkbookDTO): Promise<ImportSummary> {
    const affectedCategoryIds = new Set<string>();
    await MfTransactionService.executeWithTransaction(async (session) => {
      // 1. Main Categories
      for (const raw of dto.mainCategories) {
        if (!raw.name) continue;
        await MfRepository.upsertMainCategory(raw.name, raw, session);
        this.summary.incrementInserted("Main Categories");
      }

      // 2. Categories
      for (const raw of dto.categories) {
        if (!raw.name) continue;
        const mappedData = { ...raw };
        if (raw.mainCategoryName) {
          const mainCat = await MfAliasResolver.resolveMainCategory(raw.mainCategoryName) 
            || await MfRepository.upsertMainCategory(raw.mainCategoryName, { name: raw.mainCategoryName }, session);
          mappedData.main_category_id = mainCat._id;
        }
        await MfRepository.upsertCategory(raw.name, mappedData, session);
        this.summary.incrementInserted("Categories");
      }

      // 3. AMCs
      for (const raw of dto.amcs) {
        if (!raw.name) continue;
        await MfRepository.upsertAmc(raw.name, raw, session);
        this.summary.incrementInserted("AMCs");
      }

      // 4. Benchmarks
      for (const raw of dto.benchmarks) {
        if (!raw.benchmark_index_name) continue;
        const mappedData: any = { ...raw, name: raw.benchmark_index_name };
        if (raw.categoryName) {
          const cat = await MfAliasResolver.resolveCategory(raw.categoryName) 
            || await MfRepository.upsertCategory(raw.categoryName, { name: raw.categoryName }, session);
          mappedData.category_id = cat._id;
        }
        if (raw.mainCategoryName) {
          const mainCat = await MfAliasResolver.resolveMainCategory(raw.mainCategoryName)
            || await MfRepository.upsertMainCategory(raw.mainCategoryName, { name: raw.mainCategoryName }, session);
          mappedData.main_category_id = mainCat._id;
        }
        const benchmark = await MfRepository.upsertBenchmark({ name: raw.benchmark_index_name }, mappedData, session);
        this.summary.incrementInserted("Benchmarks");

        // 5. Benchmark Returns inline processing
        const returnRaw = dto.benchmarkReturns.find(
          (r) => normalizeLookupKey(r.benchmarkIndexName) === normalizeLookupKey(raw.benchmark_index_name),
        );
        if (returnRaw && returnRaw.date) {
          const returnData = { ...returnRaw, benchmark_id: benchmark._id };
          await MfRepository.upsertBenchmarkReturn({ benchmark_id: benchmark._id, date: returnRaw.date }, returnData, session);
          this.summary.incrementInserted("Benchmark Returns");
        }
      }

      // 6. Funds
      for (const raw of dto.funds) {
        if (!raw.scheme_code) continue;
        const mappedData = { ...raw };
        if (raw.amcName) {
          const amc = await MfAliasResolver.resolveAmc(raw.amcName)
            || await MfRepository.upsertAmc(raw.amcName, { name: raw.amcName }, session);
          mappedData.amc_id = amc._id;
        } else {
          // amc_id is required on MFFund — use or create an "Unknown AMC" placeholder so the fund
          // record can be created now. The correct AMC will be linked on the next full API sync.
          const placeholderAmc = await MfAliasResolver.resolveAmc("Unknown AMC")
            || await MfRepository.upsertAmc("Unknown AMC", { name: "Unknown AMC" }, session);
          mappedData.amc_id = placeholderAmc._id;
        }
        if (raw.categoryName) {
          const cat = await MfAliasResolver.resolveCategory(raw.categoryName)
            || await MfRepository.upsertCategory(raw.categoryName, {
                name: raw.categoryName,
                mainCategoryName: (raw as any).mainCategoryName || raw.categoryName,
              }, session);
          mappedData.category_id = cat._id;
        } else {
          // category_id is required on MFFund — use or create an "Uncategorized" placeholder.
          const placeholderCat = await MfAliasResolver.resolveCategory("Uncategorized")
            || await MfRepository.upsertCategory("Uncategorized", {
                name: "Uncategorized",
                mainCategoryName: "Uncategorized",
              }, session);
          mappedData.category_id = placeholderCat._id;
        }
        if (raw.benchmarkIndexName) {
          const benchmark = await MfAliasResolver.resolveBenchmark(raw.benchmarkIndexName)
            || await MfRepository.upsertBenchmark({ name: raw.benchmarkIndexName }, { name: raw.benchmarkIndexName }, session);
          mappedData.benchmark_id = benchmark._id;
          mappedData.benchmark_index_name = raw.benchmarkIndexName;  // write the string name field too
        }
        const fund = await MfRepository.upsertFund({ scheme_code: raw.scheme_code }, mappedData, session);
        this.summary.incrementInserted("Funds");
        if (fund && fund.category_id) {
          affectedCategoryIds.add(String(fund.category_id));
        }

        // Accept both nav_Current (schema field name, API bridge path) and nav (legacy/alias)
        const navValue = raw.nav_Current ?? raw.nav ?? null;
        if (navValue != null && raw.nav_date) {
          const normalizedDate = normalizeDateOnly(new Date(raw.nav_date));
          const nav = Number(navValue);
          if (Number.isFinite(nav) && fund && fund._id) {
            await NavHistory.findOneAndUpdate(
              { schemeId: fund._id, date: normalizedDate },
              { $set: { nav, totalAssets: nav, totalLiabilities: 0, totalUnits: 1 } },
              { upsert: true, new: true, setDefaultsOnInsert: true, session }
            );
          }
        }
      }

      // 7. NFOs
      for (const raw of dto.nfos) {
        if (!raw.nfo_name) continue;
        const mappedData = { ...raw };
        if (raw.amcName) {
          const amc = await MfAliasResolver.resolveAmc(raw.amcName)
            || await MfRepository.upsertAmc(raw.amcName, { name: raw.amcName }, session);
          mappedData.amc_id = amc._id;
        }
        await MfRepository.upsertNfo({ nfo_name: raw.nfo_name }, mappedData, session);
        this.summary.incrementInserted("NFO");
      }

      // 8. Index Snapshots
      for (const raw of dto.indexSnapshots) {
        if (!raw.benchmark_index_name) continue;
        await MfRepository.upsertIndexSnapshot({ benchmark_index_name: raw.benchmark_index_name, last_updated_date: raw.last_updated_date }, raw, session);
        this.summary.incrementInserted("Index Snapshots");
      }
    });

    // Recompute category average returns for all affected categories
    if (affectedCategoryIds.size > 0) {
      for (const catId of affectedCategoryIds) {
        await recomputeCategoryAverageReturns(catId).catch(() => {});
      }
    } else {
      await recomputeAllCategoryAverageReturns().catch(() => {});
    }

    // 9. Top Holdings (Bulk)
    if (dto.topHoldings.length > 0) {
      for (const h of dto.topHoldings) {
        const fund = await MfAliasResolver.resolveFund(h);
        if (fund) h.fund_id = fund._id;
      }
      const validHoldings = dto.topHoldings.filter(h => h.fund_id);
      if (validHoldings.length > 0) {
        await MfRepository.bulkWriteTopHoldings(validHoldings.map(h => ({
          updateOne: {
            filter: { fund_id: h.fund_id, snapshot_hash: h.snapshot_hash },
            update: { $set: h },
            upsert: true
          }
        })));
        this.summary.incrementTotal("Top Holdings", validHoldings.length);
      }
    }

    return this.summary.getReport().summary;
  }
}
