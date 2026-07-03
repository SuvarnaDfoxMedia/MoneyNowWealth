import mongoose from "mongoose";
import MFAlias from "../../models/mfAliasModel";
import MFFund from "../../models/mfFundModel";
import MFAmc from "../../models/mfAmcModel";
import MFCategory from "../../models/mfCategoryModel";
import MFMainCategory from "../../models/mfMainCategoryModel";
import MFBenchmark from "../../models/mfBenchmarkModel";

export class MfAliasResolver {

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  static normalizeString(input: string | undefined | null): string {
    if (!input) return "";
    return input.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  static async learnAlias(entity_type: string, entity_id: mongoose.Types.ObjectId, originalString: string, source: string = "auto"): Promise<void> {
    if (!originalString) return;
    const normalized = this.normalizeString(originalString);
    if (!normalized) return;

    try {
      await MFAlias.updateOne(
        { entity_type, normalized_alias: normalized, entity_id },
        { 
          $setOnInsert: { 
            entity_type, 
            entity_id, 
            alias: originalString.trim(), 
            normalized_alias: normalized,
            source,
            is_active: true
          } 
        },
        { upsert: true }
      );
    } catch (err) {
      // Ignore duplicate key errors if two processes insert concurrently
    }
  }

  static async resolveFund(searchPayload: any): Promise<any> {
    return this.resolveEntity(searchPayload, "fund", MFFund, [
      { key: "scheme_code", dbField: "scheme_code" },
      { key: "isin", dbField: "isin" },
      { key: "isin_number", dbField: "isin" },
      { key: "mf_api_scheme_id", dbField: "mf_api_scheme_id", isObjectId: true },
      { key: "mf_api_external_key", dbField: "mf_api_external_key" }
    ], "fund_name");
  }

  static async resolveAmc(searchPayload: any): Promise<any> {
    return this.resolveEntity(searchPayload, "amc", MFAmc, [], "name");
  }

  static async resolveCategory(searchPayload: any): Promise<any> {
    // Primary: resolve by sub-name (e.g. "Domestic-Gold")
    let result = await this.resolveEntity(searchPayload, "category", MFCategory, [], "name");
    if (result) return result;

    // Fallback: if searchPayload is a plain string (category sub-name) or object with a name field,
    // also try matching against the full "Main-Sub" or "Main: Sub" format stored in older records.
    const categoryName = typeof searchPayload === "string"
      ? searchPayload
      : (searchPayload?.name || searchPayload?.categoryName || searchPayload?.category_name);

    if (typeof categoryName === "string" && categoryName.trim()) {
      const escaped = categoryName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = await MFCategory.findOne({
        name: { $regex: new RegExp(`(?:-|:\\s*|^)${escaped}$`, "i") },
        is_deleted: false
      }).lean();
    }
    return result || null;
  }

  static async resolveMainCategory(searchPayload: any): Promise<any> {
    return this.resolveEntity(searchPayload, "main_category", MFMainCategory, [], "name");
  }

  static async resolveBenchmark(searchPayload: any): Promise<any> {
    return this.resolveEntity(searchPayload, "benchmark", MFBenchmark, [
      { key: "benchmark_index_name", dbField: "name" }
    ], "name");
  }

  private static getPlanType(name: string, explicitVal?: string): string {
    const val = String(explicitVal || "").trim().toLowerCase();
    if (val === "direct" || val === "regular" || val === "retail") {
      return val;
    }
    const n = name.toLowerCase();
    if (n.includes("direct")) return "direct";
    if (n.includes("regular")) return "regular";
    if (n.includes("retail")) return "retail";
    return "";
  }

  private static getOptionType(name: string, explicitVal?: string): string {
    const val = String(explicitVal || "").trim().toLowerCase();
    if (val === "growth" || val === "idcw" || val === "dividend" || val === "bonus") {
      if (val === "dividend") return "idcw";
      return val;
    }
    const n = name.toLowerCase();
    if (n.includes("growth")) return "growth";
    if (
      n.includes("idcw") || 
      n.includes("dividend") || 
      n.includes("income distribution") || 
      n.includes("payout") || 
      n.includes("pay out") || 
      n.includes("reinvest")
    ) {
      return "idcw";
    }
    if (n.includes("bonus")) return "bonus";
    return "";
  }

  private static getFirstWord(name: string): string {
    const clean = String(name || "").trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const firstWord = clean.split(/\s+/)[0] || "";
    if (firstWord === "360") {
      const secondWord = clean.split(/\s+/)[1] || "";
      return firstWord + secondWord;
    }
    return firstWord;
  }

  private static isMismatch(payload: any, record: any, nameField: string): boolean {
    const payloadName = payload[nameField] || payload.name || payload.fund_name || "";
    const recordName = record[nameField] || record.name || record.fund_name || "";

    // Scheme Code Mismatch Guard (if both have non-empty codes and they differ)
    const pCode = String(payload.scheme_code || "").trim();
    const rCode = String(record.scheme_code || "").trim();
    if (pCode && rCode && pCode !== rCode) {
      return true;
    }

    // ISIN Mismatch Guard (if both have non-empty ISINs and they differ)
    const pIsin = String(payload.isin || payload.isin_number || "").trim();
    const rIsin = String(record.isin || record.isin_number || "").trim();
    if (pIsin && rIsin && pIsin !== rIsin) {
      return true;
    }

    // 1. AMC ID Mismatch Guard
    if (payload.amc_id && record.amc_id && String(payload.amc_id) !== String(record.amc_id)) {
      return true;
    }

    // 2. AMC Name Prefix Mismatch Guard
    const pFirst = this.getFirstWord(payloadName);
    const rFirst = this.getFirstWord(recordName);
    if (pFirst && rFirst && pFirst !== rFirst) {
      const isAbslMatch = (pFirst === "absl" && rFirst === "aditya") || (pFirst === "aditya" && rFirst === "absl");
      if (!isAbslMatch) {
        return true;
      }
    }

    // 3. Plan Mismatch Guard
    const pPlan = this.getPlanType(payloadName, payload.plan_type);
    const rPlan = this.getPlanType(recordName, record.plan_type);

    if (pPlan && rPlan && pPlan !== rPlan) {
      return true;
    }

    // 4. Option Mismatch Guard
    const pOpt = this.getOptionType(payloadName, payload.option_type);
    const rOpt = this.getOptionType(recordName, record.option_type);

    if (pOpt && rOpt && pOpt !== rOpt) {
      return true;
    }

    return false;
  }

  private static async resolveEntity(
    payload: any, 
    entityType: string, 
    ModelClass: any, 
    uniqueFields: { key: string, dbField: string, isObjectId?: boolean }[],
    nameField: string
  ): Promise<any> {
    const rawInput = payload;
    if (!payload || typeof payload !== "object") {
      // If it's a string, we treat it as the name/alias search
      payload = { [nameField]: payload };
    }

    // Allow direct ObjectId lookups when forms submit selected document ids.
    if (typeof rawInput === "string" && mongoose.Types.ObjectId.isValid(rawInput)) {
      const idMatch = await ModelClass.findOne({ _id: rawInput, is_deleted: false });
      if (idMatch) return idMatch;
    }

    // 1. Internal ID
    if (payload._id && mongoose.Types.ObjectId.isValid(payload._id)) {
      const match = await ModelClass.findById(payload._id);
      if (match) return match;
    }

    // 2-4. Unique Exact Identifiers (AMFI Code, Scheme Code, ISIN, etc.)
    for (const field of uniqueFields) {
      if (payload[field.key]) {
        let val = payload[field.key];
        if (field.isObjectId && mongoose.Types.ObjectId.isValid(val)) {
           val = new mongoose.Types.ObjectId(val);
        }
        const match = await ModelClass.findOne({ [field.dbField]: val, is_deleted: false });
        if (match) return match;
      }
    }

    // Prepare name variables
    const rawName = payload[nameField] || payload.name || payload.fund_name || payload.benchmark_index_name;
    if (!rawName) return null; // Cannot resolve without a name

    const normalizedStr = this.normalizeString(rawName);
    if (!normalizedStr) return null;

    // 5. Exact Name
    const exactMatch = await ModelClass.findOne({ 
      [nameField]: new RegExp(`^${this.escapeRegex(rawName)}$`, "i"), 
      is_deleted: false 
    });
    if (exactMatch) {
      if (entityType === "fund" && this.isMismatch(payload, exactMatch, nameField)) {
        // Mismatch, do not use exactMatch
      } else {
        return exactMatch;
      }
    }

    // 6. Normalized Name
    // To match normalized name on existing records efficiently, we could fetch names. 
    // Instead of fetching all records, we rely on the Alias Table for normalized lookups to keep it scalable.
    // Let's check Alias Table first.

    // 7. Alias Table
    const aliasMatch = await MFAlias.findOne({
      entity_type: entityType,
      normalized_alias: normalizedStr,
      is_active: true
    });
    if (aliasMatch) {
      const match = await ModelClass.findOne({ _id: aliasMatch.entity_id, is_deleted: false });
      if (match) {
        if (entityType === "fund" && this.isMismatch(payload, match, nameField)) {
          // Mismatch, stored alias is incorrect or mismatched
        } else {
          return match;
        }
      }
    }

    // 8 & 9. Fuzzy Match Fallback
    // If not found in alias table, we perform a fuzzy search across the database collection.
    // For performance, we fetch only { _id, [nameField] } and calculate string similarity.
    let query = ModelClass.find({ is_deleted: false });
    if (entityType === "fund") {
      query = query.select(`_id ${nameField} plan_type option_type amc_id scheme_code isin`);
    } else {
      query = query.select(`_id ${nameField}`);
    }
    const allRecords = await query.lean();
    
    let bestMatch: any = null;
    let highestScore = 0;

    for (const record of allRecords) {
      const recordName = record[nameField];
      if (!recordName) continue;

      if (entityType === "fund" && this.isMismatch(payload, record, nameField)) {
        continue;
      }
      
      const recordNormalized = this.normalizeString(recordName);
      if (recordNormalized === normalizedStr) {
        // High confidence normalized match
        bestMatch = record;
        highestScore = 1.0;
        break; // Perfect match
      }

      const score = this.calculateSimilarity(normalizedStr, recordNormalized);
      if (score > highestScore && score >= 0.85) { // 85% threshold
        highestScore = score;
        bestMatch = record;
      }
    }

    if (bestMatch && highestScore >= 0.85) {
      // Auto-learn this alias for future fast lookups
      await this.learnAlias(entityType, bestMatch._id, rawName, "fuzzy_match");
      
      return await ModelClass.findById(bestMatch._id);
    }

    return null;
  }

  // Basic Bigram similarity algorithm for fuzzy matching
  private static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const getBigrams = (str: string) => {
      const bigrams = new Set<string>();
      for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str.substring(i, i + 2));
      }
      return bigrams;
    };

    const bg1 = getBigrams(str1);
    const bg2 = getBigrams(str2);
    
    if (bg1.size === 0 || bg2.size === 0) return 0;

    let intersectionSize = 0;
    bg1.forEach(bg => {
      if (bg2.has(bg)) intersectionSize++;
    });

    // Sørensen–Dice coefficient
    return (2.0 * intersectionSize) / (bg1.size + bg2.size);
  }
}
