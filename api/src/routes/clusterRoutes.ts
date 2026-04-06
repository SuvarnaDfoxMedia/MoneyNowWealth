import express from "express";
import {
  addCluster,
  getClusters,
  getClusterById,
  updateCluster,
  deleteCluster,
  toggleClusterStatus,
  getClusterBySlug,
  getActiveClusters,
  getAllClustersFirstTopicWithArticle,
} from "../controllers/clusterController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { uploadClusterThumbnail } from "../middlewares/uploadMiddleware";
import { optionalUserProtect } from "../middlewares/authMiddleware";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/cluster", optionalUserProtect, getClusters);

router.get("/clusters/active", optionalUserProtect, getActiveClusters);

router.get("/cluster/:id", getClusterById);
router.get("/clusters/slug/:slug", getClusterBySlug);
router.get(
  "/cluster/first-topic-article/all",
  optionalUserProtect,
  getAllClustersFirstTopicWithArticle,
);

/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

// Add this:
router.get("/:role/cluster", ...adminEditorMiddleware, getClusters);
router.get("/:role/cluster/:id", ...adminEditorMiddleware, getClusterById);

/* -------------------- CREATE CLUSTER -------------------- */
router.post(
  "/:role/cluster/create",
  ...adminEditorMiddleware,
  uploadClusterThumbnail,
  addCluster,
);

/* -------------------- UPDATE CLUSTER -------------------- */
router.put(
  "/:role/cluster/edit/:id",
  ...adminEditorMiddleware,
  uploadClusterThumbnail,
  updateCluster,
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/cluster/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleClusterStatus,
);

/* -------------------- DELETE CLUSTER -------------------- */
router.delete(
  "/:role/cluster/delete/:id",
  ...adminEditorMiddleware,
  deleteCluster,
);

export default router;
