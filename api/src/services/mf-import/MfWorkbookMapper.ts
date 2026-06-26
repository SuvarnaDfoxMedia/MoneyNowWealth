import { WorkbookDTO } from "../../types/mfImportDto";
import { MfFieldMapping } from "./MfFieldMapping";
import { MfHeaderResolution } from "./MfHeaderResolution";
import { STANDARDIZED_CONFIGS, FieldConfig } from "./mfStandardization";
import { MfAliasResolver } from "./MfAliasResolver";
import { SHEET_ALIASES } from "../MfXlsxStructureValidator";

export class MfWorkbookMapper {
  static mapToDTO(workbookData: Record<string, Record<string, unknown>[]>): WorkbookDTO {
    const dto: WorkbookDTO = {
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

    this.processSheet(workbookData, "main-categories", STANDARDIZED_CONFIGS.MAIN_CATEGORIES, dto.mainCategories);
    this.processSheet(workbookData, "categories", STANDARDIZED_CONFIGS.CATEGORIES, dto.categories);
    this.processSheet(workbookData, "amcs", STANDARDIZED_CONFIGS.AMCS, dto.amcs);
    
    const fundsPopular: Record<string, any>[] = [];
    const fundsAll: Record<string, any>[] = [];

    this.processSheet(workbookData, "funds-popular", STANDARDIZED_CONFIGS.FUNDS, fundsPopular);
    this.processSheet(workbookData, "funds-all", STANDARDIZED_CONFIGS.FUNDS, fundsAll);

    // Keep all funds-all rows (FUNDS_ALL is source of truth)
    dto.funds.push(...fundsAll);

    // Track unique scheme codes from funds-all
    const existingCodes = new Set<string>();
    for (const fund of fundsAll) {
      if (fund.scheme_code) {
        const norm = MfAliasResolver.normalizeString(fund.scheme_code);
        if (norm) {
          existingCodes.add(norm);
        }
      }
    }

    // Append funds-popular rows only if they are not already present in funds-all
    for (const fund of fundsPopular) {
      if (fund.scheme_code) {
        const norm = MfAliasResolver.normalizeString(fund.scheme_code);
        if (norm && !existingCodes.has(norm)) {
          dto.funds.push(fund);
          existingCodes.add(norm);
        }
      } else {
        // Also check if there's an existing fund with same name to prevent duplicates
        const normName = fund.fund_name ? MfAliasResolver.normalizeString(fund.fund_name) : "";
        const existsByName = dto.funds.some(f => f.fund_name && MfAliasResolver.normalizeString(f.fund_name) === normName);
        if (!existsByName) {
          dto.funds.push(fund);
        }
      }
    }

    this.processSheet(workbookData, "benchmarks", STANDARDIZED_CONFIGS.BENCHMARKS, dto.benchmarks);
    this.processSheet(workbookData, "benchmark-returns", STANDARDIZED_CONFIGS.BENCHMARK_RETURNS, dto.benchmarkReturns);
    
    this.processSheet(workbookData, "nfo", STANDARDIZED_CONFIGS.NFOS, dto.nfos);
    this.processSheet(workbookData, "index-snapshots", STANDARDIZED_CONFIGS.INDEX_SNAPSHOTS, dto.indexSnapshots);
    this.processSheet(workbookData, "top-holdings", STANDARDIZED_CONFIGS.TOP_HOLDINGS, dto.topHoldings);

    return dto;
  }

  private static processSheet(
    workbookData: Record<string, Record<string, unknown>[]>, 
    sheetKey: string, 
    configs: FieldConfig[], 
    targetArray: Record<string, any>[]
  ) {
    const sheet = this.getSheet(workbookData, sheetKey);
    if (!sheet) return;

    for (const row of sheet) {
      const mappedRow: Record<string, any> = {};
      let hasRequired = true;

      for (const config of configs) {
        let val = MfHeaderResolution.valueByAliases(row, config.aliases);
        
        // Parse according to config
        switch (config.parser) {
          case "number":
            val = MfFieldMapping.parseNumber(row, config.aliases);
            break;
          case "date":
            val = MfFieldMapping.normalizeDateValue(val);
            break;
          case "boolean":
            val = this.toBoolean(val, false);
            break;
          case "boolean_number":
            val = this.toBoolean(val, true) ? 1 : 0;
            break;
          case "string":
            val = String(val || "").trim();
            if (val === "") val = null;
            break;
        }

        if (config.required && (val === null || val === undefined || val === "")) {
          hasRequired = false;
        }

        if (val !== null && val !== undefined && val !== "") {
          mappedRow[config.dbPath] = val;
        }
      }

      if (hasRequired && Object.keys(mappedRow).length > 0) {
        targetArray.push(mappedRow);
      }
    }
  }

  private static getSheet(workbookData: Record<string, Record<string, unknown>[]>, sheetKey: string) {
    const aliases = SHEET_ALIASES[sheetKey] || [sheetKey];
    const key = Object.keys(workbookData).find(k => {
      const normalizedK = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
      return aliases.some(alias => {
        const normalizedAlias = alias.trim().toLowerCase().replace(/[\s_-]+/g, "");
        return normalizedK === normalizedAlias;
      });
    });
    return key ? workbookData[key] : null;
  }

  private static toBoolean(val: any, defaultVal: boolean): boolean {
    if (val === undefined || val === null || val === "") return defaultVal;
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    const s = String(val).toLowerCase().trim();
    return s === "true" || s === "1" || s === "yes" || s === "y";
  }
}
