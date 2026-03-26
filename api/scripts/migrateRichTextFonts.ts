/**
 * WARNING:
 * Take a database backup before running this migration against production data.
 * Use --dry-run first to review the proposed document updates without writing.
 */

import mongoose from "mongoose";
import connectDatabase from "../src/db/dbConnection";
import CmsPage from "../src/models/cmsPageModel";
import Article from "../src/models/articleModel";
import Cluster from "../src/models/clusterModel";
import SubscriptionPlan from "../src/models/subscriptionPlan.model";
import NewsletterPublish from "../src/models/newsletterPublishModel";
import MFMainCategory from "../src/models/mfMainCategoryModel";
import MFCategory from "../src/models/mfCategoryModel";
import MFNfo from "../src/models/mfNfoModel";
import updateRichTextFonts from "../src/utils/updateRichTextFonts";

type PlainObject = Record<string, any>;

type MigrationResult = {
  changed: boolean;
  update: PlainObject;
  changedFields: string[];
};

type CollectionMigration = {
  name: string;
  model: { collection: mongoose.Collection };
  migrate: (doc: PlainObject) => MigrationResult;
};

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const batchSize = Number(process.env.MIGRATION_BATCH_SIZE || 100);

const updateStringField = (
  source: PlainObject,
  key: string,
  target: PlainObject,
  changedFields: string[],
): boolean => {
  const originalValue = source[key];

  if (typeof originalValue !== "string" || !originalValue.trim()) {
    return false;
  }

  const nextValue = updateRichTextFonts(originalValue);
  if (nextValue === originalValue) {
    return false;
  }

  target[key] = nextValue;
  changedFields.push(key);
  return true;
};

const updateArrayField = (
  items: unknown,
  nestedKey: string,
  fieldLabel: string,
  target: PlainObject,
  changedFields: string[],
): boolean => {
  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  let changed = false;
  const updatedItems = items.map((item) => {
    if (!item || typeof item !== "object") {
      return item;
    }

    const record = item as PlainObject;
    const originalValue = record[nestedKey];

    if (typeof originalValue !== "string" || !originalValue.trim()) {
      return record;
    }

    const nextValue = updateRichTextFonts(originalValue);
    if (nextValue === originalValue) {
      return record;
    }

    changed = true;
    return {
      ...record,
      [nestedKey]: nextValue,
    };
  });

  if (!changed) {
    return false;
  }

  target[fieldLabel] = updatedItems;
  changedFields.push(fieldLabel);
  return true;
};

const migrateCmsPage = (doc: PlainObject): MigrationResult => {
  const update: PlainObject = {};
  const changedFields: string[] = [];

  updateArrayField(doc.sections, "content", "sections", update, changedFields);
  updateArrayField(doc.faqs, "answer", "faqs", update, changedFields);

  return { changed: changedFields.length > 0, update, changedFields };
};

const migrateArticle = (doc: PlainObject): MigrationResult => {
  const update: PlainObject = {};
  const changedFields: string[] = [];

  updateStringField(doc, "introduction", update, changedFields);
  updateArrayField(doc.sections, "content", "sections", update, changedFields);
  updateArrayField(doc.faqs, "answer", "faqs", update, changedFields);
  updateArrayField(doc.tools, "content", "tools", update, changedFields);
  updateArrayField(
    doc.related_reads,
    "content",
    "related_reads",
    update,
    changedFields,
  );

  return { changed: changedFields.length > 0, update, changedFields };
};

const migrateSingleField =
  (fieldName: string) =>
  (doc: PlainObject): MigrationResult => {
    const update: PlainObject = {};
    const changedFields: string[] = [];

    updateStringField(doc, fieldName, update, changedFields);

    return { changed: changedFields.length > 0, update, changedFields };
  };

const migrations: CollectionMigration[] = [
  { name: "CmsPage", model: CmsPage, migrate: migrateCmsPage },
  { name: "Article", model: Article, migrate: migrateArticle },
  { name: "Cluster", model: Cluster, migrate: migrateSingleField("description") },
  {
    name: "SubscriptionPlan",
    model: SubscriptionPlan,
    migrate: migrateSingleField("description"),
  },
  {
    name: "NewsletterPublish",
    model: NewsletterPublish,
    migrate: migrateSingleField("description"),
  },
  {
    name: "MFMainCategory",
    model: MFMainCategory,
    migrate: migrateSingleField("description"),
  },
  {
    name: "MFCategory",
    model: MFCategory,
    migrate: migrateSingleField("description"),
  },
  {
    name: "MFNfo",
    model: MFNfo,
    migrate: migrateSingleField("fund_objective_short"),
  },
];

const runMigration = async (): Promise<void> => {
  await connectDatabase();

  let totalUpdated = 0;

  for (const migration of migrations) {
    console.log(`\n[START] ${migration.name}`);

    let scanned = 0;
    let updated = 0;

    const cursor = migration.model.collection.find({}, { batchSize });

    for await (const doc of cursor) {
      scanned += 1;

      try {
        const { changed, update, changedFields } = migration.migrate(
          doc as PlainObject,
        );

        if (!changed) {
          continue;
        }

        if (isDryRun) {
          console.log(
            `[DRY RUN] ${migration.name} ${String(doc._id)} -> ${changedFields.join(", ")}`,
          );
          updated += 1;
          totalUpdated += 1;
          continue;
        }

        await migration.model.collection.updateOne(
          { _id: doc._id },
          { $set: update },
        );

        console.log(
          `[UPDATED] ${migration.name} ${String(doc._id)} -> ${changedFields.join(", ")}`,
        );
        updated += 1;
        totalUpdated += 1;
      } catch (error) {
        console.error(
          `[ERROR] ${migration.name} ${String(doc?._id)} ->`,
          error,
        );
      }
    }

    console.log(
      `[DONE] ${migration.name}: scanned=${scanned}, ${isDryRun ? "would_update" : "updated"}=${updated}`,
    );
  }

  console.log(
    `\n[COMPLETE] ${isDryRun ? "Dry run finished" : "Migration finished"} with total ${isDryRun ? "potential updates" : "updates"}=${totalUpdated}`,
  );
};

runMigration()
  .catch((error) => {
    console.error("[FATAL] Rich text font migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
