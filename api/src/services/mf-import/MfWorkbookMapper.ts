import { WorkbookDTO } from "../../types/mfImportDto";
import { MfFieldMapping } from "./MfFieldMapping";
import { MfHeaderResolution } from "./MfHeaderResolution";
import { STANDARDIZED_CONFIGS, FieldConfig } from "./mfStandardization";
import { MfAliasResolver } from "./MfAliasResolver";
import { SHEET_ALIASES } from "../MfXlsxStructureValidator";

type MfWorkbookCellValue = string | number | boolean | Date | null | undefined | Record<string, unknown>;
type MfWorkbookRow = Record<string, MfWorkbookCellValue>;
type MfWorkbookSheet = MfWorkbookRow[];
type MfNormalizedRow = Record<string, unknown>;
type MfWorkbookInput = Record<string, Record<string, unknown>[]>;

export class MfWorkbookMapper {
  static mapToDTO(workbookData: MfWorkbookInput): WorkbookDTO {
    const typedWorkbookData = workbookData as Record<string, MfWorkbookSheet>;
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

    this.processSheet(typedWorkbookData, "main-categories", STANDARDIZED_CONFIGS.MAIN_CATEGORIES, dto.mainCategories);
    this.processSheet(typedWorkbookData, "categories", STANDARDIZED_CONFIGS.CATEGORIES, dto.categories);
    this.processSheet(typedWorkbookData, "amcs", STANDARDIZED_CONFIGS.AMCS, dto.amcs);
    
    const fundsPopular: MfNormalizedRow[] = [];
    const fundsAll: MfNormalizedRow[] = [];

    this.processSheet(typedWorkbookData, "funds-popular", STANDARDIZED_CONFIGS.FUNDS, fundsPopular);
    this.processSheet(typedWorkbookData, "funds-all", STANDARDIZED_CONFIGS.FUNDS, fundsAll);

    // Keep all funds-all rows (FUNDS_ALL is source of truth)
    dto.funds.push(...fundsAll);

    // Track unique scheme codes from funds-all
    const existingCodes = new Set<string>();
    for (const fund of fundsAll) {
      const schemeCode = typeof fund.scheme_code === "string" ? fund.scheme_code : String(fund.scheme_code ?? "");
      if (schemeCode) {
        const norm = MfAliasResolver.normalizeString(schemeCode);
        if (norm) {
          existingCodes.add(norm);
        }
      }
    }

    // Append funds-popular rows only if they are not already present in funds-all
    for (const fund of fundsPopular) {
      const schemeCode = typeof fund.scheme_code === "string" ? fund.scheme_code : String(fund.scheme_code ?? "");
      if (schemeCode) {
        const norm = MfAliasResolver.normalizeString(schemeCode);
        if (norm && !existingCodes.has(norm)) {
          dto.funds.push(fund);
          existingCodes.add(norm);
        }
      } else {
        // Also check if there's an existing fund with same name to prevent duplicates
        const fundName = typeof fund.fund_name === "string" ? fund.fund_name : String(fund.fund_name ?? "");
        const normName = fundName ? MfAliasResolver.normalizeString(fundName) : "";
        const existsByName = dto.funds.some(f => {
          const existingName = typeof f.fund_name === "string" ? f.fund_name : String(f.fund_name ?? "");
          return existingName && MfAliasResolver.normalizeString(existingName) === normName;
        });
        if (!existsByName) {
          dto.funds.push(fund);
        }
      }
    }

    this.processSheet(typedWorkbookData, "benchmarks", STANDARDIZED_CONFIGS.BENCHMARKS, dto.benchmarks);
    this.processSheet(typedWorkbookData, "benchmark-returns", STANDARDIZED_CONFIGS.BENCHMARK_RETURNS, dto.benchmarkReturns);
    
    this.processSheet(typedWorkbookData, "nfo", STANDARDIZED_CONFIGS.NFOS, dto.nfos);
    this.processSheet(typedWorkbookData, "index-snapshots", STANDARDIZED_CONFIGS.INDEX_SNAPSHOTS, dto.indexSnapshots);
    this.processSheet(typedWorkbookData, "top-holdings", STANDARDIZED_CONFIGS.TOP_HOLDINGS, dto.topHoldings);

    return dto;
  }

  private static processSheet(
    workbookData: Record<string, MfWorkbookSheet>, 
    sheetKey: string, 
    configs: FieldConfig[], 
    targetArray: MfNormalizedRow[]
  ) {
    const sheet = this.getSheet(workbookData, sheetKey);
    if (!sheet) return;

    for (const row of sheet) {
      const mappedRow: MfNormalizedRow = {};
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

  private static getSheet(workbookData: Record<string, MfWorkbookSheet>, sheetKey: string) {
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

  private static toBoolean(val: unknown, defaultVal: boolean): boolean {
    if (val === undefined || val === null || val === "") return defaultVal;
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    const s = String(val).toLowerCase().trim();
    return s === "true" || s === "1" || s === "yes" || s === "y";
  }
}
