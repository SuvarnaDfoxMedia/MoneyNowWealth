// src/routes/uploadRoutes.ts
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Cluster from "@/models/clusterModel";
import Article from "@/models/articleModel";
import { generateSafeFilename } from "../middlewares/uploadMiddleware";

const router = express.Router();

/* ============================================================
   Helper: Ensure folder exists
============================================================ */
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

/* Create folders */
const uploadBase = path.join(process.cwd(), "uploads");
const folders = ["article", "thumbnail", "section", "hero", "testimonial", "cas-statements"];
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
      cb(null, generateSafeFilename(prefix, file.originalname));
    },
  });

const createUploader = (folder: string, prefix: string) =>
  multer({
    storage: createStorage(folder, prefix),
    limits: { fileSize: 5 * 1024 * 1024, fieldSize: 50 * 1024 * 1024 }, // 5 MB limit
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
const testimonialUpload = createUploader("testimonial", "testimonial");

// CAS Statement uploader — PDF only, 10 MB limit
const casStorage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(uploadBase, "cas-statements")),
  filename: (_req, file, cb) => {
    cb(null, generateSafeFilename("cas", file.originalname));
  },
});

const casUpload = multer({
  storage: casStorage,
  limits: { fileSize: 10 * 1024 * 1024, fieldSize: 50 * 1024 * 1024 }, // 10 MB limit per client spec
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed for CAS statements"));
  },
});
/* ----------------- Upload Article Image ------------------ */
router.post(
  "/upload-article",
  articleUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });

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
  }
);

/* ----------------- Upload Hero Image ------------------ */
router.post(
  "/upload-hero",
  heroUpload.single("hero_image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });

      const { articleId } = req.body;
      if (!articleId)
        return res
          .status(400)
          .json({ success: false, message: "articleId is required" });

      const filename = req.file.filename;

      // Store only filename in DB
      const article = await Article.findByIdAndUpdate(
        articleId,
        { hero_image: filename },
        { new: true }
      );

      if (!article)
        return res
          .status(404)
          .json({ success: false, message: "Article not found" });

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
  }
);

/* ----------------- Upload Section Image ------------------ */
router.post(
  "/upload-section",
  sectionUpload.single("section_image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });

      const { articleId, sectionIndex } = req.body;
      const filename = req.file.filename;
      const url = buildPublicUrl(req, "section", filename);

      if (articleId && sectionIndex !== undefined) {
        const article = await Article.findById(articleId);

        if (!article)
          return res
            .status(404)
            .json({ success: false, message: "Article not found" });

        article.sections = article.sections || [];

        // Ensure section exists
        if (!article.sections[sectionIndex]) {
          article.sections[sectionIndex] = {
            title: "",
            content: "",
            images: [],
          };
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
  }
);

/* ----------------- Upload Cluster Thumbnail ------------------ */
router.post(
  "/upload-testimonial",
  testimonialUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const filename = req.file.filename;
      const url = buildPublicUrl(req, "testimonial", filename);

      return res.json({
        success: true,
        filename,
        url,
        message: "Testimonial image uploaded successfully",
      });
    } catch (err: any) {
      console.error("Upload failed:", err.message);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  },
);

router.post(
  "/upload-cluster-thumbnail",
  clusterUpload.single("thumbnail"),
  async (req, res) => {
    try {
      const { clusterId } = req.body;

      if (!clusterId)
        return res
          .status(400)
          .json({ success: false, message: "clusterId is required" });

      const cluster = await Cluster.findById(clusterId);
      if (!cluster)
        return res
          .status(404)
          .json({ success: false, message: "Cluster not found" });

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
        ? `${req.protocol}://${req.get("host")}/uploads/thumbnail/${
            cluster.thumbnail
          }`
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
  }
);


/* ----------------- Upload CAS Statement (PDF) ------------- */
router.post(
  "/upload-cas-statement",
  casUpload.single("cas_file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });

      const filename = req.file.filename;
      const url = buildPublicUrl(req, "cas-statements", filename);

      return res.json({
        success: true,
        filename,
        url,
        message: "CAS statement uploaded successfully",
      });
    } catch (err: any) {
      console.error("CAS upload failed:", err.message);
      return res
        .status(err.message?.includes("Only PDF") ? 400 : 500)
        .json({ success: false, message: err.message ?? "Upload failed" });
    }
  },
);

export default router;

