/**
 * MfXlsxStructureValidator.ts
 *
 * Standalone workbook pre-flight validation.
 * Validates structure (sheet names, required headers, required values)
 * without touching the database.
 * 
 * Returns a structured ValidationReport that the UI can render to guide
 * the user in fixing their workbook before submission.
 */

import * as XLSX from "xlsx";
import fs from "fs";

const XLSXModule: any = (XLSX as any).default || XLSX;

export interface ValidationIssue {
  sheet:   string;
  row:     number | null;  // null = sheet-level issue
  column?: string;
  code:    string;         // e.g. "MISSING_SHEET", "MISSING_HEADER", "MISSING_VALUE"
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  sheetsFound: string[];
  sheetsMissing: string[];
  issues: ValidationIssue[];
}

// --- Sheet aliases mirror mfImportService SHEETS constant ---
export const SHEET_ALIASES: Record<string, string[]> = {
  "main-categories":  ["Main_Categories", "Main Categories", "MainCategories"],
  categories:         ["Categories_Master", "Categories", "Category_Master"],
  amcs:               ["AMCs", "AMC", "Amc_Master"],
  "funds-popular":    ["Popular_Funds", "Popular Funds", "PopularFunds"],
  "funds-all":        ["Scheme_Details", "Funds", "Scheme Details", "SchemeDetails", "All Funds", "AllFunds"],
  benchmarks:         ["Benchmarks", "Benchmark_Master", "Benchmark Master"],
  "benchmark-returns":["Benchmark_Returns", "Benchmark Returns"],
  nfo:                ["NFO_List", "NFO", "NFOs"],
  "index-snapshots":  ["Index_Data", "Index Snapshots", "IndexSnapshots"],
  "top-holdings":     ["Top_Holdings", "Top Holdings", "MF_Top_Holdings"],
};

const REQUIRED_HEADERS: Record<string, string[][]> = {
  "main-categories":  [["name", "main_category_name", "main_category"]],
  categories:         [
    ["category_name", "name", "subcategory_name"],
    ["main_category_name", "main_category", "main_category_id", "fund_type"],
  ],
  amcs:               [["name", "amc_name", "amc"]],
  "funds-popular":    [
    ["scheme_code", "schemecode", "code"],
    ["fund_name", "scheme_name", "fund"],
    ["amc_name", "amc", "fund_house", "amc_id"],
    ["category_name", "category", "subcategory_name", "category_id"],
  ],
  "funds-all":        [
    ["scheme_code", "schemecode", "code"],
    ["fund_name", "scheme_name", "fund"],
    ["amc_name", "amc", "fund_house", "amc_id"],
    ["category_name", "category", "subcategory_name", "category_id"],
  ],
  benchmarks:         [["benchmark_index_name", "benchmark_name", "name", "benchmark"]],
  "benchmark-returns":[
    ["benchmark_index_name", "benchmark_name", "name", "benchmark"],
    ["date", "last_updated_date", "as_on_date"],
  ],
  nfo:                [
    ["nfo_id", "nfoid", "code"],
    ["fund_name", "scheme_name", "nfo_name"],
    ["amc_name", "amc", "fund_house", "amc_id"],
    ["category_name", "category", "category_id"],
  ],
  "index-snapshots":  [
    ["benchmark_index_name", "benchmark", "index_name"],
    ["main_category_name", "main_category", "fund_type"],
    ["category_name", "category"],
    ["last_updated_date", "date", "as_on_date"],
  ],
  "top-holdings":     [
    ["holding_name", "name"],
    ["fund_name", "source_standard_name", "standard_name"],
  ],
};

const REQUIRED_SHEETS = ["categories", "amcs", "funds-all"];

const normalizeHeader = (h: string) =>
  h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const getSheetHeaders = (worksheet: XLSX.WorkSheet): string[] => {
  const headers: string[] = [];
  const range = XLSXModule.utils.decode_range(worksheet["!ref"] || "A1:A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = worksheet[XLSXModule.utils.encode_cell({ r: range.s.r, c: col })];
    if (cell?.v !== undefined && cell.v !== "") {
      headers.push(normalizeHeader(String(cell.v)));
    }
  }
  return headers;
};

export const validateWorkbook = (filePath: string): ValidationReport => {
  const issues: ValidationIssue[] = [];
  const sheetsFound: string[] = [];
  const sheetsMissing: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    const buffer = fs.readFileSync(filePath);
    workbook = XLSXModule.read(buffer, { type: "buffer" });
  } catch {
    return {
      valid: false,
      sheetsFound: [],
      sheetsMissing: [],
      issues: [{ sheet: "", row: null, code: "INVALID_FILE", message: "File could not be read. Ensure it is a valid .xlsx or .xls file." }],
    };
  }

  const workbookSheetNames = (workbook.SheetNames || []).map((s: string) => s.trim());

  for (const [entityKey, aliases] of Object.entries(SHEET_ALIASES)) {
    const matchedSheetName = workbookSheetNames.find((name: string) =>
      aliases.some((alias) => alias.toLowerCase() === name.toLowerCase()),
    );

    if (!matchedSheetName) {
      sheetsMissing.push(aliases[0]);
      if (REQUIRED_SHEETS.includes(entityKey)) {
        issues.push({
          sheet: aliases[0],
          row: null,
          code: "MISSING_SHEET",
          message: `Required sheet "${aliases[0]}" is missing in the workbook.`,
        });
      }
      continue;
    }

    sheetsFound.push(matchedSheetName);
    const worksheet = workbook.Sheets[matchedSheetName];
    const headers = getSheetHeaders(worksheet);

    // Validate required header groups
    const requiredGroups = REQUIRED_HEADERS[entityKey] || [];
    for (const group of requiredGroups) {
      const found = group.some((alias) => headers.includes(normalizeHeader(alias)));
      if (!found) {
        issues.push({
          sheet:   matchedSheetName,
          row:     1,
          column:  group[0],
          code:    "MISSING_HEADER",
          message: `Sheet "${matchedSheetName}" is missing a required column. Expected one of: ${group.join(", ")}`,
        });
      }
    }

    // Check for completely empty sheets (header row only, no data)
    const rows = XLSXModule.utils.sheet_to_json(worksheet, { defval: "" });
    if (rows.length === 0) {
      issues.push({
        sheet:   matchedSheetName,
        row:     null,
        code:    "EMPTY_SHEET",
        message: `Sheet "${matchedSheetName}" has headers but no data rows.`,
      });
    }
  }

  return {
    valid: issues.filter((i) => i.code !== "EMPTY_SHEET").length === 0,
    sheetsFound,
    sheetsMissing,
    issues,
  };
};
