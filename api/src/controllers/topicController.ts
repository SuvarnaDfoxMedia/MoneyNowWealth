import express from "express";
import mongoose from "mongoose";
import { topicService } from "../services/topicService";
import Topic from "../models/topicModel";
import Cluster from "../models/clusterModel";
import { nanoid } from "nanoid";

type Request = express.Request;
type Response = express.Response;

// ==================== PUBLIC API ====================

// Get published clusters with topics & articles (public view)
export const getPublishedClustersTopicsArticles = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clusters = await Cluster.aggregate([
      { $match: { status: "published" } },
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
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publish_date", today] },
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
                          { $eq: ["$status", "published"] },
                          { $lte: ["$publish_date", today] },
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

    res.status(200).json({ success: true, count: clusters.length, clusters });
  } catch (error: any) {
    console.error("Error fetching published clusters/topics/articles:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get topic by ID with articles (public view)
export const getPublishedTopicWithArticlesByIdAgg = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Topic.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          is_deleted: false,
          status: "published",
          publish_date: { $lte: today },
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
      { $match: { "cluster.status": "published" } },
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
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publish_date", today] },
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

    if (!result || result.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found or not published yet" });

    const topicData = result[0];
    res.json({
      success: true,
      topic: topicData,
      cluster: topicData.cluster,
      articles: topicData.articles,
    });
  } catch (error: any) {
    console.error("Aggregation get topic by ID error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== ADMIN / CRUD ====================

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

    const sort = { createdAt: -1 };

 const { topics, total } = await topicService.getAll(
  filter,
  pageNum,
  perPage
);


    res.json({
      success: true,
      topics,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error: any) {
    console.error("Get topics error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await topicService.getById(id);

    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found" });

    res.json({ success: true, topic });
  } catch (error: any) {
    console.error("Get topic by ID error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};


export const getPublishedTopicBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Topic.aggregate([
      {
        $match: {
          slug,
          is_deleted: false,
          status: "published",
          publish_date: { $lte: today },
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
      return res.status(404).json({ success: false });
    }

    res.json({
      success: true,
      topic: result[0],
      articles: result[0].articles,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};


// Controller
export const getPublishedTopicByClusterAndSlug = async (req: Request, res: Response) => {
  try {
    const { clusterSlug, slug } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Topic.aggregate([
      {
        $match: {
          slug,
          cluster_slug: clusterSlug, // <-- match cluster/category slug
          is_deleted: false,
          status: "published",
          publish_date: { $lte: today },
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
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    res.json({
      success: true,
      topic: result[0],
      articles: result[0].articles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



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
      return res.status(400).json({
        success: false,
        message: "cluster_id, title, and slug are required",
      });
    }

    const topic_code = `TOPIC-${Date.now()}-${nanoid(6)}`;

    const topicData: any = {
      topic_code, 
      cluster_id,
      title,
      slug,
      keywords: Array.isArray(keywords) ? keywords : [],
      summary,
      author,
      read_time_minutes,
      tags: Array.isArray(tags) ? tags : [],
      access_type: access_type || "free",
      status: ["draft", "published", "archived"].includes(status)
        ? status
        : "draft",
      is_active: typeof is_active === "number" ? is_active : 0,
    };

    if (publish_date) {
      topicData.publish_date = new Date(publish_date);
    }

    const topic = await topicService.create(topicData);

    res.status(201).json({
      success: true,
      topic,
    });
  } catch (error: any) {
    console.error("Add topic error:", error);

    if (error?.code === 11000) {
      const dupKey = error.keyValue
        ? Object.keys(error.keyValue)[0]
        : "field";

      return res.status(400).json({
        success: false,
        message: `${dupKey} already exists`,
        field: dupKey,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


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

    const topic = await topicService.update(id, updateData);
    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found" });

    res.json({ success: true, topic });
  } catch (error: any) {
    console.error("Update topic error:", error);
    if (error?.code === 11000) {
      const dupKey = error.keyValue
        ? Object.keys(error.keyValue)[0]
        : "field";
      return res.status(400).json({
        success: false,
        message: `${dupKey} already exists`,
        field: dupKey,
      });
    }
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// Toggle is_active only
export const toggleTopicStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findById(id);

    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found" });

    topic.is_active = topic.is_active === 1 ? 0 : 1;
    topic.updated_at = new Date();
    await topic.save();

    res.json({
      success: true,
      message: topic.is_active === 1 ? "Active" : "Inactive",
      data: { _id: topic._id, is_active: topic.is_active },
    });
  } catch (error: any) {
    console.error("Toggle is_active error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Soft delete
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await topicService.softDelete(id);

    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found" });

    res.json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete topic error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Restore
export const restoreTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await topicService.restore(id);

    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found" });

    res.json({
      success: true,
      message: "Topic restored successfully",
    });
  } catch (error: any) {
    console.error("Restore topic error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};



export const getTopicList = async (_req: Request, res: Response) => {
  try {
    const topics = await topicService.getTopicList();

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Get Topic List Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch topic list",
    });
  }
};




