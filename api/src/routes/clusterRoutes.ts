

// import express from "express";

// import {
//   addCluster,
//   getClusters,
//   getClusterById,
//   updateCluster,
//   deleteCluster,
//   toggleClusterStatus,
// } from "../controllers/clusterController";

// import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
// import { uploadClusterThumbnail } from "../middlewares/uploadMiddleware";

// const router = express.Router();

// /* -------------------- PUBLIC ROUTES -------------------- */
// router.get("/cluster", getClusters);
// router.get("/cluster/:id", getClusterById);

// /* -------------------- ADMIN / EDITOR MIDDLEWARE -------------------- */
// const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

// /* -------------------- CREATE CLUSTER -------------------- */
// router.post(
//   "/:role/cluster/create",
//   ...adminEditorMiddleware,
//   uploadClusterThumbnail,
//   addCluster
// );

// /* -------------------- UPDATE CLUSTER -------------------- */
// router.put(
//   "/:role/cluster/edit/:id",
//   ...adminEditorMiddleware,
//   uploadClusterThumbnail,
//   updateCluster
// );

// /* -------------------- TOGGLE STATUS -------------------- */
// router.patch(
//   "/:role/cluster/change/:id/status",
//   ...adminEditorMiddleware,
//   toggleClusterStatus
// );

// /* -------------------- DELETE CLUSTER -------------------- */
// router.delete(
//   "/:role/cluster/delete/:id",
//   ...adminEditorMiddleware,
//   deleteCluster
// );

// export default router;


import express from "express";
import {
  addCluster,
  getClusters,
  getClusterById,
  updateCluster,
  deleteCluster,
  toggleClusterStatus,
  getClusterBySlug,
  getAllClustersFirstTopicWithArticle,
} from "../controllers/clusterController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";
import { uploadClusterThumbnail } from "../middlewares/uploadMiddleware";

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/cluster", getClusters);
router.get("/cluster/:id", getClusterById);

router.get("/clusters/slug/:slug", getClusterBySlug);
router.get("/cluster/first-topic-article/all", getAllClustersFirstTopicWithArticle);


/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

/* -------------------- CREATE CLUSTER -------------------- */
router.post(
  "/:role/cluster/create",
  ...adminEditorMiddleware,
  uploadClusterThumbnail,
  addCluster
);

/* -------------------- UPDATE CLUSTER -------------------- */
router.put(
  "/:role/cluster/edit/:id",
  ...adminEditorMiddleware,
  uploadClusterThumbnail,
  updateCluster
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/cluster/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleClusterStatus
);

/* -------------------- DELETE CLUSTER -------------------- */
router.delete(
  "/:role/cluster/delete/:id",
  ...adminEditorMiddleware,
  deleteCluster
);

export default router;
