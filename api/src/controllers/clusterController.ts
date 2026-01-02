// import type { Request, Response } from "express";
// import * as clusterService from "../services/clusterService";

// interface MulterRequest extends Request {
//   file?: Express.Multer.File;
// }

// /* ---------------------------------------------------
//    Get paginated clusters
// --------------------------------------------------- */
// export const getClusters = async (req: Request, res: Response) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;

//     const search = String(req.query.search || "");
//     const status = req.query.status;
//     const includeDeleted = req.query.includeDeleted === "true";

//     const sortBy = String(req.query.sortBy || "created_at");
//     const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

//     const response = await clusterService.getClusters({
//       page,
//       limit,
//       search,
//       status,
//       includeDeleted,
//       sort: { [sortBy]: sortOrder },
//     });

//     return res.status(200).json(response);
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch clusters",
//     });
//   }
// };

// /* ---------------------------------------------------
//    Get single cluster by ID
// --------------------------------------------------- */
// export const getClusterById = async (req: Request, res: Response) => {
//   try {
//     const cluster = await clusterService.getClusterById(req.params.id);
//     return res.status(200).json({ success: true, cluster });
//   } catch (error: any) {
//     return res.status(404).json({
//       success: false,
//       message: error.message || "Cluster not found",
//     });
//   }
// };

// /* ---------------------------------------------------
//    Create new cluster
// --------------------------------------------------- */
// export const addCluster = async (req: MulterRequest, res: Response) => {
//   try {
//     if (!req.body || Object.keys(req.body).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Request body is missing",
//       });
//     }

//     // Use file if uploaded; otherwise empty string
//     const thumbnail = req.file ? req.file.filename : "";

//     // Auto-generate cluster_code if not provided
//     const cluster_code =
//       req.body.cluster_code ||
//       `CL${Date.now().toString().slice(-6)}`;

//     // Merge request body and extra fields
//     const clusterData = {
//       ...req.body,
//       title: req.body.title?.trim(),
//       cluster_code,
//       thumbnail,
//     };

//     // Create cluster
//     const cluster = await clusterService.createCluster(clusterData);

//     return res.status(201).json({
//       success: true,
//       message: "Cluster created successfully",
//       cluster,
//     });
//   } catch (error: any) {
//     console.error("Add cluster failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to create cluster",
//     });
//   }
// };
// /* ---------------------------------------------------
//    Update existing cluster
// --------------------------------------------------- */
// export const updateCluster = async (req: MulterRequest, res: Response) => {
//   try {
//     const { id } = req.params;

//     const updatedData: any = {
//       ...req.body,
//       title: req.body.title?.trim(),
//     };

//     // 🚫 IMPORTANT: remove thumbnail from req.body
//     delete updatedData.thumbnail;

//     // ✅ Only update thumbnail if a new file is uploaded
//     if (req.file) {
//       updatedData.thumbnail = req.file.filename;
//     }

//     const cluster = await clusterService.updateCluster(id, updatedData);

//     if (!cluster) {
//       return res.status(404).json({
//         success: false,
//         message: "Cluster not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Cluster updated successfully",
//       cluster,
//     });
//   } catch (error: any) {
//     console.error("Update cluster failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to update cluster",
//     });
//   }
// };

// /* ---------------------------------------------------
//    Toggle cluster active/inactive
// --------------------------------------------------- */
// export const toggleClusterStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const cluster = await clusterService.toggleClusterStatus(id);

//     return res.status(200).json({
//       success: true,
//       message: `Cluster is now ${cluster.is_active ? "active" : "inactive"}`,
//       cluster,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to toggle cluster status",
//     });
//   }
// };

// /* ---------------------------------------------------
//    Soft delete cluster
// --------------------------------------------------- */
// export const deleteCluster = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const cluster = await clusterService.deleteCluster(id);

//     return res.status(200).json({
//       success: true,
//       message: "Cluster deleted successfully (soft delete)",
//       cluster,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to delete cluster",
//     });
//   }
// };



import type { Request, Response } from "express";
import * as clusterService from "../services/clusterService";
import slugify from "slugify";
import Cluster from "../models/clusterModel";


interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/* -------------------------------
   Helper: generate slug
------------------------------- */
const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

/* -------------------------------
   Ensure unique slug via service
------------------------------- */
const generateUniqueSlug = async (titleOrSlug: string, id?: string) => {
  const baseSlug = generateSlug(titleOrSlug);
  let slug = baseSlug;
  let counter = 1;

  while (await clusterService.getClusters({ searchQuery: { slug } }).then(r => r.total > 0 && (!id || r.clusters.some((c: any) => c._id.toString() !== id)))) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

/* ---------------------------------------------------
   Get paginated clusters
--------------------------------------------------- */
export const getClusters = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = String(req.query.search || "");
    const status = req.query.status;
    const includeDeleted = req.query.includeDeleted === "true";
    const sortBy = String(req.query.sortBy || "created_at");
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const response = await clusterService.getClusters({
      page,
      limit,
      searchQuery,
      status,
      includeDeleted,
      sort: { [sortBy]: sortOrder },
    });

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Get clusters failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch clusters",
    });
  }
};



export const getClusterBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params; // slug will come from the route, e.g., /clusters/:slug

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const cluster = await clusterService.getClusterBySlug(slug);

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: "Cluster not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: cluster,
    });
  } catch (error: any) {
    console.error("Get cluster by slug failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cluster",
    });
  }
};

/* ---------------------------------------------------
   Get single cluster by ID
--------------------------------------------------- */
export const getClusterById = async (req: Request, res: Response) => {
  try {
    const cluster = await clusterService.getClusterById(req.params.id);

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: "Cluster not found",
      });
    }

    const clusterObj = cluster.toObject ? cluster.toObject() : cluster;
    clusterObj.slug = clusterObj.slug || generateSlug(clusterObj.title || "");

    return res.status(200).json({ success: true, cluster: clusterObj });
  } catch (error: any) {
    console.error("Get cluster by ID failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cluster",
    });
  }
};

/* ---------------------------------------------------
   Create new cluster
--------------------------------------------------- */
export const addCluster = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const thumbnail = req.file ? req.file.filename : "";

    // Generate unique slug
    const slug = await generateUniqueSlug(req.body.slug || req.body.title || "");

    const cluster_code = req.body.cluster_code || `CL${Date.now().toString().slice(-6)}`;

    const clusterData = {
      ...req.body,
      title: req.body.title?.trim(),
      slug,
      cluster_code,
      thumbnail,
    };

    const cluster = await clusterService.createCluster(clusterData);

    return res.status(201).json({
      success: true,
      message: "Cluster created successfully",
      cluster,
    });
  } catch (error: any) {
    console.error("Add cluster failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create cluster",
    });
  }
};

/* ---------------------------------------------------
   Update existing cluster
--------------------------------------------------- */
export const updateCluster = async (req: MulterRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updatedData: any = {
      ...req.body,
      title: req.body.title?.trim(),
    };

    // Generate unique slug if title changes or slug is provided
    if (req.body.title || req.body.slug) {
      updatedData.slug = await generateUniqueSlug(req.body.slug || req.body.title || "", id);
    }

    if (req.file) {
      updatedData.thumbnail = req.file.filename;
    }

    const cluster = await clusterService.updateCluster(id, updatedData);

    if (!cluster) {
      return res.status(404).json({
        success: false,
        message: "Cluster not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cluster updated successfully",
      cluster,
    });
  } catch (error: any) {
    console.error("Update cluster failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update cluster",
    });
  }
};

/* ---------------------------------------------------
   Toggle cluster active/inactive
--------------------------------------------------- */
export const toggleClusterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cluster = await clusterService.toggleClusterStatus(id);

    return res.status(200).json({
      success: true,
      message: `Cluster is now ${cluster.is_active ? "active" : "inactive"}`,
      cluster,
    });
  } catch (error: any) {
    console.error("Toggle cluster status failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle cluster status",
    });
  }
};

/* ---------------------------------------------------
   Soft delete cluster
--------------------------------------------------- */
export const deleteCluster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cluster = await clusterService.deleteCluster(id);

    return res.status(200).json({
      success: true,
      message: "Cluster deleted successfully (soft delete)",
      cluster,
    });
  } catch (error: any) {
    console.error("Delete cluster failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete cluster",
    });
  }
};


export const getAllClustersFirstTopicWithArticle = async (
  req: Request,
  res: Response
) => {
  try {
    const { status = "published" } = req.query;

    const clusters = await Cluster.aggregate([
      {
        $match: {
          is_deleted: false,
          status: status,
        },
      },

      /* ---------------- FIRST TOPIC ---------------- */
      {
        $lookup: {
          from: "topics",
          let: { clusterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$cluster_id", "$$clusterId"] },
                is_deleted: false,
                status: "published",
              },
            },
            { $sort: { sort_order: 1, created_at: 1 } },
            { $limit: 1 },

            /* ---------------- FIRST ARTICLE ---------------- */
            {
              $lookup: {
                from: "articles",
                let: { topicId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$topic_id", "$$topicId"] },
                      is_deleted: false,
                      status: "published",
                    },
                  },
                  { $sort: { publish_date: -1, created_at: -1 } },
                  { $limit: 1 },
                ],
                as: "article",
              },
            },
            {
              $unwind: {
                path: "$article",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                slug: 1,
                article: 1,
              },
            },
          ],
          as: "topic",
        },
      },

      {
        $unwind: {
          path: "$topic",
          preserveNullAndEmptyArrays: true,
        },
      },

      /* ---------------- FINAL SHAPE ---------------- */
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          thumbnail: 1,
          created_at: 1,
          topic: 1,
        },
      },

      /* Optional: remove clusters without article */
      {
        $match: {
          "topic.article._id": { $exists: true },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      total: clusters.length,
      clusters,
    });
  } catch (error: any) {
    console.error(
      "Error fetching all clusters first topic & article:",
      error
    );
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch data",
    });
  }
};
