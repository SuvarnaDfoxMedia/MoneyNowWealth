import mongoose from "mongoose";

const legacyIndexMap: Record<string, string[]> = {
  mfschemes: ["scheme_code_1", "slug_1", "code_1"],
  mfnfos: ["nfo_id_1", "slug_1", "code_1"],
  mfmaincategories: ["code_1", "slug_1"],
  mfamcs: ["code_1", "slug_1"],
  mfcategories: ["code_1", "category_id_1", "slug_1"],
  users: ["countryCode_1_mobile_1"],
};

export const cleanupLegacyMfIndexes = async () => {
  const db = mongoose.connection?.db;
  if (!db) return;

  for (const [collectionName, indexNames] of Object.entries(legacyIndexMap)) {
    try {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes();
      const existingNames = new Set(existing.map((idx) => idx.name));

      for (const indexName of indexNames) {
        if (!existingNames.has(indexName)) continue;
        try {
          await collection.dropIndex(indexName);
          // eslint-disable-next-line no-console
          console.log(`[MF Cleanup] Dropped legacy index ${collectionName}.${indexName}`);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            `[MF Cleanup] Failed to drop index ${collectionName}.${indexName}:`,
            error,
          );
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MF Cleanup] Unable to inspect indexes for ${collectionName}:`,
        error,
      );
    }
  }
};
