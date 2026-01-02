// import type { Request, Response } from "express";
// import * as articleService from "../services/articleService";

// // Extend Express Request type to include `file`
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

//     const sort = { createdAt: -1 }; // latest first

//     const result = await articleService.getArticles({
//       status,
//       search,
//       topic_id,
//       page,
//       limit,
//       sort,
//     });

//     return res.status(200).json({
//       success: true,
//       articles: result.articles || [],
//       total: result.total || 0,
//       currentPage: result.currentPage || page,
//       totalPages: result.totalPages || 1,
//       limit,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch articles",
//     });
//   }
// };

// // Get single article by ID
// export const getArticleById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const article = await articleService.getArticleById(id);

//     if (!article) {
//       return res.status(404).json({
//         success: false,
//         message: "Article not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: article,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch article",
//     });
//   }
// };

// // Create a new article
// // export const addArticle = async (req: Request, res: Response) => {
// //   try {
// //     const body = req.body;
// //     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

// //     if (req.file) {
// //       body.hero_image = req.file.path; // Adjust if you store relativePath
// //     } else if (!body.hero_image) {
// //       body.hero_image = "";
// //     }

// //     if (!["draft", "published", "archived"].includes(body.status)) {
// //       body.status = "draft";
// //     }

// //     delete body.read_time;

// //     const article = await articleService.createArticle(body);
// //     return res.status(201).json({
// //       success: true,
// //       message: "Article created successfully",
// //       data: article,
// //     });
// //   } catch (error: any) {
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Failed to create article",
// //     });
// //   }
// // };

// // // Update an existing article
// // export const updateArticle = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const body = req.body;
// //     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

// //     if (req.file) {
// //       body.hero_image = req.file.path;
// //     } else if (body.hero_image === "null" || !body.hero_image) {
// //       delete body.hero_image;
// //     }

// //     if (!["draft", "published", "archived"].includes(body.status)) {
// //       body.status = "draft";
// //     }

// //     delete body.read_time;

// //     const updated = await articleService.updateArticle(id, body);

// //     if (!updated) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Article not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: "Article updated successfully",
// //       data: updated,
// //     });
// //   } catch (error: any) {
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Failed to update article",
// //     });
// //   }
// // };



// // Create a new article
// export const addArticle = async (req: Request, res: Response) => {
//   try {
//     const body = req.body;

//     // Parse JSON fields from frontend
//     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

//     // Store only the filename of uploaded image
//     if (req.file) {
//       body.hero_image = req.file.filename; // <-- FIXED: store only filename
//     } else if (!body.hero_image) {
//       body.hero_image = "";
//     }

//     // Ensure status is valid
//     if (!["draft", "published", "archived"].includes(body.status)) {
//       body.status = "draft";
//     }

//     // Remove read_time if not needed
//     delete body.read_time;

//     const article = await articleService.createArticle(body);

//     return res.status(201).json({
//       success: true,
//       message: "Article created successfully",
//       data: article,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to create article",
//     });
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
//       body.hero_image = req.file.filename; // <-- FIXED: store only filename
//     } else if (body.hero_image === "null" || !body.hero_image) {
//       delete body.hero_image; // keep existing if not updated
//     }

//     // Validate status
//     if (!["draft", "published", "archived"].includes(body.status)) {
//       body.status = "draft";
//     }

//     delete body.read_time;

//     const updated = await articleService.updateArticle(id, body);

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Article not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Article updated successfully",
//       data: updated,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to update article",
//     });
//   }
// };


// // Toggle article status (active/inactive)
// export const toggleArticleStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Article ID is required",
//       });
//     }

//     const article = await articleService.toggleArticleStatus(id);

//     return res.status(200).json({
//       success: true,
//       message: `Article is now ${article.is_active ? "active" : "inactive"}`,
//       data: article,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to toggle article status",
//     });
//   }
// };

// // Soft delete an article
// export const deleteArticle = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const article = await articleService.getArticleById(id);

//     if (!article) {
//       return res.status(404).json({
//         success: false,
//         message: "Article not found",
//       });
//     }

//     article.is_deleted = true;
//     article.deleted_at = new Date();
//     await article.save();

//     return res.status(200).json({
//       success: true,
//       message: "Article deleted successfully (soft delete)",
//       data: article,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to delete article",
//     });
//   }
// };



import type { Request, Response } from "express";
import * as articleService from "../services/articleService";
import Cluster from "../models/clusterModel";
import mongoose from "mongoose";

// Extend Express Request type to include `file`
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
    const { status, search, topic_id } = req.query;

    const sort = { createdAt: -1 }; // latest first

    const result = await articleService.getArticles({
      status,
      search,
      topic_id,
      page,
      limit,
      sort,
    });

    return res.status(200).json({
      success: true,
      articles: result.articles || [],
      total: result.total || 0,
      currentPage: result.currentPage || page,
      totalPages: result.totalPages || 1,
      limit,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch articles",
    });
  }
};

// Get single article by ID
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch article",
    });
  }
};

// Create a new article
// export const addArticle = async (req: Request, res: Response) => {
//   try {
//     const body = req.body;
//     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

//     if (req.file) {
//       body.hero_image = req.file.path; // Adjust if you store relativePath
//     } else if (!body.hero_image) {
//       body.hero_image = "";
//     }

//     if (!["draft", "published", "archived"].includes(body.status)) {
//       body.status = "draft";
//     }

//     delete body.read_time;

//     const article = await articleService.createArticle(body);
//     return res.status(201).json({
//       success: true,
//       message: "Article created successfully",
//       data: article,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to create article",
//     });
//   }
// };

// // Update an existing article
// export const updateArticle = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const body = req.body;
//     parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

//     if (req.file) {
//       body.hero_image = req.file.path;
//     } else if (body.hero_image === "null" || !body.hero_image) {
//       delete body.hero_image;
//     }

//     if (!["draft", "published", "archived"].includes(body.status)) {
//       body.status = "draft";
//     }

//     delete body.read_time;

//     const updated = await articleService.updateArticle(id, body);

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Article not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Article updated successfully",
//       data: updated,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to update article",
//     });
//   }
// };



// Create a new article
export const addArticle = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Parse JSON fields from frontend
    parseJSONFields(body, ["sections", "faqs", "tools", "related_reads"]);

    // Store only the filename of uploaded image
    if (req.file) {
      body.hero_image = req.file.filename; // <-- FIXED: store only filename
    } else if (!body.hero_image) {
      body.hero_image = "";
    }

    // Ensure status is valid
    if (!["draft", "published", "archived"].includes(body.status)) {
      body.status = "draft";
    }

    // Remove read_time if not needed
    delete body.read_time;

    const article = await articleService.createArticle(body);

    return res.status(201).json({
      success: true,
      message: "Article created successfully",
      data: article,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create article",
    });
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
      body.hero_image = req.file.filename; // <-- FIXED: store only filename
    } else if (body.hero_image === "null" || !body.hero_image) {
      delete body.hero_image; // keep existing if not updated
    }

    // Validate status
    if (!["draft", "published", "archived"].includes(body.status)) {
      body.status = "draft";
    }

    delete body.read_time;

    const updated = await articleService.updateArticle(id, body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update article",
    });
  }
};


// Toggle article status (active/inactive)
export const toggleArticleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Article ID is required",
      });
    }

    const article = await articleService.toggleArticleStatus(id);

    return res.status(200).json({
      success: true,
      message: `Article is now ${article.is_active ? "active" : "inactive"}`,
      data: article,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle article status",
    });
  }
};

// Soft delete an article
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    article.is_deleted = true;
    article.deleted_at = new Date();
    await article.save();

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully (soft delete)",
      data: article,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete article",
    });
  }
};





export const getClusterHierarchy = async (req: Request, res: Response) => {
  try {
    const { clusterId } = req.params;
    const { status, sortField = "sort_order", sortOrder = 1 } = req.query;

    if (!clusterId) {
      return res.status(400).json({
        success: false,
        message: "Cluster ID is required",
      });
    }

    // Aggregation to get cluster + topics + articles
    const result = await Cluster.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(clusterId),
          is_deleted: false,
          status: status || "published",
        },
      },
      {
        $lookup: {
          from: "topics",
          let: { clusterId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$cluster_id", "$$clusterId"] }, is_deleted: false, status: "published" } },
            {
              $lookup: {
                from: "articles",
                let: { topicId: "$_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$topic_id", "$$topicId"] }, is_deleted: false, status: "published" } },
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
          created_at: 1, // add creation date
          sort_order: 1,
          topics: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cluster not found or not published",
      });
    }

    const clusterData = result[0];

    // Return in the format your frontend expects, including description & created_at
    res.status(200).json({
      success: true,
      data: {
        clusters: [
          {
            _id: clusterData._id,
            title: clusterData.title,
            description: clusterData.description || null, // include description
            thumbnail: clusterData.thumbnail || null,
            created_at: clusterData.created_at || null, // include created_at
          },
        ],
        topics: clusterData.topics || [],
        totalArticles:
          clusterData.topics?.reduce((acc: number, t: any) => acc + t.articleCount, 0) || 0,
        totalTopics: clusterData.topics?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching cluster hierarchy:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cluster hierarchy",
    });
  }
};


export const getClusterHierarchyBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params; // <-- get slug from URL
    const { status, sortField = "sort_order", sortOrder = 1 } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Cluster slug is required",
      });
    }

    // Aggregation to get cluster + topics + articles
    const result = await Cluster.aggregate([
      {
        $match: {
          slug: slug,       // <-- match by slug instead of _id
          is_deleted: false,
          status: status || "published",
        },
      },
      {
        $lookup: {
          from: "topics",
          let: { clusterId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$cluster_id", "$$clusterId"] }, is_deleted: false, status: "published" } },
            {
              $lookup: {
                from: "articles",
                let: { topicId: "$_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$topic_id", "$$topicId"] }, is_deleted: false, status: "published" } },
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
      return res.status(404).json({
        success: false,
        message: "Cluster not found or not published",
      });
    }

    const clusterData = result[0];

    res.status(200).json({
      success: true,
      data: {
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
          clusterData.topics?.reduce((acc: number, t: any) => acc + t.articleCount, 0) || 0,
        totalTopics: clusterData.topics?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching cluster hierarchy by slug:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cluster hierarchy",
    });
  }
};
