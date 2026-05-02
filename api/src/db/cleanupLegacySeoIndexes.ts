import mongoose from "mongoose";

const legacySeoIndexMap: Record<string, string[]> = {
  seos: ["route_path_1"],
};

export const cleanupLegacySeoIndexes = async () => {
  const db = mongoose.connection?.db;
  if (!db) return;

  for (const [collectionName, indexNames] of Object.entries(legacySeoIndexMap)) {
    try {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes();
      const existingNames = new Set(existing.map((index) => index.name));

      for (const indexName of indexNames) {
        if (!existingNames.has(indexName)) continue;

        try {
          await collection.dropIndex(indexName);
          console.log(
            `[SEO Cleanup] Dropped legacy index ${collectionName}.${indexName}`,
          );
        } catch (error) {
          console.warn(
            `[SEO Cleanup] Failed to drop index ${collectionName}.${indexName}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.warn(
        `[SEO Cleanup] Unable to inspect indexes for ${collectionName}:`,
        error,
      );
    }
  }
};
