import { cache } from "react";
import type { Metadata } from "next";

export interface SeoEntry {
  _id?: string;
  name?: string;
  page_url?: string;
  seo_title?: string;
  meta_description?: string;
  keywords?: string;
  page_schema?: string;
  og_tag?: string;
  status?: string;
  is_active?: number;
}

export interface MetadataFallback {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  keywords?: string[];
  type?: "website" | "article";
  robots?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const DEFAULT_TITLE = "MoneyNow Wealth";
const DEFAULT_DESCRIPTION =
  "MoneyNow Wealth helps you make better financial decisions with actionable insights, calculators, and curated research.";

export const normalizeSeoPath = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "/";

  const withoutDomain = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  const withSlash = withoutDomain.startsWith("/") ? withoutDomain : `/${withoutDomain}`;
  const normalized = withSlash.replace(/\/+$/, "");
  return normalized || "/";
};

export const stripHtml = (html?: string) =>
  (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (!SITE_URL) return undefined;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const splitKeywords = (value?: string, fallback?: string[]) => {
  if (!value?.trim()) return fallback;
  const list = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? list : fallback;
};

const fetchSeoEntryCached = cache(async (routePath: string): Promise<SeoEntry | null> => {
  if (!API_BASE) return null;

  try {
    const response = await fetch(
      `${API_BASE}/api/seo/resolve?path=${encodeURIComponent(normalizeSeoPath(routePath))}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json().catch(() => null)) as
      | { seo?: SeoEntry; data?: SeoEntry }
      | null;

    return json?.seo || json?.data || null;
  } catch {
    return null;
  }
});

export const resolveSeoEntry = async (routePath: string) =>
  fetchSeoEntryCached(normalizeSeoPath(routePath));

export async function buildPageMetadata(
  routePath: string,
  fallback: MetadataFallback = {},
): Promise<Metadata> {
  const seo = await resolveSeoEntry(routePath);
  const normalizedPath = normalizeSeoPath(routePath);

  const title = seo?.seo_title?.trim() || fallback.title || DEFAULT_TITLE;
  const description =
    seo?.meta_description?.trim() || fallback.description || DEFAULT_DESCRIPTION;
  const canonical =
    fallback.canonicalUrl ||
    (SITE_URL ? `${SITE_URL}${normalizedPath}` : normalizedPath);
  const image = toAbsoluteUrl(seo?.og_tag?.trim() || fallback.image);
  const keywords = splitKeywords(seo?.keywords, fallback.keywords);
  const metadataType = fallback.type || "website";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: metadataType,
      url: canonical,
      title,
      description,
      siteName: "MoneyNow Wealth",
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
