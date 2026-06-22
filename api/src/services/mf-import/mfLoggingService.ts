import MfImportLog from "../../models/mfImportLogModel";
import MfApiSyncLog from "../../models/mfApiSyncLogModel";

export class MfLoggingService {
  static async createImportLog(data: any) {
    return await MfImportLog.create(data);
  }

  static async updateImportLog(id: any, updateData: any) {
    return await MfImportLog.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  static async createApiSyncLog(data: any) {
    return await MfApiSyncLog.create(data);
  }

  static async updateApiSyncLog(id: any, updateData: any) {
    return await MfApiSyncLog.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }
}
