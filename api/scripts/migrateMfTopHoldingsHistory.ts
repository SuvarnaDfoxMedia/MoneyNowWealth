import mongoose from "mongoose";
import connectDatabase from "../src/db/dbConnection";
import MFTopHolding from "../src/models/mfTopHoldingModel";
import {
  buildTopHoldingSchemeIdentity,
  computeTopHoldingSnapshotHash,
  recomputeTopHoldingLatestForIdentity,
} from "../src/services/mfTopHoldingService";

const backupCollectionName = () => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `mf_top_holdings_backup_${stamp}`;
};

const run = async () => {
  try {
    await connectDatabase();
    const collection = MFTopHolding.collection;
    const backupName = backupCollectionName();

    const existingCount = await collection.countDocuments({});
    if (existingCount > 0) {
      await collection
        .aggregate([{ $match: {} }, { $out: backupName }], { allowDiskUse: true })
        .toArray();
      console.log(`[MF Top Holdings] Backup created: ${backupName}`);
    } else {
      console.log("[MF Top Holdings] No records found; backup skipped.");
    }

    const cursor = MFTopHolding.find({}).cursor();
    const affectedIdentities = new Set<string>();
    let migrated = 0;
    let skipped = 0;

    for await (const doc of cursor) {
      const schemeIdentity = buildTopHoldingSchemeIdentity(doc.scheme_code, doc.source_isin);
      if (!schemeIdentity) {
        skipped += 1;
        continue;
      }

      const holdings = Array.isArray(doc.holdings) ? doc.holdings : [];
      const updateData = {
        scheme_identity: schemeIdentity,
        holdings_count: holdings.length,
        uploaded_at: doc.uploaded_at || doc.created_at || doc.updated_at || new Date(),
        upload_batch_id: doc.upload_batch_id || "legacy",
        snapshot_hash:
          doc.snapshot_hash ||
          computeTopHoldingSnapshotHash({
            scheme_code: doc.scheme_code,
            source_isin: doc.source_isin,
            portfolio_date: doc.portfolio_date,
            prev_portfolio_date: doc.prev_portfolio_date,
            stock_holdings: doc.stock_holdings,
            bond_holdings: doc.bond_holdings,
            assets_top_10_holdings_pct: doc.assets_top_10_holdings_pct,
            turnover_pct: doc.turnover_pct,
            top_holdings_summary: doc.top_holdings_summary || [],
            holdings,
          }),
        is_latest: false,
      };

      await MFTopHolding.updateOne({ _id: doc._id }, { $set: updateData });
      affectedIdentities.add(schemeIdentity);
      migrated += 1;
    }

    for (const identity of affectedIdentities) {
      await recomputeTopHoldingLatestForIdentity(identity);
    }

    console.log(
      `[MF Top Holdings] Migration completed. migrated=${migrated}, skipped=${skipped}, identities=${affectedIdentities.size}`,
    );
  } catch (error) {
    console.error("[MF Top Holdings] Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
};

void run();
