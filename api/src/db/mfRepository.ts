import mongoose, { Types } from "mongoose";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFCategory from "../models/mfCategoryModel";
import MFAmc from "../models/mfAmcModel";
import MFFund from "../models/mfFundModel";
import MFNfo from "../models/mfNfoModel";
import MFIndexSnapshot from "../models/mfIndexSnapshotModel";
import MFTopHolding from "../models/mfTopHoldingModel";
import MFBenchmarkReturn from "../models/mfBenchmarkReturnModel";
import MFBenchmark from "../models/mfBenchmarkModel";
import { MfAliasResolver } from "../services/mf-import/MfAliasResolver";
import { parseCategoryPath } from "../utils/categoryParser";

function expandDottedPaths(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (key.includes(".")) {
      const parts = key.split(".");
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = val;
    } else {
      result[key] = val;
    }
  }
  return result;
}

export class MfRepository {
  static async upsertMainCategory(matchKey: string, data: any, session?: mongoose.ClientSession) {
    const existing = await MfAliasResolver.resolveMainCategory(matchKey);
    if (!existing) {
      return await MFMainCategory.create([data], { session }).then(res => res[0]);
    }
    await MFMainCategory.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async upsertCategory(matchKey: string, data: any, session?: mongoose.ClientSession) {
    const existing = await MfAliasResolver.resolveCategory(matchKey);
    if (!existing) {
      // Auto-resolve or create main category if missing to prevent ValidationErrors
      if (!data.main_category_id && (data.mainCategoryName || data.name)) {
        const mainCatName = data.mainCategoryName || parseCategoryPath(data.name).mainCategoryName;
        const mainCat = await MfAliasResolver.resolveMainCategory(mainCatName)
          || await MfRepository.upsertMainCategory(mainCatName, { name: mainCatName }, session);
        data.main_category_id = mainCat._id;
      }
      const expanded = expandDottedPaths(data);
      return await MFCategory.create([expanded], { session }).then(res => res[0]);
    }
    await MFCategory.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async upsertAmc(matchKey: string, data: any, session?: mongoose.ClientSession) {
    const existing = await MfAliasResolver.resolveAmc(matchKey);
    if (!existing) {
      return await MFAmc.create([data], { session }).then(res => res[0]);
    }
    await MFAmc.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async upsertFund(matchQuery: any, data: any, session?: mongoose.ClientSession) {
    const searchPayload = { ...matchQuery, ...data };
    const existing = await MfAliasResolver.resolveFund(searchPayload);
    if (!existing) {
      const expanded = expandDottedPaths(data);
      return await MFFund.create([expanded], { session }).then(res => res[0]);
    }
    await MFFund.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async upsertBenchmark(matchQuery: any, data: any, session?: mongoose.ClientSession) {
    const searchPayload = { ...matchQuery, ...data };
    const existing = await MfAliasResolver.resolveBenchmark(searchPayload);
    if (!existing) {
      return await MFBenchmark.create([data], { session }).then(res => res[0]);
    }
    await MFBenchmark.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async upsertBenchmarkReturn(matchQuery: any, data: any, session?: mongoose.ClientSession) {
    return await MFBenchmarkReturn.findOneAndUpdate(matchQuery, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true, session });
  }

  static async upsertNfo(matchQuery: any, data: any, session?: mongoose.ClientSession) {
    const existing = await MFNfo.findOne(matchQuery);
    if (!existing) {
      return await MFNfo.create([data], { session }).then(res => res[0]);
    }
    await MFNfo.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async upsertIndexSnapshot(matchQuery: any, data: any, session?: mongoose.ClientSession) {
    const existing = await MFIndexSnapshot.findOne(matchQuery);
    if (!existing) {
      return await MFIndexSnapshot.create([data], { session }).then(res => res[0]);
    }
    await MFIndexSnapshot.updateOne({ _id: existing._id }, { $set: data }, { session });
    return existing;
  }

  static async bulkWriteTopHoldings(operations: any[]) {
    return await MFTopHolding.bulkWrite(operations);
  }
}
