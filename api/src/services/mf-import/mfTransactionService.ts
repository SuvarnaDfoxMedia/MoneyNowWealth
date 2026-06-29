import mongoose from "mongoose";

export class MfTransactionService {
  private static transactionsSupported: boolean | null = null;

  private static async checkTransactionSupport(): Promise<boolean> {
    if (this.transactionsSupported !== null) {
      return this.transactionsSupported;
    }
    try {
      const db = mongoose.connection.db;
      if (!db) {
        // Connection not ready yet, don't cache
        return true;
      }
      const result = await db.command({ hello: 1 });
      this.transactionsSupported = !!result.setName || !!result.hosts || result.msg === "isdbgrid";
      return this.transactionsSupported;
    } catch (error) {
      console.warn("[MfTransactionService] Error checking transaction support, defaulting to true:", error);
      return true;
    }
  }

  static async executeWithTransaction<T>(operation: (session?: mongoose.ClientSession) => Promise<T>): Promise<T> {
    const isSupported = await this.checkTransactionSupport();
    if (!isSupported) {
      console.log("[MfTransactionService] Standalone MongoDB detected. Running operation without transaction...");
      return await operation(undefined);
    }

    let session: mongoose.ClientSession | undefined;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError: any) {
      console.warn("[MfTransactionService] Could not start transaction, running without transaction:", sessionError?.message || sessionError);
      this.transactionsSupported = false;
      return await operation(undefined);
    }

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error: any) {
      // If standalone MongoDB error is thrown (in case checkTransactionSupport returned a false-positive or failed)
      if (
        error?.message?.includes("Transaction numbers are only allowed") ||
        error?.errmsg?.includes("Transaction numbers are only allowed") ||
        error?.codeName === "IllegalOperation"
      ) {
        console.warn("[MfTransactionService] Standalone MongoDB detected. Disabling future transaction attempts.");
        this.transactionsSupported = false;
        try {
          await session.abortTransaction();
        } catch (e) {}
        if (session) {
          session.endSession();
        }
        // Throw the error directly instead of silently retrying to prevent duplicate/partial side-effects.
        // The user will be notified of the failure, and they can retry the operation cleanly.
        throw new Error(
          "MongoDB is running as a standalone instance (no replica set configured). Transactions are disabled. " +
          "Please rerun the operation, or configure MongoDB as a replica set."
        );
      }

      console.error("[MfTransactionService] Transaction rolled back due to error:", {
        message: error?.message || error,
        stack: error?.stack,
      });
      try {
        await session.abortTransaction();
      } catch (e) {}
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }
}
