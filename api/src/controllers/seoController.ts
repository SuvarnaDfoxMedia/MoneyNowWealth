import type { Request, Response } from "express";
import Seo, { normalizePath } from "../models/seoModel";
import { sendError, sendSuccess } from "../utils/apiResponse";

const sanitizePayload = (body: Record<string, any>) => {
  const payload = { ...body };

  if (payload.route_path && !payload.page_url) {
    payload.page_url = payload.route_path;
  }
  if (payload.meta_keywords && !payload.keywords) {
    payload.keywords = payload.meta_keywords;
  }
  if (payload.schema_json && !payload.page_schema) {
    payload.page_schema = payload.schema_json;
  }
  if (payload.og_image && !payload.og_tag) {
    payload.og_tag = payload.og_image;
  }

  const trimFields = [
    "page_url",
    "seo_title",
    "meta_description",
    "keywords",
    "page_schema",
    "og_tag",
  ];

  trimFields.forEach((field) => {
    if (payload[field] != null) {
      payload[field] = String(payload[field]).trim();
    }
  });

  if (payload.page_url) {
    payload.page_url = normalizePath(payload.page_url);
  }

  if (payload.is_active != null) {
    payload.is_active = Number(payload.is_active) === 0 ? 0 : 1;
  }

  if (payload.status && !["draft", "published", "archived"].includes(payload.status)) {
    payload.status = "published";
  }

  return payload;
};

export const getSeoEntries = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const search = String(req.query.search || "").trim();
    const sortBy = String(req.query.sortBy || "created_at");
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const includeInactive = req.query.includeInactive === "true";

    const query: Record<string, any> = {};
    if (!includeInactive) {
      query.is_active = 1;
    }

    if (search) {
      query.$or = [
        { page_url: { $regex: search, $options: "i" } },
        { seo_title: { $regex: search, $options: "i" } },
      ];
    }

    const [entries, total] = await Promise.all([
      Seo.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Seo.countDocuments(query),
    ]);

    return sendSuccess(res, "SEO entries fetched successfully", entries, 200, {
      seo: entries,
      total,
      currentPage: page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      limit,
    });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch SEO entries", 500);
  }
};

export const getSeoEntryById = async (req: Request, res: Response) => {
  try {
    const seo = await Seo.findById(req.params.id);
    if (!seo) {
      return sendError(res, "SEO entry not found", 404);
    }
    return sendSuccess(res, "SEO entry fetched successfully", seo, 200, { seo });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch SEO entry", 500);
  }
};

export const createSeoEntry = async (req: Request, res: Response) => {
  try {
    const payload = sanitizePayload(req.body || {});
    if (!payload.page_url) {
      return sendError(res, "Page URL is required", 400);
    }

    const existing = await Seo.findOne({ page_url: payload.page_url });
    if (existing) {
      return sendError(res, "SEO entry already exists for this page URL", 409);
    }

    const seo = await Seo.create(payload);
    return sendSuccess(res, "SEO entry created successfully", seo, 201, { seo });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create SEO entry", 500);
  }
};

export const updateSeoEntry = async (req: Request, res: Response) => {
  try {
    const payload = sanitizePayload(req.body || {});
    const seo = await Seo.findById(req.params.id);

    if (!seo) {
      return sendError(res, "SEO entry not found", 404);
    }

    if (payload.page_url && payload.page_url !== seo.page_url) {
      const existing = await Seo.findOne({ page_url: payload.page_url });
      if (existing && String(existing._id) !== String(seo._id)) {
        return sendError(res, "SEO entry already exists for this page URL", 409);
      }
    }

    Object.assign(seo, payload);
    await seo.save();

    return sendSuccess(res, "SEO entry updated successfully", seo, 200, { seo });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to update SEO entry", 500);
  }
};

export const toggleSeoStatus = async (req: Request, res: Response) => {
  try {
    const seo = await Seo.findById(req.params.id);
    if (!seo) {
      return sendError(res, "SEO entry not found", 404);
    }

    seo.is_active = seo.is_active === 1 ? 0 : 1;
    await seo.save();

    return sendSuccess(
      res,
      `SEO entry is now ${seo.is_active ? "active" : "inactive"}`,
      seo,
      200,
      { seo },
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to update SEO status", 500);
  }
};

export const deleteSeoEntry = async (req: Request, res: Response) => {
  try {
    const seo = await Seo.findById(req.params.id);
    if (!seo) {
      return sendError(res, "SEO entry not found", 404);
    }

    seo.is_deleted = true;
    seo.is_active = 0;
    seo.deleted_at = new Date();
    await seo.save();

    return sendSuccess(res, "SEO entry deleted successfully", seo, 200, { seo });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to delete SEO entry", 500);
  }
};

export const resolveSeoByPath = async (req: Request, res: Response) => {
  try {
    const routePath = normalizePath(String(req.query.path || ""));
    if (!routePath) {
      return sendError(res, "Path is required", 400);
    }

    const seo = await Seo.findOne({
      page_url: routePath,
      is_active: 1,
      status: "published",
    });

    if (!seo) {
      return sendError(res, "SEO entry not found", 404);
    }

    return sendSuccess(res, "SEO entry resolved successfully", seo, 200, { seo });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to resolve SEO entry", 500);
  }
};
