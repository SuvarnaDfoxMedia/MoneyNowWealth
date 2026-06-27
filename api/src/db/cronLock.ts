import mongoose, { Schema, Document, Model } from "mongoose";

interface ICronLock extends Document {
  name: string;
  lockedAt: Date;
  expiresAt: Date;
}

const cronLockSchema = new Schema<ICronLock>({
  name: { type: String, required: true, unique: true },
  lockedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

const CronLock: Model<ICronLock> =
  mongoose.models.CronLock || mongoose.model<ICronLock>("CronLock", cronLockSchema);

export const acquireLock = async (name: string, ttlMs = 5 * 60 * 1000): Promise<boolean> => {
  try {
    const now = new Date();
    await CronLock.create({
      name,
      lockedAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
    });
    return true;
  } catch {
    // Duplicate key = another instance holds the lock
    return false;
  }
};

export const releaseLock = async (name: string): Promise<void> => {
  await CronLock.deleteOne({ name });
};
