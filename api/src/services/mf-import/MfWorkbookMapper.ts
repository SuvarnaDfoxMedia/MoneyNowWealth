import { WorkbookDTO } from "../../types/mfImportDto";
import { MfFieldMapping } from "./MfFieldMapping";
import { MfHeaderResolution } from "./MfHeaderResolution";
import { STANDARDIZED_CONFIGS, MF_SHEET_NAMES, FieldConfig } from "./mfStandardization";

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

    this.processSheet(workbookData, MF_SHEET_NAMES.MAIN_CATEGORIES, STANDARDIZED_CONFIGS.MAIN_CATEGORIES, dto.mainCategories);
    this.processSheet(workbookData, MF_SHEET_NAMES.CATEGORIES, STANDARDIZED_CONFIGS.CATEGORIES, dto.categories);
    this.processSheet(workbookData, MF_SHEET_NAMES.AMCS, STANDARDIZED_CONFIGS.AMCS, dto.amcs);
    
    // We want to process BOTH Popular_Funds and Scheme_Details into dto.funds
    this.processSheet(workbookData, MF_SHEET_NAMES.FUNDS_POPULAR, STANDARDIZED_CONFIGS.FUNDS, dto.funds);
    this.processSheet(workbookData, MF_SHEET_NAMES.FUNDS_ALL, STANDARDIZED_CONFIGS.FUNDS, dto.funds);

    this.processSheet(workbookData, MF_SHEET_NAMES.BENCHMARKS, STANDARDIZED_CONFIGS.BENCHMARKS, dto.benchmarks);
    this.processSheet(workbookData, MF_SHEET_NAMES.BENCHMARKS, STANDARDIZED_CONFIGS.BENCHMARK_RETURNS, dto.benchmarkReturns);
    
    this.processSheet(workbookData, MF_SHEET_NAMES.NFOS, STANDARDIZED_CONFIGS.NFOS, dto.nfos);
    this.processSheet(workbookData, MF_SHEET_NAMES.INDEX_SNAPSHOTS, STANDARDIZED_CONFIGS.INDEX_SNAPSHOTS, dto.indexSnapshots);
    this.processSheet(workbookData, MF_SHEET_NAMES.TOP_HOLDINGS, STANDARDIZED_CONFIGS.TOP_HOLDINGS, dto.topHoldings);

    return dto;
  }

  private static processSheet(
    workbookData: Record<string, Record<string, unknown>[]>, 
    sheetMatch: string, 
    configs: FieldConfig[], 
    targetArray: Record<string, any>[]
  ) {
    const sheet = this.getSheet(workbookData, sheetMatch);
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

  private static getSheet(workbookData: Record<string, Record<string, unknown>[]>, sheetMatch: string) {
    const key = Object.keys(workbookData).find(k => k.toLowerCase().includes(sheetMatch.toLowerCase()));
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
