import fs from "fs";
import * as XLSX from "xlsx";
import { ImportOptions } from "../../types/mfImportDto";
import { MfWorkbookMapper } from "./MfWorkbookMapper";
import { MfImportEngine } from "./mfImportEngine";
import { MfLoggingService } from "./mfLoggingService";
import { MfManualImportValidator } from "./MfManualImportValidator";
import { validateWorkbook } from "../MfXlsxStructureValidator";

export class MfManualImportOrchestrator {
  static async importMfExcel(options: ImportOptions) {
    const {
      filePath,
      validateOnly,
      forceManualTopHoldings,
      logSource = "manual_import",
      fileName,
      triggeredBy,
      entity,
    } = options;

    const importLog = await MfLoggingService.createImportLog({
      source: logSource,
      entity: entity || "full-workbook",
      file_name: fileName || "unknown",
      triggered_by: triggeredBy || "system",
      status: "processing",
      validate_only: !!validateOnly,
      force_manual_top_holdings: !!forceManualTopHoldings,
      started_at: new Date()
    });

    try {
      // 1. Workbook Structure Pre-flight Validation
      const structureReport = validateWorkbook(filePath);
      if (!structureReport.valid) {
        await MfLoggingService.updateImportLog(importLog._id, {
          status: "failed",
          error_message: "Workbook structure validation failed. Required sheets or columns missing.",
          completed_at: new Date()
        });

        return {
          success: false,
          summary: {
            Main_Categories: { inserted: 0, updated: 0, skipped: 0 },
            Categories_Master: { inserted: 0, updated: 0, skipped: 0 },
            AMCs: { inserted: 0, updated: 0, skipped: 0 },
            Popular_Funds: { inserted: 0, updated: 0, skipped: 0 },
            Scheme_Details: { inserted: 0, updated: 0, skipped: 0 },
            Benchmarks: { inserted: 0, updated: 0, skipped: 0 },
            NFO_List: { inserted: 0, updated: 0, skipped: 0 },
            Index_Data: { inserted: 0, updated: 0, skipped: 0 },
            Top_Holdings: { inserted: 0, updated: 0, skipped: 0 },
          },
          errors: structureReport.issues.map(issue => ({
            sheet: issue.sheet,
            row: issue.row || -1,
            message: issue.message
          })),
          skips: [],
          skippedRows: [],
          errorCount: structureReport.issues.length,
          skipCount: 0,
          fileName: fileName || "unknown",
          entity: entity || "full-workbook",
          validateOnly: !!validateOnly,
          processedSheets: structureReport.sheetsFound,
        };
      }

      // 2. Workbook Reading
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const rawData: Record<string, Record<string, unknown>[]> = {};
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        rawData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      }

      // 3. Workbook DTO Creation
      let dto = MfWorkbookMapper.mapToDTO(rawData);

      // 4. Validation
      const engine = new MfImportEngine();
      dto = await MfManualImportValidator.validate(dto, engine.summary);

      // Partial Import Prevention: Block entirely if validation failed
      if (engine.summary.errors.length > 0) {
        await MfLoggingService.updateImportLog(importLog._id, {
          status: "failed",
          error_message: "Validation failed. Partial Import Prevention triggered.",
          completed_at: new Date()
        });
        
        return {
          success: false,
          summary: engine.summary.getReport().summary,
          errors: engine.summary.errors,
          skips: engine.summary.skips,
          skippedRows: engine.summary.skips,
          errorCount: engine.summary.errors.length,
          skipCount: engine.summary.skips.length,
          fileName: fileName || "unknown",
          entity: entity || "full-workbook",
          validateOnly: !!validateOnly,
          processedSheets: Object.keys(rawData),
        };
      }

      if (validateOnly) {
        await MfLoggingService.updateImportLog(importLog._id, {
          status: "completed",
          completed_at: new Date(),
          summary: engine.summary.getReport().summary
        });

        return {
          success: true,
          summary: engine.summary.getReport().summary,
          errors: engine.summary.errors,
          skips: engine.summary.skips,
          skippedRows: engine.summary.skips,
          errorCount: engine.summary.errors.length,
          skipCount: engine.summary.skips.length,
          fileName: fileName || "unknown",
          entity: entity || "full-workbook",
          validateOnly: !!validateOnly,
          processedSheets: Object.keys(rawData),
        };
      }

      // 4. Import Engine Invocation
      const resultSummary = await engine.processWorkbook(dto);

      await MfLoggingService.updateImportLog(importLog._id, {
        status: "completed",
        completed_at: new Date(),
        summary: resultSummary
      });

      return {
        success: true,
        summary: resultSummary,
        errors: engine.summary.errors,
        skips: engine.summary.skips,
        skippedRows: engine.summary.skips,
        errorCount: engine.summary.errors.length,
        skipCount: engine.summary.skips.length,
        fileName: fileName || "unknown",
        entity: entity || "full-workbook",
        validateOnly: !!validateOnly,
        processedSheets: Object.keys(rawData),
      };
      
    } catch (error: any) {
      await MfLoggingService.updateImportLog(importLog._id, {
        status: "failed",
        error_message: error.message,
        completed_at: new Date()
      });
      throw error;
    }
  }
}
