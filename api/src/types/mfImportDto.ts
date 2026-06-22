export type ImportSection = {
  sheetName: string;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
};

export type ImportSummary = {
  mainCategories: ImportSection;
  categories: ImportSection;
  amcs: ImportSection;
  funds: ImportSection;
  benchmarks: ImportSection;
  benchmarkReturns: ImportSection;
  nfos: ImportSection;
  indexSnapshots: ImportSection;
  topHoldings: ImportSection;
};

export type ImportError = {
  sheet: string;
  row: number;
  message: string;
  identifier?: string;
};

export type ImportSkip = {
  sheet: string;
  row: number;
  reason: string;
  identifier?: string;
};

export type MfImportEntity =
  | "all"
  | "main_categories"
  | "main-categories"
  | "categories"
  | "amcs"
  | "funds"
  | "benchmarks"
  | "benchmark_returns"
  | "benchmark-returns"
  | "nfos"
  | "nfo"
  | "index_snapshots"
  | "index-snapshots"
  | "top_holdings"
  | "top-holdings"
  | "full-workbook";

export type WorkbookDTO = {
  mainCategories: Record<string, any>[];
  categories: Record<string, any>[];
  amcs: Record<string, any>[];
  funds: Record<string, any>[];
  benchmarks: Record<string, any>[];
  benchmarkReturns: Record<string, any>[];
  nfos: Record<string, any>[];
  indexSnapshots: Record<string, any>[];
  topHoldings: Record<string, any>[];
};

export type ExportMode = "data" | "template";

export type ImportOptions = {
  filePath?: string;
  entity: MfImportEntity;
  validateOnly?: boolean;
  forceManualTopHoldings?: boolean;
  logSource?: "manual_import" | "api_sync";
  fileName?: string;
  triggeredBy?: string;
};
