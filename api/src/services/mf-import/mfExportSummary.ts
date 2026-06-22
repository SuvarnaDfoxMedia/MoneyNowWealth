export class MfExportSummary {
  summary: Record<string, number>;

  constructor() {
    this.summary = {};
  }

  setExportedCount(entity: string, count: number) {
    this.summary[entity] = count;
  }

  getReport() {
    return this.summary;
  }
}
