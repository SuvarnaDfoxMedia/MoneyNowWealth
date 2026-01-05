
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
  } else {
    sortConfig.created_at = -1;
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .populate("topic_id", "topic_code title")
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
  if (data.slug) {
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
    { new: true }
  ).exec();
};

// NEW: Get cluster hierarchy (cluster -> topics -> articles)
export const getClusterHierarchy = async (clusterId: string, options: any = {}) => {
  const {
    status = "published",
    sortField = "created_at",
    sortOrder = "desc"
  } = options;

  try {
    // First, find all topics in this cluster
    const topics = await Topic.find({
      cluster_id: clusterId,
      is_active: 1,
      is_deleted: false
    }).select('_id topic_code title slug').lean();

    if (!topics || topics.length === 0) {
      return {
        success: true,
        cluster: {
          _id: clusterId
        },
        topics: [],
        totalArticles: 0,
        totalTopics: 0
      };
    }

    const topicIds = topics.map(topic => topic._id);

    // Find all articles in these topics
    const articleFilter: Record<string, any> = {
      topic_id: { $in: topicIds },
      is_deleted: false,
      is_active: 1
    };

    if (status) {
      articleFilter.status = status;
    }

    // Sorting
    const sortConfig: Record<string, 1 | -1> = {};
    sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;

    const articles = await Article.find(articleFilter)
      .populate("topic_id", "topic_code title")
      .sort(sortConfig)
      .lean();

    // Group articles by topic
    const topicsWithArticles = topics.map(topic => {
      const topicArticles = articles.filter(article => 
        article.topic_id._id.toString() === topic._id.toString()
      );

      return {
        ...topic,
        articles: topicArticles.map(article => ({
          _id: article._id,
          title: article.title,
          slug: article.slug,
          hero_image: article.hero_image,
          introduction: article.introduction,
          status: article.status,
          read_time: article.read_time,
          author: article.author,
          created_at: article.created_at,
          updated_at: article.updated_at,
          article_code: article.article_code
        })),
        articleCount: topicArticles.length
      };
    });

    // Calculate totals
    const totalArticles = topicsWithArticles.reduce((sum, topic) => sum + topic.articleCount, 0);

    return {
      success: true,
      cluster: {
        _id: clusterId
      },
      topics: topicsWithArticles,
      totalArticles,
      totalTopics: topicsWithArticles.length
    };
  } catch (error) {
    throw new Error(`Failed to fetch cluster hierarchy: ${error.message}`);
  }
};