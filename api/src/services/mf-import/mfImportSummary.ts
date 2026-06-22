import { ImportSection, ImportSummary, ImportError, ImportSkip } from "../../types/mfImportDto";

export class MfImportSummary {
  summary: ImportSummary;
  errors: ImportError[];
  skips: ImportSkip[];

  constructor() {
    this.summary = {
      mainCategories: { sheetName: "Main Categories", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      categories: { sheetName: "Categories", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      amcs: { sheetName: "AMCs", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      funds: { sheetName: "Funds", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      benchmarks: { sheetName: "Benchmarks", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      benchmarkReturns: { sheetName: "Benchmark Returns", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      nfos: { sheetName: "NFO", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      indexSnapshots: { sheetName: "Index Snapshots", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
      topHoldings: { sheetName: "Top Holdings", total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
    };
    this.errors = [];
    this.skips = [];
  }

  addError(sheet: string, row: number, message: string, identifier?: string) {
    this.errors.push({ sheet, row, message, identifier });
    const section = this.getSection(sheet);
    if (section) section.errors += 1;
  }

  addSkip(sheet: string, row: number, reason: string, identifier?: string) {
    this.skips.push({ sheet, row, reason, identifier });
    const section = this.getSection(sheet);
    if (section) section.skipped += 1;
  }

  incrementInserted(sheet: string) {
    const section = this.getSection(sheet);
    if (section) section.inserted += 1;
  }

  incrementUpdated(sheet: string) {
    const section = this.getSection(sheet);
    if (section) section.updated += 1;
  }

  incrementTotal(sheet: string, count: number = 1) {
    const section = this.getSection(sheet);
    if (section) section.total += count;
  }

  getSection(sheet: string): ImportSection | undefined {
    return Object.values(this.summary).find(s => s.sheetName.toLowerCase() === sheet.toLowerCase());
  }

  getReport() {
    return {
      summary: this.summary,
      errors: this.errors,
      skips: this.skips,
    };
  }
}
