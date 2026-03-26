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
  publishArticle, // NEW
  getPublishedArticleBySlug,
  getLatestPublishedArticles,
} from "../controllers/articleController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import {
  uploadHeroImage,
  uploadArticleImage,
} from "../middlewares/uploadMiddleware";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/article", getArticles);
router.get("/articles", getArticles); // alias for frontend compatibility
router.get("/article/published/latest", getLatestPublishedArticles);
router.get("/article/published/slug/:slug", getPublishedArticleBySlug);
router.get("/article/:id", getArticleById);
router.get("/cluster/:clusterId/hierarchy", getClusterHierarchy);
router.get("/cluster/slug/:slug/", getClusterHierarchyBySlug);

/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

// Add this:
router.get("/:role/article", adminEditorMiddleware, getArticles);

router.get("/:role/article/:id", getArticleById);

/* Create Article */
router.post(
  "/:role/article/create",
  adminEditorMiddleware,
  uploadHeroImage,
  addArticle,
);

/* Update Article */
router.put(
  "/:role/article/edit/:id",
  adminEditorMiddleware,
  uploadHeroImage,
  updateArticle,
);

/* Publish Article Immediately */
router.patch(
  "/:role/article/publish/:id",
  adminEditorMiddleware,
  publishArticle,
);

/* Toggle Article Status */
router.patch(
  "/:role/article/toggle-status/:id",
  adminEditorMiddleware,
  toggleArticleStatus,
);

/* Delete Article */
router.delete(
  "/:role/article/delete/:id",
  adminEditorMiddleware,
  deleteArticle,
);

/* Section Image Upload (for Rich Text Field) */
router.post(
  "/:role/article/upload-section-image",
  adminEditorMiddleware,
  uploadArticleImage,
  (req: Request, res: Response) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded." });
    }

    const file = req.file as unknown as {
      pathUrl?: string;
      relativePath?: string;
    };

    return res.status(200).json({
      success: true,
      url: file.pathUrl || "",
      relativePath: file.relativePath || "",
    });
  },
);

export default router;
