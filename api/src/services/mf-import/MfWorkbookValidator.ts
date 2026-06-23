/**
 * MfWorkbookValidator — validates a parsed WorkbookDTO (post-parsing, pre-DB).
 * Uses alias resolution (DB reads). For raw XLSX structure validation, see MfXlsxStructureValidator.
 */

import { WorkbookDTO } from "../../types/mfImportDto";
import { MfImportSummary } from "./mfImportSummary";
import { STANDARDIZED_CONFIGS, FieldConfig } from "./mfStandardization";
import { MfAliasResolver } from "./MfAliasResolver";

export class MfWorkbookValidator {
  
  static async validate(dto: WorkbookDTO, summary: MfImportSummary, options: { skipOrphanCheck?: boolean } = {}): Promise<WorkbookDTO> {
    dto.mainCategories = dto.mainCategories || [];
    dto.categories = dto.categories || [];
    dto.amcs = dto.amcs || [];
    dto.funds = dto.funds || [];
    dto.benchmarks = dto.benchmarks || [];
    dto.benchmarkReturns = dto.benchmarkReturns || [];
    dto.nfos = dto.nfos || [];
    dto.indexSnapshots = dto.indexSnapshots || [];
    dto.topHoldings = dto.topHoldings || [];

    const validatedDto: WorkbookDTO = {
      mainCategories: [],
      categories: [],
      amcs: [],
      funds: [],
      benchmarks: [],
      benchmarkReturns: [],
      nfos: [],
      indexSnapshots: [],
      topHoldings: []
    };

    // 1. Missing Sheets & Structural checks are implicitly handled because MfWorkbookMapper outputs empty arrays.
    // If essential sheets are entirely missing but required, we could flag it here.
    // We will just validate the rows.

    validatedDto.mainCategories = await this.validateSection(dto.mainCategories, STANDARDIZED_CONFIGS.MAIN_CATEGORIES, "Main Categories", summary, "name", dto, null, options);
    validatedDto.categories = await this.validateSection(dto.categories, STANDARDIZED_CONFIGS.CATEGORIES, "Categories", summary, "name", dto, async (item) => {
      if (item.mainCategoryName) {
        const found = await MfAliasResolver.resolveMainCategory(item.mainCategoryName);
        if (!found && !dto.mainCategories.some(c => c.name === item.mainCategoryName)) {
          summary.addError("Categories", -1, `Unknown Main Category: ${item.mainCategoryName}`, item.name);
          return false;
        }
      }
      return true;
    }, options);

    validatedDto.amcs = await this.validateSection(dto.amcs, STANDARDIZED_CONFIGS.AMCS, "AMCs", summary, "name", dto, null, options);
    
    validatedDto.funds = await this.validateSection(dto.funds, STANDARDIZED_CONFIGS.FUNDS, "Funds", summary, "scheme_code", dto, async (item) => {
      if (options.skipOrphanCheck) return true; // API bridge path: engine auto-creates missing refs
      let valid = true;
      if (item.amcName) {
        const found = await MfAliasResolver.resolveAmc(item.amcName);
        if (!found && !dto.amcs.some(a => a.name === item.amcName)) {
          summary.addError("Funds", -1, `Unknown AMC (Orphan Record): ${item.amcName}`, item.scheme_code || item.fund_name);
          valid = false;
        }
      }
      if (item.categoryName) {
        const found = await MfAliasResolver.resolveCategory(item.categoryName);
        if (!found && !dto.categories.some(c => c.name === item.categoryName)) {
          summary.addError("Funds", -1, `Unknown Category (Orphan Record): ${item.categoryName}`, item.scheme_code || item.fund_name);
          valid = false;
        }
      }
      if (item.benchmarkIndexName) {
        const found = await MfAliasResolver.resolveBenchmark(item.benchmarkIndexName);
        if (!found && !dto.benchmarks.some(b => b.benchmark_index_name === item.benchmarkIndexName)) {
          summary.addError("Funds", -1, `Unknown Benchmark (Orphan Record): ${item.benchmarkIndexName}`, item.scheme_code || item.fund_name);
          valid = false;
        }
      }
      return valid;
    }, options);

    validatedDto.benchmarks = await this.validateSection(dto.benchmarks, STANDARDIZED_CONFIGS.BENCHMARKS, "Benchmarks", summary, "benchmark_index_name", dto, async (item) => {
      if (options.skipOrphanCheck) return true; // API bridge path: engine auto-creates missing refs
      let valid = true;
      if (item.categoryName) {
        const found = await MfAliasResolver.resolveCategory(item.categoryName);
        if (!found && !dto.categories.some(c => c.name === item.categoryName)) {
          summary.addError("Benchmarks", -1, `Unknown Category: ${item.categoryName}`, item.benchmark_index_name);
          valid = false;
        }
      }
      return valid;
    }, options);

    validatedDto.benchmarkReturns = await this.validateSection(dto.benchmarkReturns, STANDARDIZED_CONFIGS.BENCHMARK_RETURNS, "Benchmark Returns", summary, "benchmarkIndexName", dto, null, options);
    validatedDto.nfos = await this.validateSection(dto.nfos, STANDARDIZED_CONFIGS.NFOS, "NFOs", summary, "nfo_name", dto, null, options);
    validatedDto.indexSnapshots = await this.validateSection(dto.indexSnapshots, STANDARDIZED_CONFIGS.INDEX_SNAPSHOTS, "Index Snapshots", summary, "benchmark_index_name", dto, null, options);
    
    validatedDto.topHoldings = await this.validateSection(dto.topHoldings, STANDARDIZED_CONFIGS.TOP_HOLDINGS, "Top Holdings", summary, "scheme_code", dto, async (item) => {
      let valid = true;
      const found = await MfAliasResolver.resolveFund(item);
      if (!found && !dto.funds.some(f => f.scheme_code === item.scheme_code || f.isin === item.isin)) {
        summary.addError("Top Holdings", -1, `Unknown Scheme (Orphan Record): ${item.scheme_code || item.fund_name}`, item.asset_name);
        valid = false;
      }
      return valid;
    }, options);

    // Partial Import Prevention is handled by the caller checking summary.errors.length

    return validatedDto;
  }

  private static async validateSection(
    items: Record<string, any>[],
    configs: FieldConfig[],
    sheetName: string,
    summary: MfImportSummary,
    identifierField: string,
    dto: WorkbookDTO,
    customValidator: ((item: any) => Promise<boolean>) | null,
    options: { skipOrphanCheck?: boolean } = {}
  ): Promise<Record<string, any>[]> {
    items = items || [];
    const validItems: Record<string, any>[] = [];
    const requiredConfigs = configs.filter(c => c.required);
    
    const uniqueKeys = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const identifier = String(item[identifierField] || `Row ${i + 2}`);
      let isValid = true;

      // Duplicate Checking
      if (identifierField && item[identifierField]) {
        const key = `${sheetName}-${item[identifierField]}`;
        if (uniqueKeys.has(key)) {
          summary.addError(sheetName, i + 2, `Duplicate Record in payload`, identifier);
          isValid = false;
        } else {
          uniqueKeys.add(key);
        }
      }

      // Required Fields & Type Mismatch Validation
      for (const config of configs) {
        if (options.skipOrphanCheck && sheetName === "Funds" && config.dbPath === "mainCategoryName") {
          continue;
        }
        if (options.skipOrphanCheck && sheetName === "Categories" && config.dbPath === "mainCategoryName") {
          continue;
        }
        const val = this.getNestedValue(item, config.dbPath);
        
        if (config.required && (val === undefined || val === null || val === "")) {
          summary.addError(sheetName, i + 2, `Missing required field: ${config.header}`, identifier);
          isValid = false;
        }
        
        // Pseudo-type checking for explicitly parsed nulls on expected types
        if (val === null && !config.required) {
          // If it was supposed to be a number but parser returned null...
          // We assume MfFieldMapping did its best.
        }
      }

      if (customValidator && isValid) {
        isValid = await customValidator(item);
      }

      if (isValid) {
        validItems.push(item);
      }
    }

    return validItems;
  }

  private static getNestedValue(obj: any, path: string): any {
    if (obj[path] !== undefined) return obj[path];
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : null, obj);
  }
}
