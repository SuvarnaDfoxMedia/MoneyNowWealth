import type { Request, Response } from "express";
import * as cmsPageService from "../services/cmsPageService";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/* ---------------------------------------------------
   Get Paginated CMS Pages
--------------------------------------------------- */
export const getPages = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      search,
      sortField,
      sortOrder,
      includeInactive
    } = req.query;

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

    return res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error("Error in getPages:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch CMS pages",
    });
  }
};

/* ---------------------------------------------------
   Get CMS Page By ID
--------------------------------------------------- */
export const getPageById = async (req: Request, res: Response) => {
  try {
    const page = await cmsPageService.getPageById(req.params.id);
    return res.status(200).json({ success: true, page });
  } catch (error: any) {
    console.error("Error in getPageById:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "CMS page not found",
    });
  }
};


interface MulterRequest extends Request {
  body: any;
  files?: any;
}

export const addPage = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    // Parse JSON fields safely
    let sections = [];
    let faqs = [];

    try {
      sections = req.body.sections ? JSON.parse(req.body.sections) : [];
      faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in sections or faqs",
      });
    }

    // Prepare page data
    const pageData = {
      ...req.body,
      title: req.body.title?.trim(),
      slug: req.body.slug?.trim().toLowerCase(),
      status: req.body.status || "draft",
      is_active: req.body.is_active ?? 1,
      page_code: req.body.page_code || undefined,
      sections,
      faqs,
    };

    const page = await cmsPageService.createPage(pageData);

    return res.status(201).json({
      success: true,
      message: "CMS page created successfully",
      page,
    });
  } catch (error: any) {
    console.error("Error in addPage:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create CMS page",
    });
  }
};



export const updatePage = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const updatedData: any = { ...req.body };

    // Trim title & slug
    if (updatedData.title) updatedData.title = updatedData.title.trim();
    if (updatedData.slug) updatedData.slug = updatedData.slug.trim().toLowerCase();

    // Parse JSON fields safely
    try {
      updatedData.sections = updatedData.sections
        ? JSON.parse(updatedData.sections)
        : [];
      updatedData.faqs = updatedData.faqs ? JSON.parse(updatedData.faqs) : [];
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in sections or faqs",
      });
    }

    const page = await cmsPageService.updatePage(req.params.id, updatedData);

    return res.status(200).json({
      success: true,
      message: "CMS page updated successfully",
      page,
    });
  } catch (error: any) {
    console.error("Error in updatePage:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update CMS page",
    });
  }
};


/* ---------------------------------------------------
   Toggle CMS Page Status
--------------------------------------------------- */
export const togglePageStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await cmsPageService.togglePageStatus(id);

    return res.status(200).json({
      success: true,
      message: `CMS page is now ${page.is_active ? "active" : "inactive"}`,
      page,
    });
  } catch (error: any) {
    console.error("Error in togglePageStatus:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle CMS page status",
    });
  }
};

/* ---------------------------------------------------
   Soft Delete CMS Page
--------------------------------------------------- */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await cmsPageService.deletePage(id);

    return res.status(200).json({
      success: true,
      message: "CMS page deleted successfully (soft delete)",
      page,
    });
  } catch (error: any) {
    console.error("Error in deletePage:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete CMS page",
    });
  }
};
