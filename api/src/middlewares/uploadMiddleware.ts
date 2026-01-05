
// import multer, { FileFilterCallback } from "multer";
// import path from "path";
// import fs from "fs";
// import type { Request } from "express";

// /* -----------------------------
// Ensure Directory Exists
// ------------------------------ */
// const ensureDir = (dir: string) => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// };

// /* -----------------------------
// File Filter (Only Images)
// ------------------------------ */
// const imageFileFilter = (
//   _req: Request,
//   file: Express.Multer.File,
//   cb: FileFilterCallback
// ) => {
//   if (file.mimetype.startsWith("image/")) cb(null, true);
//   else cb(new Error("Only image files are allowed!"));
// };

// /* -----------------------------
// CLUSTER THUMBNAIL UPLOAD
// ------------------------------ */
// const clusterDir = path.join(process.cwd(), "uploads/clusters");
// ensureDir(clusterDir);

// const clusterStorage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, clusterDir),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `cluster-${unique}${ext}`);
//   },
// });

// export const uploadClusterThumbnail = multer({
//   storage: clusterStorage,
//   fileFilter: imageFileFilter,
// }).single("thumbnail");

// /* -----------------------------
// HERO IMAGE UPLOAD
// ------------------------------ */
// const heroDir = path.join(process.cwd(), "uploads/articles/heroes");
// ensureDir(heroDir);

// const heroStorage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, heroDir),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `hero-${unique}${ext}`);
//   },
// });

// export const uploadHeroImage = multer({
//   storage: heroStorage,
//   fileFilter: imageFileFilter,
// }).single("hero_image");

// /* -----------------------------
// ARTICLE SECTION IMAGE UPLOAD
// ------------------------------ */
// const sectionDir = path.join(process.cwd(), "uploads/articles/sections");
// ensureDir(sectionDir);

// const sectionStorage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, sectionDir),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `article-${unique}${ext}`);
//   },
// });

// export const uploadArticleImage = multer({
//   storage: sectionStorage,
//   fileFilter: imageFileFilter,
// }).single("image");



import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
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

/* --------------------------------------------------------
   Helper: Always return correct public URL
--------------------------------------------------------- */
export const getPublicUrl = (req: Request, filename: string, folder: string) => {
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
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cluster-thumb-${unique}${ext}`);
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
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `hero-${unique}${ext}`);
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
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `section-${unique}${ext}`);
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
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `article-body-${unique}${ext}`);
  },
});

export const uploadArticleImage = multer({
  storage: articleStorage,
  fileFilter: imageFileFilter,
}).single("image");
