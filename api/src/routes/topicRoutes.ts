


// import express from "express";
// import multer from "multer";

// import {
//   getTopics,
//   getTopicById,
//   addTopic,
//   updateTopic,
//   deleteTopic,
//   toggleTopicStatus,
//   getPublishedClustersTopicsArticles,
//   getPublishedTopicWithArticlesByIdAgg,
// } from "../controllers/topicController";

// import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

// const router = express.Router();
// const upload = multer(); // parses multipart/form-data

// // ---------------- PUBLIC ROUTES ----------------

// // List all topics
// router.get("/topic", getTopics);

// // Get clusters -> topics -> articles
// router.get("/topic/published", getPublishedClustersTopicsArticles);

// // Get a published topic with its articles by ID (aggregation)
// router.get("/topic/published/:id", getPublishedTopicWithArticlesByIdAgg);

// // Get a single topic by ID
// router.get("/topic/:id", getTopicById);

// // ---------------- ADMIN / EDITOR ROUTES ----------------

// // Middleware to restrict access to admin/editor roles
// const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

// // Create a new topic
// router.post(
//   "/:role/topic/create",
//   adminEditorMiddleware,
//   upload.none(),   // <-- ADD THIS
//   addTopic
// );

// // Update an existing topic
// router.put(
//   "/:role/topic/edit/:id",
//   adminEditorMiddleware,
//   upload.none(),   // <-- ADD THIS
//   updateTopic
// );

// // Toggle active/inactive status
// router.patch("/:role/topic/change/:id/status", adminEditorMiddleware, toggleTopicStatus);

// // Soft delete a topic
// router.delete("/:role/topic/delete/:id", adminEditorMiddleware, deleteTopic);

// export default router;


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

router.get("/topic/published/cluster/:clusterSlug/slug/:slug", getPublishedTopicByClusterAndSlug);


// Get a single topic by ID
router.get("/topic/:id", getTopicById);

/* -------------------- ADMIN / EDITOR ROUTES -------------------- */
const adminEditorMiddleware = roleFromUrl(["admin", "editor"]);

/* -------------------- CREATE -------------------- */
router.post(
  "/:role/topic/create",
  ...adminEditorMiddleware,
  upload.none(),
  addTopic
);

/* -------------------- UPDATE -------------------- */
router.put(
  "/:role/topic/edit/:id",
  ...adminEditorMiddleware,
  upload.none(),
  updateTopic
);

/* -------------------- TOGGLE STATUS -------------------- */
// routes/topic.ts
router.patch("/:role/topic/toggle-status/:id", ...adminEditorMiddleware, toggleTopicStatus);


/* -------------------- DELETE -------------------- */
router.delete(
  "/:role/topic/delete/:id",
  ...adminEditorMiddleware,
  deleteTopic
);

export default router;
