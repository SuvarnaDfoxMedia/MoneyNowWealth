import Article, { type IArticle } from "../models/articleModel";
import Topic from "../models/topicModel";

// Get all articles with pagination, filtering, and sorting
export const getArticles = async (query: any) => {
  const {
    status,
    topic_id,
    includeInactive,
    search,
    page,
    limit,
    sortField,
    sortOrder,
    publishedOnly,
    allowedAccessTypes,
    cluster_id,
  } = query || {};

  // Pagination
  const pageNum = Math.max(parseInt(page as string) || 1, 1);
  const perPage = Math.max(parseInt(limit as string) || 10, 1);
  const skip = (pageNum - 1) * perPage;

  const filter: Record<string, any> = { is_deleted: false };

  // Default status filter
  filter.status = { $ne: "archived" };
  if (status) filter.status = status;
  if (topic_id) filter.topic_id = topic_id;

  // Search
  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { title: { $regex: s, $options: "i" } },
      { focus_keyword: { $regex: s, $options: "i" } },
      { article_code: { $regex: s, $options: "i" } },
    ];
  }

  // Sorting
  const sortConfig: Record<string, 1 | -1> = {};
  if (sortField) {
    sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;
    if (sortField !== "created_at") {
      sortConfig.created_at = -1;
    }
  } else {
    sortConfig.publish_date = -1;
    sortConfig.created_at = -1;
  }

  if (publishedOnly) {
    const now = new Date();
    const topicFilter: Record<string, any> = {
      is_deleted: false,
      is_active: 1,
      status: "published",
      publish_date: { $lte: now },
    };

    if (Array.isArray(allowedAccessTypes) && allowedAccessTypes.length > 0) {
      topicFilter.access_type = { $in: allowedAccessTypes };
    }

    if (cluster_id) {
      topicFilter.cluster_id = cluster_id;
    }

    const matchedTopics = await Topic.find(topicFilter).select("_id").lean();
    const topicIds = matchedTopics.map((topic) => topic._id);

    if (!topicIds.length) {
      return {
        success: true,
        articles: [],
        total: 0,
        currentPage: pageNum,
        totalPages: 0,
        limit: perPage,
      };
    }

    filter.status = "published";
    filter.is_active = 1;
    filter.publish_date = { $lte: now };
    filter.topic_id = topic_id || { $in: topicIds };
  } else {
    if (cluster_id && !topic_id) {
      const matchedTopics = await Topic.find({ cluster_id }).select("_id").lean();
      const topicIds = matchedTopics.map((topic) => topic._id);
      
      if (!topicIds.length) {
        return {
          success: true,
          articles: [],
          total: 0,
          currentPage: pageNum,
          totalPages: 0,
          limit: perPage,
        };
      }
      filter.topic_id = { $in: topicIds };
    }
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("topic_id", "topic_code title access_type")
      .sort(sortConfig)
      .skip(skip)
      .limit(perPage)
      .lean(),
    Article.countDocuments(filter),
  ]);

  return {
    success: true,
    articles,
    total,
    currentPage: pageNum,
    totalPages: Math.ceil(total / perPage),
    limit: perPage,
  };
};

// Get single article by ID
export const getArticleById = async (id: string) => {
  return await Article.findById(id)
    .populate("topic_id", "topic_code title")
    .exec();
};

// Create a new article
export const createArticle = async (data: Partial<IArticle>) => {
  if (data.slug) {
    const existingSlug = await Article.findOne({ slug: data.slug });
    if (existingSlug) throw new Error("Slug already exists");
  }

  if (typeof data.hero_image !== "string") {
    data.hero_image = "";
  }

  // Validate and default status
  if (!["draft", "published", "archived"].includes(data.status || "")) {
    data.status = "draft";
  }

  // Handle publish date
  if (data.status === "published" && !data.publish_date) {
    data.publish_date = new Date();
  }

  // Generate next article code
  const lastArticle = await Article.findOne({}, { article_code: 1 })
    .sort({ created_at: -1 })
    .lean();

  let nextCode = "ART0001";
  if (lastArticle?.article_code) {
    const lastNum = parseInt(lastArticle.article_code.replace("ART", ""), 10);
    nextCode = "ART" + String(lastNum + 1).padStart(4, "0");
  }

  const preparedData: Partial<IArticle> = {
    ...data,
    article_code: nextCode,
    sections: data.sections || [],
    faqs: data.faqs || [],
    tools: data.tools || [],
    related_reads: data.related_reads || [],
    is_active: 1,
    is_deleted: false,
  };

  const article = new Article(preparedData);
  await article.save();
  return article;
};

// Update an existing article
export const updateArticle = async (id: string, data: Partial<IArticle>) => {
  // 1. First get the current article to check status
  const existingArticle = await Article.findById(id);
  if (!existingArticle) {
    throw new Error("Article not found");
  }

  if (data.slug && data.slug !== existingArticle.slug) {
    const existingSlug = await Article.findOne({
      slug: data.slug,
      _id: { $ne: id },
    });
    if (existingSlug) throw new Error("Slug already exists");
  }

  if (typeof data.hero_image !== "string") {
    delete data.hero_image;
  }

  if (!["draft", "published", "archived"].includes(data.status || "")) {
    data.status = "draft";
  }

  // Handle publish date
  if (data.status === "published") {
    if (!data.publish_date) {
      data.publish_date = new Date();
    }
  }

  return await Article.findByIdAndUpdate(id, data, { new: true }).exec();
};

// Toggle article status
export const toggleArticleStatus = async (id: string) => {
  if (!id || id === "undefined") throw new Error("Invalid article ID");

  const article = await Article.findById(id);
  if (!article) throw new Error("Article not found");

  article.is_active = article.is_active === 1 ? 0 : 1;
  await article.save();
  return article;
};

// Soft delete an article
export const deleteArticle = async (id: string) => {
  return await Article.findByIdAndUpdate(
    id,
    { is_deleted: true, is_active: 0, status: "archived" },
    { new: true },
  ).exec();
};

