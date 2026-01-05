


// src/routes/uploadRoutes.ts
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Cluster from "@/models/clusterModel";
import Article from "@/models/articleModel";

const router = express.Router();

/* ============================================================
   Helper: Ensure folder exists
============================================================ */
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

/* Create folders */
const uploadBase = path.join(process.cwd(), "uploads");
const folders = ["article", "thumbnail", "section", "hero"];
folders.forEach((folder) => ensureDir(path.join(uploadBase, folder)));

/* ============================================================
   Helper: Build public URL for uploaded files
============================================================ */
const buildPublicUrl = (req: any, folder: string, filename: string) => {
  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;
};

/* ============================================================
   Multer Storage Configurations
============================================================ */
const createStorage = (folder: string, prefix: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadBase, folder)),
    filename: (_req, file, cb) => {
      const uniqueName = `${prefix}-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

const createUploader = (folder: string, prefix: string) =>
  multer({
    storage: createStorage(folder, prefix),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Only image files are allowed!"));
    },
  });

/* ============================================================
   Uploaders
============================================================ */
const articleUpload = createUploader("article", "article-body");
const heroUpload = createUploader("hero", "hero");
const sectionUpload = createUploader("section", "section");
const clusterUpload = createUploader("thumbnail", "cluster-thumb");

/* ============================================================
   Routes
============================================================ */

/* ----------------- Upload Article Image ------------------ */
router.post("/upload-article", articleUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const filename = req.file.filename;
    const url = buildPublicUrl(req, "article", filename);

    res.json({
      success: true,
      filename,
      url,
      message: "Article image uploaded successfully",
    });
  } catch (err: any) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

/* ----------------- Upload Hero Image ------------------ */
router.post("/upload-hero", heroUpload.single("hero_image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ success: false, message: "articleId is required" });

    const filename = req.file.filename;

    // Store only filename in DB
    const article = await Article.findByIdAndUpdate(
      articleId,
      { hero_image: filename },
      { new: true }
    );

    if (!article) return res.status(404).json({ success: false, message: "Article not found" });

    const url = buildPublicUrl(req, "hero", filename);

    res.json({
      success: true,
      message: "Hero image uploaded successfully",
      filename,
      url,
      article,
    });
  } catch (err: any) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

/* ----------------- Upload Section Image ------------------ */
router.post("/upload-section", sectionUpload.single("section_image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const { articleId, sectionIndex } = req.body;
    const filename = req.file.filename;
    const url = buildPublicUrl(req, "section", filename);

    if (articleId && sectionIndex !== undefined) {
      const article = await Article.findById(articleId);

      if (!article) return res.status(404).json({ success: false, message: "Article not found" });

      article.sections = article.sections || [];

      // Ensure section exists
      if (!article.sections[sectionIndex]) {
        article.sections[sectionIndex] = { title: "", content: "", images: [] };
      }

      const section = article.sections[sectionIndex];
      section.images = section.images || [];

      section.images.push({
        url,
        caption: filename, // store only filename
      });

      await article.save();
    }

    res.json({
      success: true,
      filename,
      url,
      message: "Section image uploaded successfully",
    });
  } catch (err: any) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

/* ----------------- Upload Cluster Thumbnail ------------------ */
// router.post("/upload-cluster-thumbnail", clusterUpload.single("thumbnail"), async (req, res) => {
//   try {
//     const { clusterId } = req.body;

//     if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
//     if (!clusterId) return res.status(400).json({ success: false, message: "clusterId is required" });

//     const filename = req.file.filename;
//     const url = buildPublicUrl(req, "thumbnail", filename);

//     const cluster = await Cluster.findByIdAndUpdate(
//       clusterId,
//       { thumbnail: filename },
//       { new: true }
//     );

//     if (!cluster) return res.status(404).json({ success: false, message: "Cluster not found" });

//     res.json({
//       success: true,
//       message: "Cluster thumbnail uploaded successfully",
//       filename,
//       url,
//       cluster,
//     });
//   } catch (err: any) {
//     console.error("Upload failed:", err.message);
//     res.status(500).json({ success: false, message: "Upload failed" });
//   }
// });


/* ----------------- Upload Cluster Thumbnail ------------------ */
router.post("/upload-cluster-thumbnail", clusterUpload.single("thumbnail"), async (req, res) => {
  try {
    const { clusterId } = req.body;

    if (!clusterId) return res.status(400).json({ success: false, message: "clusterId is required" });

    const cluster = await Cluster.findById(clusterId);
    if (!cluster) return res.status(404).json({ success: false, message: "Cluster not found" });

    // If a new file is uploaded, use it
    if (req.file) {
      cluster.thumbnail = req.file.filename;
    } 
    // If thumbnail is explicitly empty, remove it
    else if ("thumbnail" in req.body && req.body.thumbnail === "") {
      cluster.thumbnail = ""; // remove thumbnail
    }
    // Otherwise, keep the existing thumbnail

    await cluster.save();

    const url = cluster.thumbnail
      ? `${req.protocol}://${req.get("host")}/uploads/thumbnail/${cluster.thumbnail}`
      : null;

    res.json({
      success: true,
      message: "Cluster thumbnail updated successfully",
      filename: cluster.thumbnail || null,
      url,
      cluster,
    });
  } catch (err: any) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});


export default router;
