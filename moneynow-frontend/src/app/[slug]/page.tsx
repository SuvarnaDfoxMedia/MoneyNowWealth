import type { Metadata } from "next";
import FAQPage from "@/components/cms/FAQPage";
import PrivacyPolicyPage from "@/components/cms/PrivacyPolicyPage";
import TermsPage from "@/components/cms/TermsPage";
import DefaultPage from "@/components/cms/DefaultPage";
import GeneralDisclaimerPage from "@/components/cms/GeneralDisclaimerPage";
import AboutUsPage from "@/components/cms/AboutUsPage";
import PartnerWithUs from "@/components/cms/PartnerWithUs";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry, stripHtml } from "@/lib/seo";

type CmsPageData = {
  title?: string;
  slug?: string;
  sections?: { title?: string; content?: string }[];
};

type CmsApiResponse = {
  success?: boolean;
  data?: CmsPageData;
  page?: CmsPageData;
  message?: string;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

const STATIC_FALLBACKS: Record<string, { title: string; description: string }> = {
  "about-us": {
    title: "About Us | MoneyNow Wealth",
    description:
      "Learn more about MoneyNow Wealth, our approach, and the team behind the platform.",
  },
  "partner-with-us": {
    title: "Partner With Us | MoneyNow Wealth",
    description:
      "Explore partnership opportunities with MoneyNow Wealth and discover how we can work together.",
  },
};

async function fetchCmsPageBySlug(slug: string): Promise<CmsPageData | null> {
  if (!API_BASE) return null;

  try {
    const response = await fetch(`${API_BASE}/api/cmspages/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const json = (await response.json().catch(() => null)) as CmsApiResponse | null;
    return json?.page || json?.data || null;
  } catch {
    return null;
  }
}

function getCmsDescription(page?: CmsPageData | null) {
  const firstSection = page?.sections?.find((section) => stripHtml(section?.content));
  return stripHtml(firstSection?.content) || `Read more about ${page?.title || "MoneyNow Wealth"}.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const staticFallback = STATIC_FALLBACKS[slug];

  if (staticFallback) {
    return buildPageMetadata(`/${slug}`, staticFallback);
  }

  const page = await fetchCmsPageBySlug(slug);

  return buildPageMetadata(`/${slug}`, {
    title: page?.title ? `${page.title} | MoneyNow Wealth` : "MoneyNow Wealth",
    description: getCmsDescription(page),
  });
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params;
  const seo = await resolveSeoEntry(`/${slug}`);

  if (slug === "about-us") {
    return (
      <>
        <SeoJsonLd schema={seo?.page_schema} />
        <AboutUsPage />
      </>
    );
  }

  if (slug === "partner-with-us") {
    return (
      <>
        <SeoJsonLd schema={seo?.page_schema} />
        <PartnerWithUs />
      </>
    );
  }

  const page = await fetchCmsPageBySlug(slug);

  if (!page) {
    return <DefaultPage />;
  }

  switch (slug) {
    case "faq":
      return (
        <>
          <SeoJsonLd schema={seo?.page_schema} />
          <FAQPage data={page} />
        </>
      );
    case "privacy-policy":
      return (
        <>
          <SeoJsonLd schema={seo?.page_schema} />
          <PrivacyPolicyPage data={page} />
        </>
      );
    case "terms":
    case "terms-of-use":
      return (
        <>
          <SeoJsonLd schema={seo?.page_schema} />
          <TermsPage data={page} />
        </>
      );
    case "general-disclaimer":
    case "disclaimer":
      return (
        <>
          <SeoJsonLd schema={seo?.page_schema} />
          <GeneralDisclaimerPage data={page} />
        </>
      );
    default:
      return <DefaultPage />;
  }
}
