// src/routes/uploadImage.routes.ts

import express, { Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Article from "@/models/articleModel";

const router = express.Router();

/* --------------------------------------------------
   Ensure Upload Directory Exists
-------------------------------------------------- */
const sectionDir = path.join(process.cwd(), "uploads/section");

if (!fs.existsSync(sectionDir)) {
  fs.mkdirSync(sectionDir, { recursive: true });
}

/* --------------------------------------------------
   Multer Storage Configuration
-------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, sectionDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/* --------------------------------------------------
   File Filter
-------------------------------------------------- */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed!"));
};

/* --------------------------------------------------
   Multer Instance
-------------------------------------------------- */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

/* --------------------------------------------------
   Upload Route
-------------------------------------------------- */
router.post(
  "/upload-image",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const fileUrl = `${process.env.BASE_URL || "http://localhost:5000"}/uploads/section/${req.file.filename}`;

      const { articleId, sectionIndex } = req.body;

      /* ---------------------------------------------
         Update Article If articleId Provided
      --------------------------------------------- */
      if (articleId && mongoose.Types.ObjectId.isValid(articleId)) {
        const article = await Article.findById(articleId);

        if (article && article.sections?.[sectionIndex]) {
          const section = article.sections[sectionIndex];

          section.images = section.images || [];

          section.images.push({
            url: fileUrl,
            caption: req.file.filename,
          });

          await article.save();
        }
      }

      return res.json({
        success: true,
        fileName: req.file.filename,
        url: fileUrl,
      });
    } catch (err: any) {
      console.error("Upload failed:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Upload failed" });
    }
  }
);

export default router;
