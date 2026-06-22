import NavHistory from "../../models/navHistoryModel";
import { normalizeDateOnly } from "../navCalculationService";
import { Types } from "mongoose";
import { MfRepository } from "../../db/mfRepository";
import { WorkbookDTO, ImportSummary } from "../../types/mfImportDto";
import { MfTransactionService } from "./mfTransactionService";
import { MfImportSummary } from "./mfImportSummary";
import { MfAliasResolver } from "./MfAliasResolver";

export class MfImportEngine {
  summary: MfImportSummary;

  constructor() {
    this.summary = new MfImportSummary();
  }

  async processWorkbook(dto: WorkbookDTO): Promise<ImportSummary> {
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
        const mappedData = { ...raw };
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
        const returnRaw = dto.benchmarkReturns.find(r => r.benchmarkIndexName === raw.benchmark_index_name);
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
        }
        if (raw.categoryName) {
          const cat = await MfAliasResolver.resolveCategory(raw.categoryName)
            || await MfRepository.upsertCategory(raw.categoryName, { name: raw.categoryName }, session);
          mappedData.category_id = cat._id;
        }
        if (raw.benchmarkIndexName) {
          const benchmark = await MfAliasResolver.resolveBenchmark(raw.benchmarkIndexName)
            || await MfRepository.upsertBenchmark({ name: raw.benchmarkIndexName }, { name: raw.benchmarkIndexName }, session);
          mappedData.benchmark_id = benchmark._id;
        }
        const fund = await MfRepository.upsertFund({ scheme_code: raw.scheme_code }, mappedData, session);
        this.summary.incrementInserted("Funds");

        if (raw.nav_Current && raw.nav_date) {
          const normalizedDate = normalizeDateOnly(new Date(raw.nav_date));
          const nav = Number(raw.nav_Current);
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
