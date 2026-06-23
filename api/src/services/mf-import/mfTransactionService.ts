import mongoose from "mongoose";

export class MfTransactionService {
  static async executeWithTransaction<T>(operation: (session?: mongoose.ClientSession) => Promise<T>): Promise<T> {
    let session: mongoose.ClientSession | undefined;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError: any) {
      console.warn("[MfTransactionService] Could not start transaction, running without transaction:", sessionError?.message || sessionError);
      return await operation(undefined);
    }

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error: any) {
      // If standalone MongoDB error is thrown
      if (
        error?.message?.includes("Transaction numbers are only allowed") ||
        error?.errmsg?.includes("Transaction numbers are only allowed") ||
        error?.codeName === "IllegalOperation"
      ) {
        console.warn("[MfTransactionService] Standalone MongoDB detected. Retrying operation without transaction...");
        try {
          await session.abortTransaction();
        } catch (e) {}
        session.endSession();
        return await operation(undefined);
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
