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

export const generateSafeFilename = (prefix: string, originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = nameWithoutExt.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase();
  const randomSuffix = Math.round(Math.random() * 1e9);
  return `${prefix}-${sanitizedName}-${Date.now()}-${randomSuffix}${ext}`;
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
    cb(null, generateSafeFilename('cluster-thumb', file.originalname));
  },
});

export const uploadClusterThumbnail = multer({
  storage: clusterStorage,
  fileFilter: imageFileFilter,
  limits: {
    fieldSize: 50 * 1024 * 1024,
  },
}).single("thumbnail");

/* --------------------------------------------------------
   HERO IMAGE UPLOAD  → uploads/hero
--------------------------------------------------------- */
const heroDir = path.join(process.cwd(), "uploads/hero");
ensureDir(heroDir);

const heroStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroDir),
  filename: (_req, file, cb) => {
    cb(null, generateSafeFilename('hero', file.originalname));
  },
});

export const uploadHeroImage = multer({
  storage: heroStorage,
  fileFilter: imageFileFilter,
  limits: {
    fieldSize: 50 * 1024 * 1024,
  },
}).single("hero_image");

/* --------------------------------------------------------
   ARTICLE SECTION IMAGE UPLOAD  → uploads/section
--------------------------------------------------------- */
const sectionDir = path.join(process.cwd(), "uploads/section");
ensureDir(sectionDir);

const sectionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, sectionDir),
  filename: (_req, file, cb) => {
    cb(null, generateSafeFilename('section', file.originalname));
  },
});

export const uploadSectionImage = multer({
  storage: sectionStorage,
  fileFilter: imageFileFilter,
  limits: {
    fieldSize: 50 * 1024 * 1024,
  },
}).single("section_image");

/* --------------------------------------------------------
   ARTICLE BODY IMAGE UPLOAD  → uploads/article
--------------------------------------------------------- */
const articleDir = path.join(process.cwd(), "uploads/article");
ensureDir(articleDir);

const articleStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, articleDir),
  filename: (_req, file, cb) => {
    cb(null, generateSafeFilename('article-body', file.originalname));
  },
});

export const uploadArticleImage = multer({
  storage: articleStorage,
  fileFilter: imageFileFilter,
  limits: {
    fieldSize: 50 * 1024 * 1024,
  },
}).single("image");

/* --------------------------------------------------------
   MF EXCEL UPLOAD  -> uploads/mf-imports
--------------------------------------------------------- */
const mfImportDir = path.join(process.cwd(), "uploads/mf-imports");
ensureDir(mfImportDir);

const mfImportStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mfImportDir),
  filename: (_req, file, cb) => {
    cb(null, generateSafeFilename('mf-data', file.originalname));
  },
});

export const uploadMfExcel = multer({
  storage: mfImportStorage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
  },
}).single("file");

export const uploadNavDataFile = multer({
  storage: mfImportStorage,
  fileFilter: navFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
  },
}).single("file");

export const uploadMfApiDataFile = multer({
  storage: mfImportStorage,
  fileFilter: mfApiFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
  },
}).single("file");
