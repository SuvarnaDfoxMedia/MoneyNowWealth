
import express, { Request, Response } from "express";
import {
  getArticles,
  getArticleById,
  addArticle,
  updateArticle,
  deleteArticle,
  toggleArticleStatus,
  getClusterHierarchy,
getClusterHierarchyBySlug,
} from "../controllers/articleController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { uploadHeroImage, uploadArticleImage } from "../middlewares/uploadMiddleware";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/article", getArticles);
router.get("/article/:id", getArticleById);
router.get("/cluster/:clusterId/hierarchy", getClusterHierarchy);

router.get("/cluster/slug/:slug/", getClusterHierarchyBySlug);
/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

/* Create Article */
router.post(
  "/:role/article/create",
  adminEditorMiddleware,
  uploadHeroImage,
  addArticle
);

/* Update Article */
router.put(
  "/:role/article/edit/:id",
  adminEditorMiddleware,
  uploadHeroImage,
  updateArticle
);

/* Toggle Article Status */
router.patch(
  "/:role/article/toggle-status/:id",
  adminEditorMiddleware,
  toggleArticleStatus
);

/* Delete Article */
router.delete(
  "/:role/article/delete/:id",
  adminEditorMiddleware,
  deleteArticle
);

/* Section Image Upload (for Rich Text Field) */
router.post(
  "/:role/article/upload-section-image",
  adminEditorMiddleware,
  uploadArticleImage,
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded." });
    }

    // Type-safe access to uploaded file properties
    const file = req.file as unknown as {
      pathUrl?: string;
      relativePath?: string;
    };

    return res.status(200).json({
      success: true,
      url: file.pathUrl || "",
      relativePath: file.relativePath || "",
    });
  }
);

export default router;
