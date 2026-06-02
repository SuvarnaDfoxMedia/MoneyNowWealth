import type { Request, Response } from "express";
import * as clusterService from "../services/clusterService";
import Cluster from "../models/clusterModel";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { contentAccessService } from "@/services/contentAccessService";

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

  while (
    await clusterService
      .getClusters({ searchQuery: { slug } })
      .then(
        (r) =>
          r.total > 0 &&
          (!id || r.clusters.some((c: any) => c._id.toString() !== id)),
      )
  ) {
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
    const isPublicRequest = !req.params.role;

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
      status: isPublicRequest ? status || "published" : status,
      includeDeleted,
      sort: { [sortBy]: sortOrder },
      isPublicRequest,
    });

    return sendSuccess(res, "Clusters fetched successfully", response, 200, response);
  } catch (error: any) {
    console.error("Get clusters failed:", error);
    return sendError(res, error?.message || "Failed to fetch clusters", 500);
  }
};

export const getActiveClusters = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const search = String(req.query.search || "").trim();
    const status = req.query.status as string | undefined;
    const includeDeleted = req.query.includeDeleted === "true";

    const sortBy = String(req.query.sortBy || "created_at");
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const isPublicRequest = !req.params.role;

    /* ---------------- SEARCH ---------------- */
    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const response = await clusterService.getActiveClusters({
      page,
      limit,
      status: isPublicRequest ? status || "published" : status,
      searchQuery,
      sort: { [sortBy]: sortOrder },
      includeDeleted,
      isPublicRequest,
    });

    return sendSuccess(
      res,
      "Active clusters fetched successfully",
      response,
      200,
      response,
    );
  } catch (error: any) {
    console.error("Get active clusters failed:", error);
    return sendError(
      res,
      error?.message || "Failed to fetch active clusters",
      500,
    );
  }
};

export const getClusterBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params; // slug will come from the route, e.g., /clusters/:slug

    if (!slug) {
      return sendError(res, "Slug is required", 400);
    }

    const cluster = await clusterService.getClusterBySlug(slug);

    if (!cluster) {
      return sendError(res, "Cluster not found", 404);
    }

    return sendSuccess(res, "Cluster fetched successfully", cluster);
  } catch (error: any) {
    console.error("Get cluster by slug failed:", error);
    return sendError(res, error?.message || "Failed to fetch cluster", 500);
  }
};

/* ---------------------------------------------------
   Get single cluster by ID
--------------------------------------------------- */
export const getClusterById = async (req: Request, res: Response) => {
  try {
    const cluster = await clusterService.getClusterById(req.params.id);

    if (!cluster) {
      return sendError(res, "Cluster not found", 404);
    }

    const clusterObj = cluster.toObject ? cluster.toObject() : cluster;
    clusterObj.slug = clusterObj.slug || generateSlug(clusterObj.title || "");

    return sendSuccess(res, "Cluster fetched successfully", clusterObj, 200, {
      cluster: clusterObj,
    });
  } catch (error: any) {
    console.error("Get cluster by ID failed:", error);
    return sendError(res, error?.message || "Failed to fetch cluster", 500);
  }
};

/* ---------------------------------------------------
   Create new cluster
--------------------------------------------------- */
export const addCluster = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "Request body is missing", 400);
    }

    const thumbnail = req.file ? req.file.filename : "";

    // Generate unique slug
    const slug = await generateUniqueSlug(
      req.body.slug || req.body.title || "",
    );

    const cluster_code =
      req.body.cluster_code || `CL${Date.now().toString().slice(-6)}`;

    const clusterData = {
      ...req.body,
      title: req.body.title?.trim(),
      slug,
      cluster_code,
      thumbnail,
    };

    const cluster = await clusterService.createCluster(clusterData);

    return sendSuccess(
      res,
      "Cluster created successfully",
      cluster,
      201,
      { cluster },
    );
  } catch (error: any) {
    console.error("Add cluster failed:", error);
    return sendError(res, error?.message || "Failed to create cluster", 500);
  }
};

/* ---------------------------------------------------
   Update existing cluster
--------------------------------------------------- */

export const updateCluster = async (req: MulterRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Extract and exclude auto-managed fields that should NOT be updated
    // Use type-safe extraction
    const {
      created_at,
      updated_at,
      deleted_at,
      _id,
      __v,
      cluster_number,
      cluster_code,
      // Add other auto-managed fields
      is_deleted,
      is_active,
      // Extract the rest
      ...updateFields
    } = req.body;

    console.log("Received update data:", {
      id,
      bodyKeys: Object.keys(req.body),
      hasCreatedAt: "created_at" in req.body,
      createdAtValue: req.body.created_at,
      hasUpdatedAt: "updated_at" in req.body,
      updatedAtValue: req.body.updated_at,
    });

    const updatedData: any = {
      ...updateFields,
      title: req.body.title?.trim(),
    };

    // Generate unique slug if title changes or slug is provided
    if (req.body.title || req.body.slug) {
      updatedData.slug = await generateUniqueSlug(
        req.body.slug || req.body.title || "",
        id,
      );
    }

    if (req.file) {
      updatedData.thumbnail = req.file.filename;
    }

    const fieldsToRemove = [
      "created_at",
      "updated_at",
      "deleted_at",
      "_id",
      "__v",
      "cluster_number",
      "cluster_code",
      "is_deleted",
      "is_active",
    ];

    fieldsToRemove.forEach((field) => {
      delete updatedData[field];
    });

    const cluster = await clusterService.updateCluster(id, updatedData);

    if (!cluster) {
      return sendError(res, "Cluster not found", 404);
    }

    return sendSuccess(res, "Cluster updated successfully", cluster, 200, { cluster });
  } catch (error: any) {
    console.error("Update cluster failed:", error);
    return sendError(res, error?.message || "Failed to update cluster", 500);
  }
};

/* ---------------------------------------------------
   Toggle cluster active/inactive
--------------------------------------------------- */
export const toggleClusterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cluster = await clusterService.toggleClusterStatus(id);

    return sendSuccess(
      res,
      `Cluster is now ${cluster.is_active ? "active" : "inactive"}`,
      cluster,
      200,
      { cluster },
    );
  } catch (error: any) {
    console.error("Toggle cluster status failed:", error);
    return sendError(
      res,
      error?.message || "Failed to toggle cluster status",
      500,
    );
  }
};

/* ---------------------------------------------------
   Soft delete cluster
--------------------------------------------------- */
export const deleteCluster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cluster = await clusterService.deleteCluster(id);

    return sendSuccess(
      res,
      "Cluster deleted successfully (soft delete)",
      cluster,
      200,
      { cluster },
    );
  } catch (error: any) {
    console.error("Delete cluster failed:", error);
    return sendError(res, error?.message || "Failed to delete cluster", 500);
  }
};

export const getAllClustersFirstTopicWithArticle = async (
  req: Request,
  res: Response,
) => {
  try {
    const { status = "published" } = req.query;
    const now = new Date();
    const allowedAccessTypes = await contentAccessService.getAllowedTopicAccessTypes(
      req.user?.id,
    );

    const clusters = await Cluster.aggregate([
      /* ---------------- MATCH CLUSTERS ---------------- */
      {
        $match: {
          is_deleted: false,
          is_active: 1,
          status: status,
        },
      },

      /* ---------------- TOPIC WITH LATEST PUBLISHED ARTICLE ---------------- */
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

            /* ---------------- LATEST ARTICLE PER TOPIC ---------------- */
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
            { $sort: { "article.publish_date": -1, "article.created_at": -1 } },
            { $limit: 1 },
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

      /* ---------------- REMOVE CLUSTERS WITHOUT ARTICLE ---------------- */
      {
        $match: {
          "topic.article._id": { $exists: true },
        },
      },

      {
        $sort: {
          "topic.article.publish_date": -1,
          "topic.article.created_at": -1,
        },
      },

    ]);

    return sendSuccess(
      res,
      "Clusters with latest published article fetched successfully",
      clusters,
      200,
      { total: clusters.length, clusters },
    );
  } catch (error: any) {
    console.error("Error fetching all clusters first topic & article:", error);
    return sendError(res, error?.message || "Failed to fetch data", 500);
  }
};
