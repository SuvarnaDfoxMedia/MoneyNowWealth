import CmsPage, { type ICmsPage } from "../models/cmsPageModel";

// ===============================
// ===============================
export const getPages = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortField = "title",
    sortOrder = "asc",
    includeInactive = false,
  } = query;

  const pageNum = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 10, 1);
  const skip = (pageNum - 1) * perPage;

  const filter: Record<string, any> = { is_deleted: { $ne: true } };

  if (!includeInactive) {
    filter.is_active = 1;
  }

  if (search && search.trim() !== "") {
    filter.title = { $regex: search, $options: "i" };
  }

  const sortQuery: Record<string, any> = {};
  sortQuery[sortField] = sortOrder === "desc" ? -1 : 1;

  const [pages, total] = await Promise.all([
    CmsPage.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(perPage),
    CmsPage.countDocuments(filter),
  ]);

  return {
    pages,
    total,
    currentPage: pageNum,
    totalPages: Math.ceil(total / perPage),
  };
};

// ===============================
// 🔥 Get Page by ID
// ===============================
export const getPageById = async (id: string) => {
  const page = await CmsPage.findById(id);
  if (!page || page.is_active === 0) throw new Error("Page not found");
  return page;
};

// ===============================
// 🔥 Create Page
// ===============================
export const createPage = async (data: Partial<ICmsPage>) => {
  if (!data.title || !data.slug) throw new Error("title and slug are required");

  const slugExists = await CmsPage.findOne({ slug: data.slug, is_deleted: { $ne: true } });
  if (slugExists) throw new Error("Slug already exists");

  const page = new CmsPage({
    ...data,
    sections: data.sections || [],
    faqs: data.faqs || [],
    is_active: 1,
    is_deleted: false,
  });

  await page.save();
  return page;
};

// ===============================
// 🔥 Update Page
// ===============================
export const updatePage = async (id: string, data: Partial<ICmsPage>) => {
  const page = await CmsPage.findById(id);
  if (!page || page.is_active === 0) throw new Error("Page not found");

  Object.assign(page, data);
  await page.save();
  return page;
};

// ===============================
// 🔥 Toggle Active / Inactive
// ===============================
export const togglePageStatus = async (id: string) => {
  const page = await CmsPage.findById(id);
  if (!page) throw new Error("Page not found");

  page.is_active = page.is_active === 1 ? 0 : 1;
  await page.save();
  return page;
};

// ===============================
// 🔥 Soft Delete Page
// ===============================
export const deletePage = async (id: string) => {
  const page = await CmsPage.findById(id);
  if (!page) throw new Error("Page not found");

  page.is_deleted = true;
  page.is_active = 0;
  page.deleted_at = new Date();

  await page.save();
  return page;
};
