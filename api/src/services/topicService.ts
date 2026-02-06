import { Types } from "mongoose";
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
   TOPIC SERVICE (UPDATED)
---------------------------------------------- */
export const topicService = {
  /* ----------------------------------------------
      PUBLIC — Get published clusters → topics → articles
      Shows both free and premium topics
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
                    { $lte: ["$publish_date", today] }, // Check publish_date
                    { $in: ["$access_type", ["free", "premium"]] }, // Include both free and premium
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
                          { $lte: ["$publish_date", today] }, // Check article publish_date
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
      Only free topics accessible without subscription
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
          publish_date: { $lte: today }, // Check publish_date
          access_type: "free", // Only free topics accessible publicly
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
                    { $lte: ["$publish_date", today] }, // Check article publish_date
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
      For dropdowns, listings, etc.
  ---------------------------------------------- */
  getTopicList: async () => {
    return Topic.find({ is_deleted: false }) // exclude soft-deleted
      .select("_id title status publish_date cluster_id summary slug") // include necessary fields
      .sort({ title: 1 })
      .lean();
  },

  /* ----------------------------------------------
      ADMIN — Get all topics (Pagination)
  ---------------------------------------------- */
  getAll: async (
    filter: Record<string, any>,
    page = 1,
    limit = 10,
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
      ADMIN — CRUD (UPDATED)
  ---------------------------------------------- */
  getById: (id: string) =>
    Topic.findOne({ _id: id, is_deleted: false }).populate(
      "cluster_id",
      "cluster_code title",
    ),

  create: async (data: any) => {
    const now = new Date();

    // Handle publish date
    let publish_date = data.publish_date ? new Date(data.publish_date) : null;

    // If status is published but no publish_date, set to current date
    if (data.status === "published" && !publish_date) {
      publish_date = now;
    }

    const topicData = {
      ...data,
      access_type: data.access_type || "free",
      status: data.status || "draft",
      is_active: data.is_active ?? 0,
      summary: data.summary || "", // Ensure summary exists for cron emails
      publish_date: publish_date,
      // NEW: Initialize email flag
      is_email_sent: false,
      created_at: now,
      updated_at: now,
    };

    const topic = new Topic(topicData);
    return topic.save();
  },

  update: async (id: string, updateData: any) => {
    // Handle publish date in update
    if (updateData.publish_date) {
      updateData.publish_date = new Date(updateData.publish_date);
    } else if (updateData.status === "published" && !updateData.publish_date) {
      // If publishing now, set publish_date to current date
      updateData.publish_date = new Date();
    }

    // Reset email flag when publishing
    if (updateData.status === "published") {
      updateData.is_email_sent = false;
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

  /* ----------------------------------------------
      NEW: Get topics scheduled for publishing today
      Used by scheduler to send email notifications
  ---------------------------------------------- */
  getTopicsToPublishToday: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await Topic.find({
      status: "published",
      publish_date: { $gte: today, $lt: tomorrow },
      is_email_sent: false,
      is_deleted: false,
      is_active: 1,
    }).populate("cluster_id", "title");
  },

  /* ----------------------------------------------
      NEW: Mark topic email as sent
  ---------------------------------------------- */
  markTopicEmailSent: async (id: string) => {
    return await Topic.findByIdAndUpdate(
      id,
      { is_email_sent: true, updated_at: new Date() },
      { new: true },
    );
  },

  /* ----------------------------------------------
      NEW: Publish topic immediately (Admin action)
  ---------------------------------------------- */
  publishTopic: async (id: string) => {
    const topic = await Topic.findById(id);
    if (!topic) return null;

    topic.status = "published";
    topic.publish_date = new Date();
    topic.is_email_sent = false; // Reset for email notifications
    topic.updated_at = new Date();

    return topic.save();
  },
};
