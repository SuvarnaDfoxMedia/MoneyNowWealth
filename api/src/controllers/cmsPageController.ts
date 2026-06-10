import type { Request, Response } from "express";
import * as cmsPageService from "../services/cmsPageService";
import { sendError, sendSuccess } from "../utils/apiResponse";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  body: Record<string, any>;
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

/* ---------------------------------------------------
   Get Paginated CMS Pages
--------------------------------------------------- */
export const getPages = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, sortField, sortOrder, includeInactive } =
      req.query;

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const perPage = Math.max(parseInt(limit as string) || 10, 1);

    const result = await cmsPageService.getPages({
      page: pageNum,
      limit: perPage,
      search: search ? String(search) : "",
      sortField: sortField ? String(sortField) : "title",
      sortOrder: sortOrder ? String(sortOrder) : "asc",
      includeInactive: includeInactive === "true",
    });

    const data = (result as { pages?: unknown })?.pages ?? result;
    const extra =
      result && typeof result === "object"
        ? Object.fromEntries(
            Object.entries(result).filter(([key]) => key !== "pages"),
          )
        : {};

    return sendSuccess(res, "CMS pages fetched successfully", data, 200, extra);
  } catch (error: any) {
    console.error("Error in getPages:", error);
    return sendError(res, error.message || "Failed to fetch CMS pages", 500);
  }
};

/* ---------------------------------------------------
   Get CMS Page By ID
--------------------------------------------------- */
export const getPageById = async (req: Request, res: Response) => {
  try {
    const page = await cmsPageService.getPageById(req.params.id);
    return sendSuccess(res, "CMS page fetched successfully", page, 200, { page });
  } catch (error: any) {
    console.error("Error in getPageById:", error);
    return sendError(res, error.message || "CMS page not found", 404);
  }
};

export const addPage = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "Request body is missing", 400);
    }

    // Parse JSON fields safely
    let sections: unknown[] = [];
    let faqs: unknown[] = [];

    try {
      const rawSections = req.body.sections;
      const rawFaqs = req.body.faqs;
      sections =
        typeof rawSections === "string"
          ? JSON.parse(rawSections)
          : Array.isArray(rawSections)
            ? rawSections
            : [];
      faqs =
        typeof rawFaqs === "string"
          ? JSON.parse(rawFaqs)
          : Array.isArray(rawFaqs)
            ? rawFaqs
            : [];
    } catch {
      return sendError(res, "Invalid JSON format in sections or faqs", 400);
    }

    // Prepare page data
    const pageData: Record<string, unknown> = {
      ...req.body,
      title: String(req.body.title || "").trim(),
      slug: String(req.body.slug || "")
        .trim()
        .toLowerCase(),
      status: req.body.status || "draft",
      is_active: req.body.is_active ?? 1,
      page_code: req.body.page_code || undefined,
      sections,
      faqs,
    };

    const page = await cmsPageService.createPage(pageData);

    return sendSuccess(res, "CMS page created successfully", page, 201, { page });
  } catch (error: any) {
    console.error("Error in addPage:", error);
    return sendError(res, error.message || "Failed to create CMS page", 500);
  }
};

export const updatePage = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "Request body is missing", 400);
    }

    const updatedData: Record<string, any> = { ...req.body };

    // Trim title & slug
    if (updatedData.title) updatedData.title = String(updatedData.title).trim();
    if (updatedData.slug)
      updatedData.slug = String(updatedData.slug).trim().toLowerCase();

    // Parse JSON fields safely
    try {
      const rawSections = updatedData.sections;
      const rawFaqs = updatedData.faqs;
      updatedData.sections = updatedData.sections
        ? typeof rawSections === "string"
          ? JSON.parse(rawSections)
          : Array.isArray(rawSections)
            ? rawSections
            : []
        : [];
      updatedData.faqs = updatedData.faqs
        ? typeof rawFaqs === "string"
          ? JSON.parse(rawFaqs)
          : Array.isArray(rawFaqs)
            ? rawFaqs
            : []
        : [];
    } catch {
      return sendError(res, "Invalid JSON format in sections or faqs", 400);
    }

    const page = await cmsPageService.updatePage(req.params.id, updatedData);

    return sendSuccess(res, "CMS page updated successfully", page, 200, { page });
  } catch (error: any) {
    console.error("Error in updatePage:", error);
    return sendError(res, error.message || "Failed to update CMS page", 500);
  }
};

/* ---------------------------------------------------
   Toggle CMS Page Status
--------------------------------------------------- */
export const togglePageStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await cmsPageService.togglePageStatus(id);

    return sendSuccess(
      res,
      `CMS page is now ${page.is_active ? "active" : "inactive"}`,
      page,
      200,
      { page },
    );
  } catch (error: any) {
    console.error("Error in togglePageStatus:", error);
    return sendError(res, error.message || "Failed to toggle CMS page status", 500);
  }
};

/* ---------------------------------------------------
   Soft Delete CMS Page
--------------------------------------------------- */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await cmsPageService.deletePage(id);

    return sendSuccess(
      res,
      "CMS page deleted successfully (soft delete)",
      page,
      200,
      { page },
    );
  } catch (error: any) {
    console.error("Error in deletePage:", error);
    return sendError(res, error.message || "Failed to delete CMS page", 500);
  }
};

export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = await cmsPageService.findPageBySlug(slug);

    if (!page) {
      return sendError(res, "CMS page not found", 404);
    }

    return sendSuccess(res, "CMS page fetched successfully", page, 200, { page });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch CMS page", 500);
  }
};
