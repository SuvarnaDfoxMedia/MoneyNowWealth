// import mongoose, { Types, SortOrder } from "mongoose";
// import Topic, { ITopic } from "../models/topicModel";
// import Article from "../models/articleModel";
// import Cluster from "../models/clusterModel";

// /* ----------------------------------------------
//    SERVICE INTERFACE
// ---------------------------------------------- */
// interface PaginationResult<T> {
//   topics: T[];
//   total: number;
// }

// /* ----------------------------------------------
//    TOPIC SERVICE
// ---------------------------------------------- */
// export const topicService = {
//   /* ----------------------------------------------
//       PUBLIC — Get all clusters → topics → articles
//   ---------------------------------------------- */
//   getPublishedClustersTopicsArticles: async () => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const clusters = await Cluster.aggregate([
//       { $match: { status: "published" } },
//       { $sort: { sort_order: 1 } },

//       {
//         $lookup: {
//           from: "topics",
//           let: { clusterId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$cluster_id", "$$clusterId"] },
//                     { $eq: ["$is_deleted", false] },
//                     { $eq: ["$status", "published"] },
//                     { $lte: ["$publish_date", today] },
//                     { $eq: ["$access_type", "free"] },
//                   ],
//                 },
//               },
//             },
//             { $sort: { publish_date: -1, created_at: -1 } },

//             {
//               $lookup: {
//                 from: "articles",
//                 let: { topicId: "$_id" },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $and: [
//                           { $eq: ["$topic_id", "$$topicId"] },
//                           { $eq: ["$is_deleted", false] },
//                           { $eq: ["$status", "published"] },
//                           { $lte: ["$publish_date", today] },
//                         ],
//                       },
//                     },
//                   },
//                   { $sort: { publish_date: -1, created_at: -1 } },
//                 ],
//                 as: "articles",
//               },
//             },
//           ],
//           as: "topics",
//         },
//       },

//       {
//         $project: {
//           _id: 1,
//           cluster_code: 1,
//           title: 1,
//           description: 1,
//           thumbnail: 1,
//           sort_order: 1,
//           topics: 1,
//         },
//       },
//     ]);

//     return clusters;
//   },

//   /* ----------------------------------------------
//       PUBLIC — Get single topic + its articles
//   ---------------------------------------------- */
//   getPublishedTopicWithArticlesById: async (topicId: string) => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const result = await Topic.aggregate([
//       {
//         $match: {
//           _id: new Types.ObjectId(topicId),
//           is_deleted: false,
//           status: "published",
//           publish_date: { $lte: today },
//           access_type: "free",
//         },
//       },

//       {
//         $lookup: {
//           from: "clusters",
//           localField: "cluster_id",
//           foreignField: "_id",
//           as: "cluster",
//         },
//       },

//       { $unwind: "$cluster" },
//       { $match: { "cluster.status": "published" } },

//       {
//         $lookup: {
//           from: "articles",
//           let: { clusterId: "$cluster_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$cluster_id", "$$clusterId"] },
//                     { $eq: ["$is_deleted", false] },
//                     { $eq: ["$status", "published"] },
//                     { $lte: ["$publish_date", today] },
//                     { $in: ["$access_type", ["free", "premium"]] },
//                   ],
//                 },
//               },
//             },
//             { $sort: { publish_date: -1, created_at: -1 } },
//           ],
//           as: "articles",
//         },
//       },

//       {
//         $project: {
//           _id: 1,
//           topic_code: 1,
//           title: 1,
//           slug: 1,
//           summary: 1,
//           keywords: 1,
//           author: 1,
//           publish_date: 1,
//           read_time_minutes: 1,
//           tags: 1,
//           access_type: 1,
//           created_at: 1,
//           updated_at: 1,
//           cluster: {
//             _id: "$cluster._id",
//             cluster_code: "$cluster.cluster_code",
//             title: "$cluster.title",
//             description: "$cluster.description",
//           },
//           articles: 1,
//         },
//       },
//     ]);

//     return result?.[0] || null;
//   },

//   /* ----------------------------------------------
//       ADMIN — Get all topics with pagination
//   ---------------------------------------------- */
//   getAll: async (
//     filter: Record<string, any>,
//     page = 1,
//     limit = 10
//   ): Promise<PaginationResult<ITopic>> => {
//     try {
//       const sortQuery: Record<string, SortOrder> = {
//         created_at: -1,
//         _id: -1,
//       };

//       const skip = (page - 1) * limit;

//       const [topics, total] = await Promise.all([
//         Topic.find(filter)
//           .populate("cluster_id", "cluster_code title")
//           .sort(sortQuery)
//           .skip(skip)
//           .limit(limit),
//         Topic.countDocuments(filter),
//       ]);

//       return { topics, total };
//     } catch (err) {
//       console.error("TopicService getAll Error:", err);
//       throw err;
//     }
//   },

//   /* ----------------------------------------------
//       ADMIN — Get topic by ID
//   ---------------------------------------------- */
//   getById: async (id: string) => {
//     return Topic.findOne({ _id: id, is_deleted: false }).populate(
//       "cluster_id",
//       "cluster_code title"
//     );
//   },

//   /* ----------------------------------------------
//       ADMIN — Create topic
//   ---------------------------------------------- */
//   create: async (data: any) => {
//     const now = new Date();

//     data.access_type = data.access_type || "free";
//     data.status = ["draft", "published", "archived"].includes(data.status)
//       ? data.status
//       : "draft";

//     data.is_active = typeof data.is_active === "number" ? data.is_active : 0;

//     data.created_at = now;
//     data.updated_at = now;

//     const topic = new Topic(data);
//     return topic.save();
//   },

//   /* ----------------------------------------------
//       ADMIN — Update topic
//   ---------------------------------------------- */
//   update: async (id: string, updateData: any) => {
//     const now = new Date();

//     if (updateData.status) {
//       updateData.status = ["draft", "published", "archived"].includes(updateData.status)
//         ? updateData.status
//         : "draft";
//     }

//     if (
//       updateData.is_active !== undefined &&
//       typeof updateData.is_active !== "number"
//     ) {
//       updateData.is_active = 0;
//     }

//     updateData.updated_at = now;

//     return Topic.findByIdAndUpdate(id, updateData, { new: true });
//   },

//   /* ----------------------------------------------
//       ADMIN — Toggle active/inactive
//   ---------------------------------------------- */
//   toggleStatus: async (id: string) => {
//     const topic = await Topic.findById(id);
//     if (!topic) return null;

//     topic.is_active = topic.is_active === 1 ? 0 : 1;
//     topic.updated_at = new Date();

//     return topic.save();
//   },

//   /* ----------------------------------------------
//       ADMIN — Soft delete
//   ---------------------------------------------- */
//   softDelete: async (id: string) => {
//     const topic = await Topic.findById(id);
//     if (!topic) return null;

//     topic.is_deleted = true;
//     topic.is_active = 0;
//     topic.deleted_at = new Date();
//     topic.updated_at = new Date();

//     return topic.save();
//   },

//   /* ----------------------------------------------
//       ADMIN — Restore deleted topic
//   ---------------------------------------------- */
//   restore: async (id: string) => {
//     const topic = await Topic.findById(id);
//     if (!topic) return null;

//     topic.is_deleted = false;
//     topic.deleted_at = undefined;
//     topic.updated_at = new Date();

//     return topic.save();
//   },
// };


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
