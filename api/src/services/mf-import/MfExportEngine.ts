import * as XLSX from "xlsx";
import MFMainCategory from "../../models/mfMainCategoryModel";
import MFCategory from "../../models/mfCategoryModel";
import MFAmc from "../../models/mfAmcModel";
import MFFund from "../../models/mfFundModel";
import MFNfo from "../../models/mfNfoModel";
import MFIndexSnapshot from "../../models/mfIndexSnapshotModel";
import MFTopHolding from "../../models/mfTopHoldingModel";
import MFBenchmarkReturn from "../../models/mfBenchmarkReturnModel";
import MFBenchmark from "../../models/mfBenchmarkModel";
import { STANDARDIZED_CONFIGS, MF_SHEET_NAMES, getNestedValue, FieldConfig } from "./mfStandardization";

export class MfExportEngine {
  
  static async exportMfExcel({ entity, mode = "data" }: { entity: string, mode?: "data" | "template" }) {
    let workbook;
    if (entity === "full-workbook") {
      workbook = await this.exportWorkbook(mode);
    } else {
      workbook = await this.exportSingleSheet(entity, mode);
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${entity}-${mode}-${timestamp}.xlsx`;

    return {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName,
      buffer,
    };
  }

  static async exportWorkbook(mode: "data" | "template" = "data"): Promise<XLSX.WorkBook> {
    const workbook = XLSX.utils.book_new();

    // Export each sheet using the standard configurations
    await this.exportSheet(workbook, MF_SHEET_NAMES.MAIN_CATEGORIES, STANDARDIZED_CONFIGS.MAIN_CATEGORIES, mode, this.getMainCategories.bind(this));
    await this.exportSheet(workbook, MF_SHEET_NAMES.CATEGORIES, STANDARDIZED_CONFIGS.CATEGORIES, mode, this.getCategories.bind(this));
    await this.exportSheet(workbook, MF_SHEET_NAMES.AMCS, STANDARDIZED_CONFIGS.AMCS, mode, this.getAmcs.bind(this));
    await this.exportSheet(workbook, MF_SHEET_NAMES.FUNDS_POPULAR, STANDARDIZED_CONFIGS.FUNDS, mode, () => this.getFunds(true));
    await this.exportSheet(workbook, MF_SHEET_NAMES.FUNDS_ALL, STANDARDIZED_CONFIGS.FUNDS, mode, () => this.getFunds(false));
    await this.exportSheet(workbook, MF_SHEET_NAMES.BENCHMARKS, STANDARDIZED_CONFIGS.BENCHMARKS, mode, this.getBenchmarks.bind(this));
    await this.exportSheet(workbook, MF_SHEET_NAMES.BENCHMARKS + "_Returns", STANDARDIZED_CONFIGS.BENCHMARK_RETURNS, mode, this.getBenchmarkReturns.bind(this));
    await this.exportSheet(workbook, MF_SHEET_NAMES.NFOS, STANDARDIZED_CONFIGS.NFOS, mode, this.getNfos.bind(this));
    await this.exportSheet(workbook, MF_SHEET_NAMES.INDEX_SNAPSHOTS, STANDARDIZED_CONFIGS.INDEX_SNAPSHOTS, mode, this.getIndexSnapshots.bind(this));
    // Top holdings can be massive, maybe limit or omit in full workbook export unless requested, but we include it.
    await this.exportSheet(workbook, MF_SHEET_NAMES.TOP_HOLDINGS, STANDARDIZED_CONFIGS.TOP_HOLDINGS, mode, () => this.getTopHoldings(mode));

    return workbook;
  }

  static async exportSingleSheet(entity: string, mode: "data" | "template" = "data"): Promise<XLSX.WorkBook> {
    const workbook = XLSX.utils.book_new();
    switch (entity) {
      case "main-categories":
        await this.exportSheet(workbook, MF_SHEET_NAMES.MAIN_CATEGORIES, STANDARDIZED_CONFIGS.MAIN_CATEGORIES, mode, this.getMainCategories.bind(this));
        break;
      case "categories":
        await this.exportSheet(workbook, MF_SHEET_NAMES.CATEGORIES, STANDARDIZED_CONFIGS.CATEGORIES, mode, this.getCategories.bind(this));
        break;
      case "amcs":
        await this.exportSheet(workbook, MF_SHEET_NAMES.AMCS, STANDARDIZED_CONFIGS.AMCS, mode, this.getAmcs.bind(this));
        break;
      case "funds":
        await this.exportSheet(workbook, MF_SHEET_NAMES.FUNDS_ALL, STANDARDIZED_CONFIGS.FUNDS, mode, () => this.getFunds(false));
        break;
      case "benchmarks":
        await this.exportSheet(workbook, MF_SHEET_NAMES.BENCHMARKS, STANDARDIZED_CONFIGS.BENCHMARKS, mode, this.getBenchmarks.bind(this));
        break;
      case "benchmark-returns":
        await this.exportSheet(workbook, MF_SHEET_NAMES.BENCHMARKS + "_Returns", STANDARDIZED_CONFIGS.BENCHMARK_RETURNS, mode, this.getBenchmarkReturns.bind(this));
        break;
      case "nfos":
        await this.exportSheet(workbook, MF_SHEET_NAMES.NFOS, STANDARDIZED_CONFIGS.NFOS, mode, this.getNfos.bind(this));
        break;
      case "index-snapshots":
        await this.exportSheet(workbook, MF_SHEET_NAMES.INDEX_SNAPSHOTS, STANDARDIZED_CONFIGS.INDEX_SNAPSHOTS, mode, this.getIndexSnapshots.bind(this));
        break;
      case "top-holdings":
        await this.exportSheet(workbook, MF_SHEET_NAMES.TOP_HOLDINGS, STANDARDIZED_CONFIGS.TOP_HOLDINGS, mode, () => this.getTopHoldings(mode));
        break;
      default:
        throw new Error("Unknown entity: " + entity);
    }
    return workbook;
  }

  private static async exportSheet(
    workbook: XLSX.WorkBook,
    sheetName: string,
    configs: FieldConfig[],
    mode: "data" | "template",
    fetcher: () => Promise<any[]>
  ) {
    const headers = configs.map(c => c.header);
    let rows: any[] = [];
    
    if (mode === "data") {
      const records = await fetcher();
      rows = records.map(record => {
        const rowObj: any = {};
        for (const config of configs) {
          let val = getNestedValue(record, config.dbPath);
          
          if (config.parser === "date" && val instanceof Date) {
            val = val.toISOString().split('T')[0];
          } else if (config.parser === "boolean") {
            val = val ? "Yes" : "No";
          }
          
          rowObj[config.header] = val ?? "";
        }
        return rowObj;
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  private static async getMainCategories() {
    return MFMainCategory.find({ is_deleted: false }).lean();
  }

  private static async getCategories() {
    const items = await MFCategory.find({ is_deleted: false })
      .populate("main_category_id", "name")
      .lean();
    return items.map((i: any) => ({
      ...i,
      mainCategoryName: i.main_category_id?.name || ""
    }));
  }

  private static async getAmcs() {
    return MFAmc.find({ is_deleted: false }).lean();
  }

  private static async getFunds(popularOnly: boolean) {
    const query: any = { is_deleted: false };
    if (popularOnly) query.is_popular = true;
    
    const items = await MFFund.find(query)
      .populate("amc_id", "name")
      .populate("benchmark_id", "name")
      .populate({
        path: "category_id",
        select: "name main_category_id",
        populate: { path: "main_category_id", select: "name" },
      })
      .lean();
      
    return items.map((i: any) => ({
      ...i,
      amcName: i.amc_id?.name || "",
      categoryName: i.category_id?.name || "",
      mainCategoryName: i.category_id?.main_category_id?.name || "",
      benchmarkIndexName: i.benchmark_id?.name || i.benchmark_index_name || "",
      nav_current: i.nav_Current ?? i.nav,
    }));
  }

  private static async getBenchmarks() {
    const items = await MFBenchmark.find({ is_deleted: false })
      .populate("category_id", "name")
      .populate("main_category_id", "name")
      .lean();
    return items.map((i: any) => ({
      ...i,
      categoryName: i.category_id?.name || "",
      mainCategoryName: i.main_category_id?.name || ""
    }));
  }

  private static async getBenchmarkReturns() {
    const items = await MFBenchmarkReturn.find()
      .populate("benchmark_id", "name")
      .lean();
    return items.map((i: any) => ({
      ...i,
      benchmarkIndexName: i.benchmark_id?.name || i.benchmark_index_name || ""
    }));
  }

  private static async getNfos() {
    const items = await MFNfo.find({ is_deleted: false })
      .populate("amc_id", "name")
      .populate("category_id", "name")
      .populate("main_category_id", "name")
      .lean();
    return items.map((i: any) => ({
      ...i,
      amcName: i.amc_id?.name || "",
      categoryName: i.category_id?.name || "",
      mainCategoryName: i.main_category_id?.name || ""
    }));
  }

  private static async getIndexSnapshots() {
    return MFIndexSnapshot.find({ is_deleted: false }).lean();
  }

  private static async getTopHoldings(mode: "data" | "template") {
    // Only return top 100 in full export so it doesn't crash memory
    const items = await MFTopHolding.find({ is_deleted: false })
      .limit(mode === "data" ? 100 : 0)
      .lean();
    return items;
  }
}
