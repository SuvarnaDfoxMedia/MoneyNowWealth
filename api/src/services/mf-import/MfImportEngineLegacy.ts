import fs from "fs";
import * as XLSX from "xlsx";
import { ImportOptions } from "../../types/mfImportDto";
import { MfWorkbookMapper } from "./MfWorkbookMapper";
import { MfImportEngine } from "./mfImportEngine";
import { MfLoggingService } from "./mfLoggingService";
import { MfWorkbookValidator } from "./MfWorkbookValidator";

export class MfImportEngineLegacy {
  static async importMfExcel(options: ImportOptions) {
    const { filePath, validateOnly, logSource = "manual_import", fileName, triggeredBy } = options;

    const importLog = await MfLoggingService.createImportLog({
      source: logSource,
      file_name: fileName || "unknown",
      triggered_by: triggeredBy || "system",
      status: "processing",
      started_at: new Date()
    });

    try {
      // 1. Workbook Reading
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const rawData: Record<string, Record<string, unknown>[]> = {};
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        rawData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      }

      // 2. Workbook DTO Creation
      let dto = MfWorkbookMapper.mapToDTO(rawData);

      // 3. Validation
      const engine = new MfImportEngine();
      dto = await MfWorkbookValidator.validate(dto, engine.summary);

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
          errorCount: engine.summary.errors.length,
          skipCount: engine.summary.skips.length
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
          errorCount: engine.summary.errors.length,
          skipCount: engine.summary.skips.length
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
        errorCount: engine.summary.errors.length,
        skipCount: engine.summary.skips.length
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
