import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import type { Request } from "express";

/* --------------------------------------------------------
   Ensure Folder Exists
--------------------------------------------------------- */
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/* --------------------------------------------------------
   File Filter (Only Images Allowed)
--------------------------------------------------------- */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"));
};

const excelFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
  ]);
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) || [".xlsx", ".xls"].includes(ext)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only Excel files (.xlsx, .xls) are allowed!"));
};

const navFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
    "text/csv",
  ]);
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) || [".xlsx", ".xls", ".csv"].includes(ext)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only Excel/CSV files (.xlsx, .xls, .csv) are allowed!"));
};

const mfApiFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
    "text/csv",
    "application/json",
  ]);
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) || [".xlsx", ".xls", ".csv", ".json"].includes(ext)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only Excel, CSV, or JSON files (.xlsx, .xls, .csv, .json) are allowed!"));
};

/* --------------------------------------------------------
   Helper: Always return correct public URL
--------------------------------------------------------- */
export const getPublicUrl = (
  req: Request,
  filename: string,
  folder: string
) => {
  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;
};

/* --------------------------------------------------------
   CLUSTER THUMBNAIL UPLOAD  → uploads/thumbnail
--------------------------------------------------------- */
const clusterDir = path.join(process.cwd(), "uploads/thumbnail");
ensureDir(clusterDir);

const clusterStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, clusterDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const safeName = `${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadClusterThumbnail = multer({
  storage: clusterStorage,
  fileFilter: imageFileFilter,
}).single("thumbnail");

/* --------------------------------------------------------
   HERO IMAGE UPLOAD  → uploads/hero
--------------------------------------------------------- */
const heroDir = path.join(process.cwd(), "uploads/hero");
ensureDir(heroDir);

const heroStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const safeName = `${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadHeroImage = multer({
  storage: heroStorage,
  fileFilter: imageFileFilter,
}).single("hero_image");

/* --------------------------------------------------------
   ARTICLE SECTION IMAGE UPLOAD  → uploads/section
--------------------------------------------------------- */
const sectionDir = path.join(process.cwd(), "uploads/section");
ensureDir(sectionDir);

const sectionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, sectionDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const safeName = `${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadSectionImage = multer({
  storage: sectionStorage,
  fileFilter: imageFileFilter,
}).single("section_image");

/* --------------------------------------------------------
   ARTICLE BODY IMAGE UPLOAD  → uploads/article
--------------------------------------------------------- */
const articleDir = path.join(process.cwd(), "uploads/article");
ensureDir(articleDir);

const articleStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, articleDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const safeName = `${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadArticleImage = multer({
  storage: articleStorage,
  fileFilter: imageFileFilter,
}).single("image");

/* --------------------------------------------------------
   MF EXCEL UPLOAD  -> uploads/mf-imports
--------------------------------------------------------- */
const mfImportDir = path.join(process.cwd(), "uploads/mf-imports");
ensureDir(mfImportDir);

const mfImportStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mfImportDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const safeName = `${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadMfExcel = multer({
  storage: mfImportStorage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).single("file");

export const uploadNavDataFile = multer({
  storage: mfImportStorage,
  fileFilter: navFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).single("file");

export const uploadMfApiDataFile = multer({
  storage: mfImportStorage,
  fileFilter: mfApiFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).single("file");
