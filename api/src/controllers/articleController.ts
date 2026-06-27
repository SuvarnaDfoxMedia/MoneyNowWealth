// import type { Request, Response } from "express";
// import * as articleService from "../services/articleService";
// import Cluster from "../models/clusterModel";
// import Article from "../models/articleModel";
// import mongoose from "mongoose";
// import { sendError, sendSuccess } from "../utils/apiResponse";
// import { contentAccessService } from "@/services/contentAccessService";

// declare global {
//   namespace Express {
//     interface Request {
//       file?: Express.Multer.File;
//     }
//   }
// }

// // Helper to parse JSON fields
// const parseJSONFields = (body: any, fields: string[]) => {
//   for (const field of fields) {
//     if (typeof body[field] === "string") {
//       try {
//         body[field] = JSON.parse(body[field]);
//       } catch {
//         body[field] = [];
//       }
//     }
//   }
// };

// // Get all articles
// export const getArticles = async (req: Request, res: Response) => {
//   try {
//     const page = Math.max(Number(req.query.page) || 1, 1);
//     const limit = Math.max(Number(req.query.limit) || 10, 1);
//     const { status, search, topic_id } = req.query;
//     const isPublicRequest = !req.params.role;
//     const allowedAccessTypes = isPublicRequest
//       ? await contentAccessService.getAllowedTopicAccessTypes(req.user?.id)
//       : undefined;

//     const sort = { createdAt: -1 }; // latest first

//     const result = await articleService.getArticles({
//       status,
//       search,
//       topic_id,
//       page,
//       limit,
//       sort,
//       publishedOnly: isPublicRequest,
//       allowedAccessTypes,
//     });

//     const articles = result.articles || [];
//     return sendSuccess(res, "Articles fetched successfully", articles, 200, {
//       articles,
//       total: result.total || 0,
//       currentPage: result.currentPage || page,
//       totalPages: result.totalPages || 1,
//       limit,
//     });
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to fetch articles", 500);
//   }
// };

// // Get single article by ID
// export const getArticleById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const article = await articleService.getArticleById(id);

//     if (!article) {
//       return sendError(res, "Article not found", 404);
//     }

//     return sendSuccess(res, "Article fetched successfully", article);
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to fetch article", 500);
//   }
// };

// export const addArticle = async (req: Request, res: Response) => {
//   try {
//     const body = req.body;

//     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

//     if (req.file) {
//       body.hero_image = req.file.filename; // store only filename
//     } else if (!body.hero_image) {
//       body.hero_image = "";
//     }

//     // Ensure status is valid
//     if (!["draft", "published", "archived"].includes(body.status)) {
//       body.status = "draft";
//     }

//     // Handle publish date
//     if (body.publish_date) {
//       body.publish_date = new Date(body.publish_date);
//     } else if (body.status === "published") {
//       // If publishing now, set publish_date to current date
//       body.publish_date = new Date();
//     }

//     // Remove read_time if not needed
//     delete body.read_time;

//     const article = await articleService.createArticle(body);

//     return sendSuccess(res, "Article created successfully", article, 201);
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to create article", 500);
//   }
// };

// // Update an existing article
// export const updateArticle = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const body = req.body;

//     // Parse JSON fields
//     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

//     // Update hero image if new file uploaded
//     if (req.file) {
//       body.hero_image = req.file.filename; // store only filename
//     } else if (body.hero_image === "null" || !body.hero_image) {
//       delete body.hero_image; // keep existing if not updated
//     }

//     // Validate status
//     if (!["draft", "published", "archived"].includes(body.status)) {
//       body.status = "draft";
//     }

//     // Handle publish date
//     if (body.publish_date) {
//       body.publish_date = new Date(body.publish_date);
//     } else if (body.status === "published") {
//       // If publishing now, set publish_date to current date
//       body.publish_date = new Date();
//     }

//     delete body.read_time;

//     const updated = await articleService.updateArticle(id, body);

//     if (!updated) {
//       return sendError(res, "Article not found", 404);
//     }

//     return sendSuccess(res, "Article updated successfully", updated);
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to update article", 500);
//   }
// };

// // Toggle article status (active/inactive)
// export const toggleArticleStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return sendError(res, "Article ID is required", 400);
//     }

//     const article = await articleService.toggleArticleStatus(id);

//     return sendSuccess(
//       res,
//       `Article is now ${article.is_active ? "active" : "inactive"}`,
//       article,
//     );
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to toggle article status", 500);
//   }
// };

// // Soft delete an article
// export const deleteArticle = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const article = await Article.findById(id);

//     if (!article) {
//       return sendError(res, "Article not found", 404);
//     }

//     article.is_deleted = true;
//     article.deleted_at = new Date();
//     await article.save();

//     return sendSuccess(
//       res,
//       "Article deleted successfully (soft delete)",
//       article,
//     );
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to delete article", 500);
//   }
// };

// export const getPublishedArticleBySlug = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { slug } = req.params;
//     const now = new Date();
//     const allowedAccessTypes = await contentAccessService.getAllowedTopicAccessTypes(
//       req.user?.id,
//     );

//     const result = await Article.aggregate([
//       {
//         $match: {
//           slug,
//           is_deleted: false,
//           is_active: 1,
//           status: "published",
//           publish_date: { $lte: now },
//         },
//       },
//       {
//         $lookup: {
//           from: "topics",
//           localField: "topic_id",
//           foreignField: "_id",
//           as: "topic",
//         },
//       },
//       { $unwind: "$topic" },
//       {
//         $match: {
//           "topic.is_deleted": false,
//           "topic.is_active": 1,
//           "topic.status": "published",
//           "topic.publish_date": { $lte: now },
//         },
//       },
//       {
//         $addFields: {
//           topic_access_type: "$topic.access_type",
//         },
//       },
//       {
//         $lookup: {
//           from: "clusters",
//           localField: "topic.cluster_id",
//           foreignField: "_id",
//           as: "cluster",
//         },
//       },
//       { $unwind: "$cluster" },
//       {
//         $match: {
//           "cluster.is_deleted": false,
//           "cluster.is_active": 1,
//           "cluster.status": "published",
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           article_code: 1,
//           title: 1,
//           slug: 1,
//           hero_image: 1,
//           seo_title: 1,
//           seo_description: 1,
//           focus_keyword: 1,
//           introduction: 1,
//           sections: 1,
//           faqs: 1,
//           tools: 1,
//           related_reads: 1,
//           status: 1,
//           read_time: 1,
//           author: 1,
//           is_active: 1,
//           publish_date: 1,
//           created_at: 1,
//           updated_at: 1,
//           topic: {
//             _id: "$topic._id",
//             title: "$topic.title",
//             slug: "$topic.slug",
//             publish_date: "$topic.publish_date",
//             access_type: "$topic.access_type",
//           },
//           cluster: {
//             _id: "$cluster._id",
//             title: "$cluster.title",
//             slug: "$cluster.slug",
//           },
//         },
//       },
//     ]);

//     if (!result.length) {
//       return sendError(res, "Article not found or not published yet", 404);
//     }

//     const article = result[0];
//     if (!allowedAccessTypes.includes(article.topic?.access_type || "free")) {
//       return sendError(
//         res,
//         "This article is available for premium members only",
//         403,
//         { code: "PREMIUM_CONTENT_ONLY" },
//       );
//     }

//     return sendSuccess(res, "Published article fetched successfully", article, 200, {
//       article,
//       topic: article.topic,
//       cluster: article.cluster,
//     });
//   } catch (error: any) {
//     console.error("Get published article by slug error:", error);
//     return sendError(res, error.message || "Failed to fetch article", 500);
//   }
// };

// export const getLatestPublishedArticles = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const limit = Math.max(Number(req.query.limit) || 10, 1);
//     const now = new Date();
//     const allowedAccessTypes = await contentAccessService.getAllowedTopicAccessTypes(
//       req.user?.id,
//     );

//     const articles = await Article.aggregate([
//       {
//         $match: {
//           is_deleted: false,
//           is_active: 1,
//           status: "published",
//           publish_date: { $lte: now },
//         },
//       },
//       {
//         $lookup: {
//           from: "topics",
//           localField: "topic_id",
//           foreignField: "_id",
//           as: "topic",
//         },
//       },
//       { $unwind: "$topic" },
//       {
//         $match: {
//           "topic.is_deleted": false,
//           "topic.is_active": 1,
//           "topic.status": "published",
//           "topic.publish_date": { $lte: now },
//           "topic.access_type": { $in: allowedAccessTypes },
//         },
//       },
//       {
//         $lookup: {
//           from: "clusters",
//           localField: "topic.cluster_id",
//           foreignField: "_id",
//           as: "cluster",
//         },
//       },
//       { $unwind: "$cluster" },
//       {
//         $match: {
//           "cluster.is_deleted": false,
//           "cluster.is_active": 1,
//           "cluster.status": "published",
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           title: 1,
//           slug: 1,
//           hero_image: 1,
//           author: 1,
//           introduction: 1,
//           created_at: 1,
//           publish_date: 1,
//           topic: {
//             _id: "$topic._id",
//             title: "$topic.title",
//             slug: "$topic.slug",
//             publish_date: "$topic.publish_date",
//           },
//           cluster: {
//             _id: "$cluster._id",
//             title: "$cluster.title",
//             slug: "$cluster.slug",
//           },
//         },
//       },
//       {
//         $addFields: {
//           effective_publish_date: {
//             $max: ["$publish_date", "$topic.publish_date"],
//           },
//         },
//       },
//       { $sort: { effective_publish_date: -1, publish_date: -1, created_at: -1 } },
//       { $limit: limit },
//     ]);

//     return sendSuccess(
//       res,
//       "Latest published articles fetched successfully",
//       articles,
//       200,
//       { articles, total: articles.length },
//     );
//   } catch (error: any) {
//     console.error("Get latest published articles error:", error);
//     return sendError(
//       res,
//       error.message || "Failed to fetch latest published articles",
//       500,
//     );
//   }
// };

// export const getClusterHierarchy = async (req: Request, res: Response) => {
//   try {
//     const { clusterId } = req.params;
//     const { status, sortField = "sort_order", sortOrder = 1 } = req.query;
//     const now = new Date();
//     const allowedAccessTypes = await contentAccessService.getAllowedTopicAccessTypes(
//       req.user?.id,
//     );

//     if (!clusterId) {
//       return sendError(res, "Cluster ID is required", 400);
//     }

//     // Aggregation to get cluster + topics + articles
//     const result = await Cluster.aggregate([
//       {
//         $match: {
//           _id: new mongoose.Types.ObjectId(clusterId),
//           is_deleted: false,
//           is_active: 1,
//           status: status || "published",
//         },
//       },
//       {
//         $lookup: {
//           from: "topics",
//           let: { clusterId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$cluster_id", "$$clusterId"] },
//                 is_deleted: false,
//                 is_active: 1,
//                 status: "published",
//                 publish_date: { $lte: now },
//                 access_type: { $in: allowedAccessTypes },
//               },
//             },
//             {
//               $lookup: {
//                 from: "articles",
//                 let: { topicId: "$_id" },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: { $eq: ["$topic_id", "$$topicId"] },
//                       is_deleted: false,
//                       is_active: 1,
//                       status: "published",
//                       publish_date: { $lte: now },
//                     },
//                   },
//                   { $sort: { publish_date: -1, created_at: -1 } },
//                 ],
//                 as: "articles",
//               },
//             },
//             {
//               $project: {
//                 _id: 1,
//                 topic_code: 1,
//                 title: 1,
//                 slug: 1,
//                 articles: 1,
//                 articleCount: { $size: "$articles" },
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
//           created_at: 1,
//           sort_order: 1,
//           topics: 1,
//         },
//       },
//     ]);

//     if (!result || result.length === 0) {
//       return sendError(res, "Cluster not found or not published", 404);
//     }

//     const clusterData = result[0];

//     const data = {
//       clusters: [
//         {
//           _id: clusterData._id,
//           title: clusterData.title,
//           description: clusterData.description || null,
//           thumbnail: clusterData.thumbnail || null,
//           created_at: clusterData.created_at || null,
//         },
//       ],
//       topics: clusterData.topics || [],
//       totalArticles:
//         clusterData.topics?.reduce(
//           (acc: number, t: any) => acc + t.articleCount,
//           0,
//         ) || 0,
//       totalTopics: clusterData.topics?.length || 0,
//     };

//     return sendSuccess(res, "Cluster hierarchy fetched successfully", data);
//   } catch (error: any) {
//     console.error("Error fetching cluster hierarchy:", error);
//     return sendError(res, error.message || "Failed to fetch cluster hierarchy", 500);
//   }
// };

// export const getClusterHierarchyBySlug = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { slug } = req.params;
//     const { status, sortField = "sort_order", sortOrder = 1 } = req.query;
//     const now = new Date();
//     const allowedAccessTypes = await contentAccessService.getAllowedTopicAccessTypes(
//       req.user?.id,
//     );

//     if (!slug) {
//       return sendError(res, "Cluster slug is required", 400);
//     }

//     // Aggregation to get cluster + topics + articles
//     const result = await Cluster.aggregate([
//       {
//         $match: {
//           slug: slug,
//           is_deleted: false,
//           is_active: 1,
//           status: status || "published",
//         },
//       },
//       {
//         $lookup: {
//           from: "topics",
//           let: { clusterId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$cluster_id", "$$clusterId"] },
//                 is_deleted: false,
//                 is_active: 1,
//                 status: "published",
//                 publish_date: { $lte: now },
//                 access_type: { $in: allowedAccessTypes },
//               },
//             },
//             {
//               $lookup: {
//                 from: "articles",
//                 let: { topicId: "$_id" },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: { $eq: ["$topic_id", "$$topicId"] },
//                       is_deleted: false,
//                       is_active: 1,
//                       status: "published",
//                       publish_date: { $lte: now },
//                     },
//                   },
//                   { $sort: { publish_date: -1, created_at: -1 } },
//                 ],
//                 as: "articles",
//               },
//             },
//             {
//               $project: {
//                 _id: 1,
//                 topic_code: 1,
//                 title: 1,
//                 slug: 1,
//                 articles: 1,
//                 articleCount: { $size: "$articles" },
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
//           created_at: 1,
//           sort_order: 1,
//           topics: 1,
//         },
//       },
//     ]);

//     if (!result || result.length === 0) {
//       return sendError(res, "Cluster not found or not published", 404);
//     }

//     const clusterData = result[0];

//     const data = {
//       clusters: [
//         {
//           _id: clusterData._id,
//           title: clusterData.title,
//           description: clusterData.description || null,
//           thumbnail: clusterData.thumbnail || null,
//           created_at: clusterData.created_at || null,
//         },
//       ],
//       topics: clusterData.topics || [],
//       totalArticles:
//         clusterData.topics?.reduce(
//           (acc: number, t: any) => acc + t.articleCount,
//           0,
//         ) || 0,
//       totalTopics: clusterData.topics?.length || 0,
//     };

//     return sendSuccess(res, "Cluster hierarchy fetched successfully", data);
//   } catch (error: any) {
//     console.error("Error fetching cluster hierarchy by slug:", error);
//     return sendError(res, error.message || "Failed to fetch cluster hierarchy", 500);
//   }
// };

// export const publishArticle = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const article = await Article.findById(id);
//     if (!article) {
//       return sendError(res, "Article not found", 404);
//     }

//     // Update article status
//     article.status = "published";
//     article.publish_date = new Date();
//     article.updated_at = new Date();

//     await article.save();

//     return sendSuccess(
//       res,
//       "Article published successfully. Marketing distribution is now handled in GetResponse.",
//       article,
//     );
//   } catch (error: any) {
//     return sendError(res, error.message || "Failed to publish article", 500);
//   }
// };

import type { Request, Response } from "express";
import * as articleService from "../services/articleService";
import Cluster from "../models/clusterModel";
import Article from "../models/articleModel";
import mongoose from "mongoose";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { contentAccessService } from "@/services/contentAccessService";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Helper to parse JSON fields
const parseJSONFields = (body: any, fields: string[]) => {
  for (const field of fields) {
    if (typeof body[field] === "string") {
      try {
        body[field] = JSON.parse(body[field]);
      } catch {
        body[field] = [];
      }
    }
  }
};

// Get all articles
export const getArticles = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const { status, search, topic_id, access_type, cluster_id } = req.query;
    const isPublicRequest = !req.params.role;

    const sort = { createdAt: -1 }; // latest first

    const result = await articleService.getArticles({
      status,
      search,
      topic_id,
      page,
      limit,
      sort,
      publishedOnly: isPublicRequest,
      allowedAccessTypes: access_type ? [access_type] : undefined,
      cluster_id,
    });

    const articles = result.articles || [];
    return sendSuccess(res, "Articles fetched successfully", articles, 200, {
      articles,
      total: result.total || 0,
      currentPage: result.currentPage || page,
      totalPages: result.totalPages || 1,
      limit,
    });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch articles", 500);
  }
};

// Get single article by ID
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);

    if (!article) {
      return sendError(res, "Article not found", 404);
    }

    return sendSuccess(res, "Article fetched successfully", article);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch article", 500);
  }
};

export const addArticle = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

    if (req.file) {
      body.hero_image = req.file.filename; // store only filename
    } else if (!body.hero_image) {
      body.hero_image = "";
    }

    // Ensure status is valid
    if (!["draft", "published", "archived"].includes(body.status)) {
      body.status = "draft";
    }

    // Handle publish date
    if (body.publish_date) {
      body.publish_date = new Date(body.publish_date);
    } else if (body.status === "published") {
      // If publishing now, set publish_date to current date
      body.publish_date = new Date();
    }

    // Remove read_time if not needed
    delete body.read_time;

    const article = await articleService.createArticle(body);

    return sendSuccess(res, "Article created successfully", article, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create article", 500);
  }
};

// Update an existing article
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Parse JSON fields
    parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

    // Update hero image if new file uploaded
    if (req.file) {
      body.hero_image = req.file.filename; // store only filename
    } else if (body.hero_image === "null" || !body.hero_image) {
      delete body.hero_image; // keep existing if not updated
    }

    // Validate status
    if (!["draft", "published", "archived"].includes(body.status)) {
      body.status = "draft";
    }

    // Handle publish date
    if (body.publish_date) {
      body.publish_date = new Date(body.publish_date);
    } else if (body.status === "published") {
      // If publishing now, set publish_date to current date
      body.publish_date = new Date();
    }

    delete body.read_time;

    const updated = await articleService.updateArticle(id, body);

    if (!updated) {
      return sendError(res, "Article not found", 404);
    }

    return sendSuccess(res, "Article updated successfully", updated);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to update article", 500);
  }
};

// Toggle article status (active/inactive)
export const toggleArticleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, "Article ID is required", 400);
    }

    const article = await articleService.toggleArticleStatus(id);

    return sendSuccess(
      res,
      `Article is now ${article.is_active ? "active" : "inactive"}`,
      article,
    );
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Failed to toggle article status",
      500,
    );
  }
};

// Soft delete an article
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) {
      return sendError(res, "Article not found", 404);
    }

    article.is_deleted = true;
    article.deleted_at = new Date();
    await article.save();

    return sendSuccess(
      res,
      "Article deleted successfully (soft delete)",
      article,
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to delete article", 500);
  }
};

export const getPublishedArticleBySlug = async (
  req: Request,
  res: Response,
) => {
  try {
    const { slug } = req.params;
    const now = new Date();
    const allowedAccessTypes =
      await contentAccessService.getAllowedTopicAccessTypes(req.user?.id);

    const result = await Article.aggregate([
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
          from: "topics",
          localField: "topic_id",
          foreignField: "_id",
          as: "topic",
        },
      },
      { $unwind: "$topic" },
      {
        $match: {
          "topic.is_deleted": false,
          "topic.is_active": 1,
          "topic.status": "published",
          "topic.publish_date": { $lte: now },
        },
      },
      {
        $addFields: {
          topic_access_type: "$topic.access_type",
        },
      },
      {
        $lookup: {
          from: "clusters",
          localField: "topic.cluster_id",
          foreignField: "_id",
          as: "cluster",
        },
      },
      { $unwind: "$cluster" },
      {
        $match: {
          "cluster.is_deleted": false,
          "cluster.is_active": 1,
          "cluster.status": "published",
        },
      },
      {
        $project: {
          _id: 1,
          article_code: 1,
          title: 1,
          slug: 1,
          hero_image: 1,
          seo_title: 1,
          seo_description: 1,
          focus_keyword: 1,
          introduction: 1,
          sections: 1,
          faqs: 1,
          tools: 1,
          related_reads: 1,
          status: 1,
          read_time: 1,
          author: 1,
          is_active: 1,
          publish_date: 1,
          created_at: 1,
          updated_at: 1,
          topic: {
            _id: "$topic._id",
            title: "$topic.title",
            slug: "$topic.slug",
            publish_date: "$topic.publish_date",
            access_type: "$topic.access_type",
          },
          cluster: {
            _id: "$cluster._id",
            title: "$cluster.title",
            slug: "$cluster.slug",
          },
        },
      },
    ]);

    if (!result.length) {
      return sendError(res, "Article not found or not published yet", 404);
    }

    const article = result[0];
    if (!allowedAccessTypes.includes(article.topic?.access_type || "free")) {
      return sendError(
        res,
        "This article is available for premium members only",
        403,
        { code: "PREMIUM_CONTENT_ONLY" },
      );
    }

    return sendSuccess(
      res,
      "Published article fetched successfully",
      article,
      200,
      {
        article,
        topic: article.topic,
        cluster: article.cluster,
      },
    );
  } catch (error: any) {
    console.error("Get published article by slug error:", error);
    return sendError(res, error.message || "Failed to fetch article", 500);
  }
};

export const getLatestPublishedArticles = async (
  req: Request,
  res: Response,
) => {
  try {
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const now = new Date();
    const allowedAccessTypes =
      await contentAccessService.getAllowedTopicAccessTypes(req.user?.id);

    const matchStage: any = {
      is_deleted: false,
      is_active: 1,
      status: "published",
      publish_date: { $lte: now },
    };

    if (req.query.show_on_home === "true") matchStage.show_on_home = true;
    if (req.query.show_on_dashboard === "true")
      matchStage.show_on_dashboard = true;

    const articles = await Article.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "topics",
          localField: "topic_id",
          foreignField: "_id",
          as: "topic",
        },
      },
      { $unwind: "$topic" },
      {
        $match: {
          "topic.is_deleted": false,
          "topic.is_active": 1,
          "topic.status": "published",
          "topic.publish_date": { $lte: now },
          "topic.access_type": { $in: allowedAccessTypes },
        },
      },
      {
        $lookup: {
          from: "clusters",
          localField: "topic.cluster_id",
          foreignField: "_id",
          as: "cluster",
        },
      },
      { $unwind: "$cluster" },
      {
        $match: {
          "cluster.is_deleted": false,
          "cluster.is_active": 1,
          "cluster.status": "published",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          hero_image: 1,
          author: 1,
          introduction: 1,
          created_at: 1,
          publish_date: 1,
          show_on_home: 1,
          show_on_dashboard: 1,
          topic: {
            _id: "$topic._id",
            title: "$topic.title",
            slug: "$topic.slug",
            publish_date: "$topic.publish_date",
          },
          cluster: {
            _id: "$cluster._id",
            title: "$cluster.title",
            slug: "$cluster.slug",
          },
        },
      },
      {
        $addFields: {
          effective_publish_date: {
            $max: ["$publish_date", "$topic.publish_date"],
          },
        },
      },
      {
        $sort: { effective_publish_date: -1, publish_date: -1, created_at: -1 },
      },
      { $limit: limit },
    ]);

    return sendSuccess(
      res,
      "Latest published articles fetched successfully",
      articles,
      200,
      { articles, total: articles.length },
    );
  } catch (error: any) {
    console.error("Get latest published articles error:", error);
    return sendError(
      res,
      error.message || "Failed to fetch latest published articles",
      500,
    );
  }
};

export const getClusterHierarchy = async (req: Request, res: Response) => {
  try {
    const { clusterId } = req.params;
    const { status, sortField = "sort_order", sortOrder = 1 } = req.query;
    const now = new Date();
    const allowedAccessTypes =
      await contentAccessService.getAllowedTopicAccessTypes(req.user?.id);

    if (!clusterId) {
      return sendError(res, "Cluster ID is required", 400);
    }

    // Aggregation to get cluster + topics + articles
    const result = await Cluster.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(clusterId),
          is_deleted: false,
          is_active: 1,
          status: status || "published",
        },
      },
      {
        $lookup: {
          from: "topics",
          let: { clusterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$cluster_id", "$$clusterId"] },
                is_deleted: false,
                is_active: 1,
                status: "published",
                publish_date: { $lte: now },
                access_type: { $in: allowedAccessTypes },
              },
            },
            {
              $lookup: {
                from: "articles",
                let: { topicId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$topic_id", "$$topicId"] },
                      is_deleted: false,
                      is_active: 1,
                      status: "published",
                      publish_date: { $lte: now },
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
                articles: 1,
                articleCount: { $size: "$articles" },
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
          created_at: 1,
          sort_order: 1,
          topics: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return sendError(res, "Cluster not found or not published", 404);
    }

    const clusterData = result[0];

    const data = {
      clusters: [
        {
          _id: clusterData._id,
          title: clusterData.title,
          description: clusterData.description || null,
          thumbnail: clusterData.thumbnail || null,
          created_at: clusterData.created_at || null,
        },
      ],
      topics: clusterData.topics || [],
      totalArticles:
        clusterData.topics?.reduce(
          (acc: number, t: any) => acc + t.articleCount,
          0,
        ) || 0,
      totalTopics: clusterData.topics?.length || 0,
    };

    return sendSuccess(res, "Cluster hierarchy fetched successfully", data);
  } catch (error: any) {
    console.error("Error fetching cluster hierarchy:", error);
    return sendError(
      res,
      error.message || "Failed to fetch cluster hierarchy",
      500,
    );
  }
};

export const getClusterHierarchyBySlug = async (
  req: Request,
  res: Response,
) => {
  try {
    const { slug } = req.params;
    const { status, sortField = "sort_order", sortOrder = 1 } = req.query;
    const now = new Date();
    const allowedAccessTypes =
      await contentAccessService.getAllowedTopicAccessTypes(req.user?.id);

    if (!slug) {
      return sendError(res, "Cluster slug is required", 400);
    }

    // Aggregation to get cluster + topics + articles
    const result = await Cluster.aggregate([
      {
        $match: {
          slug: slug,
          is_deleted: false,
          is_active: 1,
          status: status || "published",
        },
      },
      {
        $lookup: {
          from: "topics",
          let: { clusterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$cluster_id", "$$clusterId"] },
                is_deleted: false,
                is_active: 1,
                status: "published",
                publish_date: { $lte: now },
                access_type: { $in: allowedAccessTypes },
              },
            },
            {
              $lookup: {
                from: "articles",
                let: { topicId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$topic_id", "$$topicId"] },
                      is_deleted: false,
                      is_active: 1,
                      status: "published",
                      publish_date: { $lte: now },
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
                articles: 1,
                articleCount: { $size: "$articles" },
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
          created_at: 1,
          sort_order: 1,
          topics: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return sendError(res, "Cluster not found or not published", 404);
    }

    const clusterData = result[0];

    const data = {
      clusters: [
        {
          _id: clusterData._id,
          title: clusterData.title,
          description: clusterData.description || null,
          thumbnail: clusterData.thumbnail || null,
          created_at: clusterData.created_at || null,
        },
      ],
      topics: clusterData.topics || [],
      totalArticles:
        clusterData.topics?.reduce(
          (acc: number, t: any) => acc + t.articleCount,
          0,
        ) || 0,
      totalTopics: clusterData.topics?.length || 0,
    };

    return sendSuccess(res, "Cluster hierarchy fetched successfully", data);
  } catch (error: any) {
    console.error("Error fetching cluster hierarchy by slug:", error);
    return sendError(
      res,
      error.message || "Failed to fetch cluster hierarchy",
      500,
    );
  }
};

export const publishArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      return sendError(res, "Article not found", 404);
    }

    // Update article status
    article.status = "published";
    article.publish_date = new Date();
    article.updated_at = new Date();

    await article.save();

    return sendSuccess(
      res,
      "Article published successfully. Marketing distribution is now handled in GetResponse.",
      article,
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to publish article", 500);
  }
};
