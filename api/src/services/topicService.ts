import { Types } from "mongoose";
import Topic, { ITopic } from "../models/topicModel";
import Cluster from "../models/clusterModel";

interface PaginationResult<T> {
  topics: T[];
  total: number;
}

export const topicService = {
  getPublishedClustersTopicsArticles: async () => {
    const now = new Date();

    return Cluster.aggregate([
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
                    { $in: ["$access_type", ["free", "premium"]] },
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
    ]);
  },

  getPublishedTopicWithArticlesById: async (topicId: string) => {
    const now = new Date();

    const result = await Topic.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(topicId),
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
    ]);

    return result?.[0] || null;
  },

  getTopicList: async () => {
    return Topic.find({ is_deleted: false })
      .select("_id title status publish_date cluster_id summary slug")
      .sort({ title: 1 })
      .lean();
  },

  getAll: async (
    filter: Record<string, any>,
    page = 1,
    limit = 10,
  ): Promise<PaginationResult<ITopic>> => {
    const finalLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);
    const skip = (page - 1) * finalLimit;

    const [topics, total] = await Promise.all([
      Topic.find(filter)
        .populate("cluster_id", "cluster_code title")
        .sort({ created_at: -1, _id: -1 })
        .skip(skip)
        .limit(finalLimit),
      Topic.countDocuments(filter),
    ]);

    return { topics, total };
  },

  getById: (id: string) =>
    Topic.findOne({ _id: id, is_deleted: false }).populate(
      "cluster_id",
      "cluster_code title",
    ),

  create: async (data: any) => {
    const now = new Date();
    let publishDate = data.publish_date ? new Date(data.publish_date) : null;

    if (data.status === "published" && !publishDate) {
      publishDate = now;
    }

    const topicData = {
      ...data,
      access_type: data.access_type || "free",
      status: data.status || "draft",
      is_active: data.is_active ?? 0,
      summary: data.summary || "",
      publish_date: publishDate,
      created_at: now,
      updated_at: now,
    };

    const topic = new Topic(topicData);
    return topic.save();
  },

  update: async (id: string, updateData: any) => {
    if (updateData.publish_date) {
      updateData.publish_date = new Date(updateData.publish_date);
    } else if (updateData.status === "published" && !updateData.publish_date) {
      updateData.publish_date = new Date();
    }

    updateData.updated_at = new Date();
    return Topic.findByIdAndUpdate(id, updateData, { new: true });
  },

  toggleStatus: async (id: string) => {
    const topic = await Topic.findById(id);
    if (!topic) return null;

    topic.is_active = topic.is_active === 1 ? 0 : 1;
    topic.updated_at = new Date();
    return topic.save();
  },

  softDelete: async (id: string) => {
    const topic = await Topic.findById(id);
    if (!topic) return null;

    topic.is_deleted = true;
    topic.is_active = 0;
    topic.deleted_at = new Date();
    topic.updated_at = new Date();
    return topic.save();
  },

  restore: async (id: string) => {
    const topic = await Topic.findById(id);
    if (!topic) return null;

    topic.is_deleted = false;
    topic.deleted_at = undefined;
    topic.updated_at = new Date();
    return topic.save();
  },

  publishTopic: async (id: string) => {
    const topic = await Topic.findById(id);
    if (!topic) return null;

    topic.status = "published";
    topic.is_active = 1;
    topic.publish_date = new Date();
    topic.updated_at = new Date();

    return topic.save();
  },
};
