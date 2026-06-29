import cron from "node-cron";
import MFNfo from "../models/mfNfoModel";
import { acquireLock, releaseLock } from "../db/cronLock";
import { logger } from "../utils/logger";

const cloneDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getNfoCloseCutoff = (endDate: Date | string | null) => {
  const cutoff = cloneDate(endDate);
  if (!cutoff) return null;

  cutoff.setHours(18, 0, 0, 0);
  // cutoff.setMinutes(cutoff.getMinutes() + 15);
  return cutoff;
};

export const computeNfoOpenState = (
  startDate: Date | string | null,
  endDate: Date | string | null,
  manualFlag = true,
) => {
  if (!manualFlag) return false;

  const now = new Date();
  const start = cloneDate(startDate);
  const closeCutoff = getNfoCloseCutoff(endDate);

  if (start && now < start) return false;
  if (closeCutoff && now >= closeCutoff) return false;
  return true;
};

export const closeExpiredNfos = async () => {
  const candidates = await MFNfo.find({
    is_deleted: false,
    is_open: true,
    subscription_end_date: { $ne: null },
  })
    .select(
      "_id fund_name subscription_start_date subscription_end_date is_open",
    )
    .lean();

  const expiredIds = candidates
    .filter(
      (item) =>
        !computeNfoOpenState(
          item.subscription_start_date ?? null,
          item.subscription_end_date ?? null,
          item.is_open,
        ),
    )
    .map((item) => item._id);

  if (expiredIds.length === 0) {
    return 0;
  }

  const result = await MFNfo.updateMany(
    { _id: { $in: expiredIds }, is_open: true, is_deleted: false },
    { $set: { is_open: false, updated_at: new Date() } },
  );

  return result.modifiedCount;
};

export const startMfNfoScheduler = () => {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      const acquired = await acquireLock("mf-nfo-scheduler", 4 * 60 * 1000);
      if (!acquired) {
        logger.info("[Cron] mf-nfo-scheduler: lock held by another instance, skipping");
        return;
      }
      try {
        logger.info("MF NFO scheduler running at: " + new Date().toISOString());

        const closedCount = await closeExpiredNfos();

        logger.info(`MF NFO scheduler completed. closed_count=${closedCount}`);
      } catch (error) {
        logger.error("Error in MF NFO scheduler: " + error);
      } finally {
        await releaseLock("mf-nfo-scheduler");
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  logger.info("MF NFO scheduler started (runs every 5 minute IST)");
};
