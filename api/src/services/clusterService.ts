import Cluster, { type ICluster } from "../models/clusterModel";

/* -------------------------------
   Helper: generate slug from text
------------------------------- */
const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-alphanumeric chars
    .replace(/\s+/g, "-"); // replace spaces with dash

/* -------------------------------
   Helper: ensure unique slug
------------------------------- */
const generateUniqueSlug = async (baseSlug: string, id?: string) => {
  let slug = baseSlug;
  let counter = 1;

  const slugExists = async (s: string) => {
    const query: any = { slug: s };
    if (id) query._id = { $ne: id }; // exclude current document on update
    return await Cluster.exists(query);
  };

  while (await slugExists(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

/* ---------------------------------------------------
   Get paginated clusters with optional filters
--------------------------------------------------- */
export const getClusters = async (query: any) => {
  const {
    search,
    status,
    includeDeleted,
    page,
    limit,
    sort,
    searchQuery,
    isPublicRequest,
  } =
    query;

  const filter: any = {};

  if (status) filter.status = status;
  if (isPublicRequest) filter.is_active = 1;
  if (!includeDeleted || includeDeleted === "false") filter.is_deleted = false;

  if (searchQuery && Object.keys(searchQuery).length > 0) {
    Object.assign(filter, searchQuery);
  } else if (search) {
    const s = String(search).trim();
    filter.$or = [
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { cluster_code: { $regex: s, $options: "i" } },
      { slug: { $regex: s, $options: "i" } },
    ];
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || 10, 1), 200);
  const skip = (pageNum - 1) * perPage;

  const finalSort = sort || { created_at: -1 };

  const [clusters, total] = await Promise.all([
    Cluster.find(filter).sort(finalSort).skip(skip).limit(perPage),
    Cluster.countDocuments(filter),
  ]);

  return {
    success: true,
    clusters,
    total,
    currentPage: pageNum,
    limit: perPage,
    totalPages: Math.ceil(total / perPage),
  };
};

export const getActiveClusters = async (query: any) => {
  const { page = 1, limit = 10, sort, status } = query;

  /* ------------------ STRICT FILTER ------------------ */
  const filter = {
    is_active: 1,
    is_deleted: false,
    ...(status ? { status } : {}),
  };

  /* ------------------ PAGINATION ------------------ */
  const pageNum = Math.max(Number(page), 1);
  const perPage = Math.min(Math.max(Number(limit) || 10, 1), 200);
  const skip = (pageNum - 1) * perPage;

  /* ------------------ SORT ------------------ */
  const finalSort = sort ?? { created_at: -1 };

  /* ------------------ QUERY ------------------ */
  const [clusters, total] = await Promise.all([
    Cluster.find(filter).sort(finalSort).skip(skip).limit(perPage).lean(),
    Cluster.countDocuments(filter),
  ]);

  /* ------------------ RESPONSE ------------------ */
  return {
    success: true,
    clusters,
    total,
    currentPage: pageNum,
    limit: perPage,
    totalPages: Math.ceil(total / perPage),
  };
};

/* ---------------------------------------------------
   Get single cluster by ID
--------------------------------------------------- */
export const getClusterById = async (id: string) => {
  const cluster = await Cluster.findOne({ _id: id, is_deleted: false });
  if (!cluster) throw new Error("Cluster not found");
  return cluster;
};

/* ---------------------------------------------------
   Get single cluster by Slug
--------------------------------------------------- */
export const getClusterBySlug = async (slug: string) => {
  const cluster = await Cluster.findOne({ slug, is_deleted: false });
  if (!cluster) throw new Error("Cluster not found");
  return cluster;
};

/* ---------------------------------------------------
   Create new cluster
--------------------------------------------------- */
export const createCluster = async (data: Partial<ICluster>) => {
  let cluster_code = data.cluster_code;
  if (!cluster_code) {
    const lastCluster = await Cluster.findOne()
      .sort({ created_at: -1 })
      .select("cluster_code");
    const lastCodeNum = lastCluster
      ? parseInt(lastCluster.cluster_code?.replace("CL", "") || "0", 10)
      : 0;
    cluster_code = `CL${String(lastCodeNum + 1).padStart(4, "0")}`;
  }

  // Generate slug and ensure uniqueness
  const baseSlug =
    data.slug?.trim() || (data.title ? generateSlug(data.title) : "");
  const slug = await generateUniqueSlug(baseSlug);

  const thumbnailName =
    typeof data.thumbnail === "string"
      ? data.thumbnail
      : (data as any)?.file?.filename || "";

  const cluster = new Cluster({
    ...data,
    cluster_code,
    slug,
    is_active: 1,
    is_deleted: false,
    thumbnail: thumbnailName,
  });

  await cluster.save();
  return cluster;
};

/* ---------------------------------------------------
   Update existing cluster
--------------------------------------------------- */

export const updateCluster = async (id: string, data: Partial<ICluster>) => {
  const updateData: any = { ...data };

  const disallowedFields = [
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

  disallowedFields.forEach((field) => {
    delete updateData[field];
  });

  // Clean up any empty objects that might cause issues
  Object.keys(updateData).forEach((key) => {
    if (
      updateData[key] &&
      typeof updateData[key] === "object" &&
      Object.keys(updateData[key]).length === 0
    ) {
      delete updateData[key];
    }
  });

  if ((data as any)?.file) {
    updateData.thumbnail = (data as any).file.filename;
  }

  // Update slug if title changes or slug is provided
  if (data.title && !data.slug) {
    const baseSlug = generateSlug(data.title);
    updateData.slug = await generateUniqueSlug(baseSlug, id);
  } else if (data.slug) {
    const baseSlug = generateSlug(data.slug);
    updateData.slug = await generateUniqueSlug(baseSlug, id);
  }

  const cluster = await Cluster.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!cluster) throw new Error("Cluster not found");
  return cluster;
};

/* ---------------------------------------------------
   Toggle cluster active/inactive
--------------------------------------------------- */
export const toggleClusterStatus = async (id: string) => {
  const cluster = await Cluster.findById(id);
  if (!cluster) throw new Error("Cluster not found");

  cluster.is_active = cluster.is_active === 1 ? 0 : 1;
  await cluster.save();
  return cluster;
};

/* ---------------------------------------------------
   Soft delete cluster
--------------------------------------------------- */
export const deleteCluster = async (id: string) => {
  const cluster = await Cluster.findById(id);
  if (!cluster) throw new Error("Cluster not found");

  cluster.is_deleted = true;
  cluster.is_active = 0;
  (cluster as any).deleted_at = new Date();

  await cluster.save();
  return cluster;
};
