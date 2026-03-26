import express from "express";
import mongoose from "mongoose";
import { topicService } from "../services/topicService";
import Topic from "../models/topicModel";
import Cluster from "../models/clusterModel";
import { nanoid } from "nanoid";
import { sendError, sendSuccess } from "../utils/apiResponse";

type Request = express.Request;
type Response = express.Response;

// Get published clusters with topics & articles (public view)
export const getPublishedClustersTopicsArticles = async (
  req: Request,
  res: Response,
) => {
  try {
    const now = new Date();

    const clusters = await Cluster.aggregate([
      { $match: { status: "published", is_active: 1, is_deleted: false } },
      { $sort: { sort_order: 1 } },
      {
        $lookup: {
          from: "topics",
          let: { clusterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$cluster_id", "$$clusterId"] },
                    { $eq: ["$is_deleted", false] },
                    { $eq: ["$is_active", 1] },
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publish_date", now] },
                    { $in: ["$access_type", ["free", "premium"]] }, // include Premium + Free
                  ],
                },
              },
            },
            { $sort: { publish_date: -1, created_at: -1 } },
            {
              $lookup: {
                from: "articles",
                let: { topicId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$topic_id", "$$topicId"] },
                          { $eq: ["$is_deleted", false] },
                          { $eq: ["$is_active", 1] },
                          { $eq: ["$status", "published"] },
                          { $lte: ["$publish_date", now] },
                        ],
                      },
                    },
                  },
                  { $sort: { publish_date: -1, created_at: -1 } },
                ],
                as: "articles",
              },
            },
          ],
          as: "topics",
        },
      },
      {
        $project: {
          _id: 1,
          cluster_code: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          sort_order: 1,
          topics: 1,
        },
      },
    ]);

    return sendSuccess(
      res,
      "Published cluster/topic/article data fetched",
      { clusters, count: clusters.length },
      200,
      { clusters, count: clusters.length },
    );
  } catch (error: any) {
    console.error("Error fetching published clusters/topics/articles:", error);
    return sendError(
      res,
      error?.message || "Failed to fetch published cluster/topic/article data",
      500,
    );
  }
};

// Get topic by ID with articles (public view)
export const getPublishedTopicWithArticlesByIdAgg = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const result = await Topic.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          is_deleted: false,
          is_active: 1,
          status: "published",
          publish_date: { $lte: now },
          access_type: "free",
        },
      },
      {
        $lookup: {
          from: "clusters",
          localField: "cluster_id",
          foreignField: "_id",
          as: "cluster",
        },
      },
      { $unwind: "$cluster" },
      { $match: { "cluster.status": "published", "cluster.is_active": 1 } },
      {
        $lookup: {
          from: "articles",
          let: { topicId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$topic_id", "$$topicId"] },
                    { $eq: ["$is_deleted", false] },
                    { $eq: ["$is_active", 1] },
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publish_date", now] },
                  ],
                },
              },
            },
            { $sort: { publish_date: -1, created_at: -1 } },
          ],
          as: "articles",
        },
      },
      {
        $project: {
          _id: 1,
          topic_code: 1,
          title: 1,
          slug: 1,
          summary: 1,
          keywords: 1,
          author: 1,
          publish_date: 1,
          read_time_minutes: 1,
          tags: 1,
          access_type: 1,
          created_at: 1,
          updated_at: 1,
          cluster: {
            _id: "$cluster._id",
            cluster_code: "$cluster.cluster_code",
            title: "$cluster.title",
            description: "$cluster.description",
          },
          articles: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return sendError(res, "Topic not found or not published yet", 404);
    }

    const topicData = result[0];
    return sendSuccess(
      res,
      "Published topic fetched successfully",
      topicData,
      200,
      {
        topic: topicData,
        cluster: topicData.cluster,
        articles: topicData.articles,
      },
    );
  } catch (error: any) {
    console.error("Aggregation get topic by ID error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const getTopics = async (req: Request, res: Response) => {
  try {
    const {
      status,
      cluster_id,
      search,
      page,
      limit,
      includeDeleted,
      access_type,
    } = req.query;

    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (cluster_id) filter.cluster_id = cluster_id;
    if (includeDeleted !== "true") filter.is_deleted = false;
    if (access_type) filter.access_type = access_type;

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: "i" } },
        { topic_code: { $regex: String(search), $options: "i" } },
      ];
    }

    const pageNum = parseInt(String(page)) || 1;
    const perPage = parseInt(String(limit)) || 10;

    const { topics, total } = await topicService.getAll(
      filter,
      pageNum,
      perPage,
    );

    return sendSuccess(res, "Topics fetched successfully", topics, 200, {
      topics,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error: any) {
    console.error("Get topics error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await topicService.getById(id);

    if (!topic) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(res, "Topic fetched successfully", topic, 200, { topic });
  } catch (error: any) {
    console.error("Get topic by ID error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const getPublishedTopicBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const now = new Date();

    const result = await Topic.aggregate([
      {
        $match: {
          slug,
          is_deleted: false,
          is_active: 1,
          status: "published",
          publish_date: { $lte: now },
        },
      },
      {
        $lookup: {
          from: "articles",
          let: { topicId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$topic_id", "$$topicId"] },
                    { $eq: ["$is_active", 1] },
                    { $eq: ["$status", "published"] },
                  ],
                },
              },
            },
          ],
          as: "articles",
        },
      },
    ]);

    if (!result.length) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(
      res,
      "Published topic fetched successfully",
      result[0],
      200,
      {
        topic: result[0],
        articles: result[0].articles,
      },
    );
  } catch (err) {
    return sendError(res, "Server error", 500);
  }
};

// Controller
export const getPublishedTopicByClusterAndSlug = async (
  req: Request,
  res: Response,
) => {
  try {
    const { clusterSlug, slug } = req.params;
    const now = new Date();

    const result = await Topic.aggregate([
      {
        $match: {
          slug,
          cluster_slug: clusterSlug, // <-- match cluster/category slug
          is_deleted: false,
          is_active: 1,
          status: "published",
          publish_date: { $lte: now },
        },
      },
      {
        $lookup: {
          from: "articles",
          let: { topicId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$topic_id", "$$topicId"] },
                    { $eq: ["$is_active", 1] },
                    { $eq: ["$status", "published"] },
                  ],
                },
              },
            },
          ],
          as: "articles",
        },
      },
    ]);

    if (!result.length) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(
      res,
      "Published topic fetched successfully",
      result[0],
      200,
      {
        topic: result[0],
        articles: result[0].articles,
      },
    );
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error", 500);
  }
};

/* ------------------ Add Topic ------------------ */
export const addTopic = async (req: Request, res: Response) => {
  try {
    const {
      cluster_id,
      title,
      slug,
      keywords,
      summary,
      status,
      author,
      publish_date,
      read_time_minutes,
      tags,
      access_type,
      is_active,
    } = req.body;

    if (!cluster_id || !title || !slug) {
      return sendError(res, "cluster_id, title, and slug are required", 400);
    }

    const topic_code = `TOPIC-${Date.now()}-${nanoid(6)}`;

    const topicData: any = {
      topic_code,
      cluster_id,
      title,
      slug,
      keywords: Array.isArray(keywords) ? keywords : [],
      summary: summary || "", // ensure summary exists for cron emails
      author,
      read_time_minutes,
      tags: Array.isArray(tags) ? tags : [],
      access_type: access_type || "free",
      status: ["draft", "published", "archived"].includes(status)
        ? status
        : "draft",
      is_active: typeof is_active === "number" ? is_active : 0,
      is_email_sent: false, // important for cron
    };

    // Handle publish date
    if (publish_date) {
      topicData.publish_date = new Date(publish_date);
    } else if (status === "published") {
      // If publishing now, set publish_date to current date
      topicData.publish_date = new Date();
    }

    const topic = await topicService.create(topicData);

    return sendSuccess(res, "Topic created successfully", topic, 201, { topic });
  } catch (error: any) {
    console.error("Add topic error:", error);

    if (error?.code === 11000) {
      const dupKey = error.keyValue ? Object.keys(error.keyValue)[0] : "field";
      return sendError(res, `${dupKey} already exists`, 400, { field: dupKey });
    }

    return sendError(res, error?.message || "Server error", 500);
  }
};

/* ------------------ Update Topic ------------------ */
export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { publish_date, status, access_type, is_active, ...rest } = req.body;

    const updateData: any = { ...rest };
    if (access_type) updateData.access_type = access_type;
    if (publish_date) updateData.publish_date = new Date(publish_date);
    if (status && ["draft", "published", "archived"].includes(status))
      updateData.status = status;
    if (typeof is_active === "number") updateData.is_active = is_active;

    // Reset email flag if topic is (re)published
    if (status === "published") {
      updateData.is_email_sent = false; // email will be sent via cron
    }

    const topic = await topicService.update(id, updateData);

    if (!topic) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(res, "Topic updated successfully", topic, 200, { topic });
  } catch (error: any) {
    console.error("Update topic error:", error);

    if (error?.code === 11000) {
      const dupKey = error.keyValue ? Object.keys(error.keyValue)[0] : "field";
      return sendError(res, `${dupKey} already exists`, 400, { field: dupKey });
    }

    return sendError(res, error?.message || "Server error", 500);
  }
};

// Toggle is_active only
export const toggleTopicStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findById(id);

    if (!topic) {
      return sendError(res, "Topic not found", 404);
    }

    topic.is_active = topic.is_active === 1 ? 0 : 1;
    topic.updated_at = new Date();
    await topic.save();

    return sendSuccess(
      res,
      topic.is_active === 1 ? "Active" : "Inactive",
      { _id: topic._id, is_active: topic.is_active },
      200,
      { data: { _id: topic._id, is_active: topic.is_active } },
    );
  } catch (error: any) {
    console.error("Toggle is_active error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

// Soft delete
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await topicService.softDelete(id);

    if (!topic) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(res, "Topic deleted successfully", topic);
  } catch (error: any) {
    console.error("Delete topic error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

// Restore
export const restoreTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await topicService.restore(id);

    if (!topic) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(res, "Topic restored successfully", topic);
  } catch (error: any) {
    console.error("Restore topic error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};

export const getTopicList = async (_req: Request, res: Response) => {
  try {
    const topics = await topicService.getTopicList();

    return sendSuccess(res, "Topic list fetched successfully", topics);
  } catch (error) {
    console.error("Get Topic List Error:", error);
    return sendError(res, "Failed to fetch topic list", 500);
  }
};

/* ------------------ Publish Topic ------------------ */
export const publishTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const topic = await topicService.publishTopic(id);

    if (!topic) {
      return sendError(res, "Topic not found", 404);
    }

    return sendSuccess(
      res,
      "Topic published successfully. Email notifications will be sent via scheduler.",
      topic,
      200,
      { topic },
    );
  } catch (error: any) {
    console.error("Publish topic error:", error);
    return sendError(res, error?.message || "Server error", 500);
  }
};
