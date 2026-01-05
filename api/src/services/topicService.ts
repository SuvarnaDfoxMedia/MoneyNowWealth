
import { Types, SortOrder } from "mongoose";
import Topic, { ITopic } from "../models/topicModel";
import Article from "../models/articleModel";
import Cluster from "../models/clusterModel";

/* ----------------------------------------------
   INTERFACES
---------------------------------------------- */
interface PaginationResult<T> {
  topics: T[];
  total: number;
}

/* ----------------------------------------------
   TOPIC SERVICE
---------------------------------------------- */
export const topicService = {
  /* ----------------------------------------------
      PUBLIC — Get published clusters → topics → articles
  ---------------------------------------------- */
  getPublishedClustersTopicsArticles: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Cluster.aggregate([
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
                    { $eq: ["$access_type", "free"] },
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
    ]);
  },

  /* ----------------------------------------------
      PUBLIC — Get single topic + articles
  ---------------------------------------------- */
  getPublishedTopicWithArticlesById: async (topicId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Topic.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(topicId),
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
          let: { clusterId: "$cluster_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$cluster_id", "$$clusterId"] },
                    { $eq: ["$is_deleted", false] },
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publish_date", today] },
                    { $in: ["$access_type", ["free", "premium"]] },
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


/* ----------------------------------------------
   ADMIN / PUBLIC — Get all topics except soft-deleted
---------------------------------------------- */
getTopicList: async () => {
  return Topic.find({ is_deleted: false })  // only exclude soft-deleted
    .select("_id title status publish_date cluster_id") // include fields you need
    .sort({ title: 1 })
    .lean();
},


  /* ----------------------------------------------
      ADMIN — Get all topics (Pagination)
  ---------------------------------------------- */
  getAll: async (
    filter: Record<string, any>,
    page = 1,
    limit = 10
  ): Promise<PaginationResult<ITopic>> => {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      Topic.find(filter)
        .populate("cluster_id", "cluster_code title")
        .sort({ created_at: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Topic.countDocuments(filter),
    ]);

    return { topics, total };
  },

  /* ----------------------------------------------
      ADMIN — CRUD
  ---------------------------------------------- */
  getById: (id: string) =>
    Topic.findOne({ _id: id, is_deleted: false }).populate(
      "cluster_id",
      "cluster_code title"
    ),

  create: (data: any) => {
    const now = new Date();

    return new Topic({
      ...data,
      access_type: data.access_type || "free",
      status: data.status || "draft",
      is_active: data.is_active ?? 0,
      created_at: now,
      updated_at: now,
    }).save();
  },

  update: (id: string, updateData: any) =>
    Topic.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    ),

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
};
