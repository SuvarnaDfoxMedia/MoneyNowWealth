/**
 * MfApiSyncValidator — minimal validator for API-sync payloads.
 * Only validates required field presence and type coercion for essential entities
 * without running slow DB query resolvers or duplicate key checks.
 */

import { WorkbookDTO } from "../../types/mfImportDto";
import { MfImportSummary } from "./mfImportSummary";

export class MfApiSyncValidator {
  
  static async validate(dto: WorkbookDTO, summary: MfImportSummary): Promise<WorkbookDTO> {
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
      mainCategories: [...dto.mainCategories],
      categories: [...dto.categories],
      amcs: [...dto.amcs],
      funds: [...dto.funds],
      benchmarks: [...dto.benchmarks],
      benchmarkReturns: [...dto.benchmarkReturns],
      nfos: [...dto.nfos],
      indexSnapshots: [...dto.indexSnapshots],
      topHoldings: [...dto.topHoldings]
    };

    // 1. Validate Funds
    for (const fund of dto.funds) {
      const identifier = fund.scheme_code || fund.fund_name || "Unknown Fund";
      if (!fund.fund_name) {
        summary.addError("Funds", -1, "Missing required field: fund_name", identifier);
      }
      if (!fund.amcName) {
        summary.addError("Funds", -1, "Missing required field: amc_name", identifier);
      }
      if (!fund.categoryName) {
        summary.addError("Funds", -1, "Missing required field: category_name", identifier);
      }
    }

    // 2. Validate AMCs
    for (const amc of dto.amcs) {
      if (!amc.name) {
        summary.addError("AMCs", -1, "Missing required field: amc_name", "Unknown AMC");
      }
    }

    // 3. Validate Categories
    for (const cat of dto.categories) {
      if (!cat.name) {
        summary.addError("Categories", -1, "Missing required field: category_name", "Unknown Category");
      }
    }

    return validatedDto;
  }
}
