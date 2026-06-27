import type { Metadata } from "next";
import { cookies } from "next/headers";
import BlogDetailsClient, { type Article } from "./BlogDetailsClient";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry, stripHtml } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ArticleApiResponse = {
  article?: Article;
  data?: Article;
  message?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL || `${API_BASE}/uploads`;
const FALLBACK_TITLE = "MoneyNow Wealth Blog";
const FALLBACK_DESCRIPTION =
  "Insights, guides, and practical financial knowledge from MoneyNow Wealth.";

function buildDescription(article?: Article | null) {
  const description = article?.seo_description?.trim() || stripHtml(article?.introduction);
  return description || FALLBACK_DESCRIPTION;
}

function buildTitle(article?: Article | null) {
  return article?.seo_title?.trim() || article?.title?.trim() || FALLBACK_TITLE;
}

function buildHeroImageUrl(article?: Article | null) {
  if (!article?.hero_image) return undefined;
  return `${IMAGE_BASE}/hero/${article.hero_image.replace(/^\/+/, "")}`;
}

async function fetchArticleBySlug(slug: string) {
  if (!API_BASE) {
    return {
      article: null as Article | null,
      error: "API base URL is not configured",
      status: 500,
    };
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(
      `${API_BASE}/api/article/published/slug/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        next: { revalidate: 120 },
      },
    );

    const json = (await response.json().catch(() => ({}))) as ArticleApiResponse;

    if (!response.ok) {
      return {
        article: null as Article | null,
        error:
          json.message ||
          (response.status === 404
            ? "Blog not found"
            : response.status === 403
              ? "This article is available for premium members only."
              : "Something went wrong"),
        status: response.status,
      };
    }

    return {
      article: json.article || json.data || null,
      error: null,
      status: response.status,
    };
  } catch {
    return {
      article: null as Article | null,
      error: "Something went wrong",
      status: 500,
    };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `${SITE_URL}/blog/${slug}`;
  const { article, error } = await fetchArticleBySlug(slug);

  if (!article) {
    return buildPageMetadata(`/blog/${slug}`, {
      title: "Blog Not Found | MoneyNow Wealth",
      description: error || FALLBACK_DESCRIPTION,
      canonicalUrl: canonical,
      robots: "noindex,nofollow",
      type: "article",
    });
  }

  return buildPageMetadata(`/blog/${slug}`, {
    title: buildTitle(article),
    description: buildDescription(article),
    image: buildHeroImageUrl(article),
    canonicalUrl: canonical,
    type: "article",
  });
}

export default async function BlogPage({ params }: PageProps) {
  const { slug } = await params;
  const { article, error } = await fetchArticleBySlug(slug);
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const seo = await resolveSeoEntry(`/blog/${slug}`);

  return (
    <>
      <SeoJsonLd schema={seo?.page_schema} />
      <BlogDetailsClient
        article={article}
        error={error}
        topicTitle={article?.topic?.title || ""}
        canonicalUrl={canonicalUrl}
      />
    </>
  );
}
