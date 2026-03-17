import express from "express";
import multer from "multer";

import {
  getTopics,
  getTopicList,
  getTopicById,
  addTopic,
  updateTopic,
  deleteTopic,
  toggleTopicStatus,
  getPublishedClustersTopicsArticles,
  getPublishedTopicWithArticlesByIdAgg,
  getPublishedTopicBySlug,
  getPublishedTopicByClusterAndSlug,
  publishTopic,
} from "../controllers/topicController";

import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

const router = express.Router();
const upload = multer(); // parses multipart/form-data

/* -------------------- PUBLIC ROUTES -------------------- */
// List all topics
router.get("/topic", getTopics);
router.get("/topic-list", getTopicList);

// Get clusters -> topics -> articles
router.get("/topic/published", getPublishedClustersTopicsArticles);

// Get a published topic with its articles by ID (aggregation)
router.get("/topic/published/:id", getPublishedTopicWithArticlesByIdAgg);

router.get("/topic/published/slug/:slug", getPublishedTopicBySlug);

router.get(
  "/topic/published/cluster/:clusterSlug/slug/:slug",
  getPublishedTopicByClusterAndSlug,
);

// Get a single topic by ID
router.get("/topic/:id", getTopicById);

/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

// Add this:
router.get("/:role/topic", ...adminEditorMiddleware, getTopics);
router.get("/:role/topic/:id", ...adminEditorMiddleware, getTopicById);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/topic/create",
  ...adminEditorMiddleware,
  upload.none(),
  addTopic,
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/topic/edit/:id",
  ...adminEditorMiddleware,
  upload.none(),
  updateTopic,
);

/* -------------------- PUBLISH TOPIC -------------------- */
router.patch(
  "/:role/topic/publish/:id",
  ...adminEditorMiddleware,
  publishTopic,
);

/* -------------------- TOGGLE STATUS -------------------- */
router.patch(
  "/:role/topic/toggle-status/:id",
  ...adminEditorMiddleware,
  toggleTopicStatus,
);

/* -------------------- DELETE -------------------- */
router.delete("/:role/topic/delete/:id", ...adminEditorMiddleware, deleteTopic);

export default router;
