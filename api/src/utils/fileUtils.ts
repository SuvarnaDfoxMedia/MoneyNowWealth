import fs from "fs";

/**
 * Best-effort cleanup of a temp uploaded file.
 * Safe to call even if the path is undefined or already deleted.
 */
export const cleanupUploadedFile = (filePath?: string): void => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Best-effort — never throw on cleanup failure
  }
};
