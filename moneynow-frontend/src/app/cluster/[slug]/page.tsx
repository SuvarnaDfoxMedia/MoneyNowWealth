import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import ClusterArticleSlider from "@/components/Blog-listing-Components/ClusterArticlePagination";
import SeniorCitizen from "@/components/blog-details-Page/SeniorCitizen";
import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import HomeInvestTrack from "@/components/home/invest-with-confidence";
import StayConnected from "@/components/home/home-newsletters";
import { homeInvestTrackData } from "@/data/homePageData";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry, stripHtml } from "@/lib/seo";

interface Article {
  _id: string;
  title: string;
  slug: string;
  hero_image?: string;
  introduction?: string;
  category?: string;
}

interface Topic {
  _id: string;
  title: string;
  articles?: Article[];
}

interface Cluster {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  created_at?: string;
}

interface ClusterHierarchyResponse {
  success?: boolean;
  data?: {
    clusters: Cluster[];
    topics: Topic[];
  };
  message?: string;
}

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";

async function fetchClusterBySlug(slug: string) {
  if (!API_BASE) {
    return { cluster: null as Cluster | null, topics: [] as Topic[] };
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(`${API_BASE}/api/cluster/slug/${encodeURIComponent(slug)}/`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return { cluster: null as Cluster | null, topics: [] as Topic[] };
    }

    const json = (await response.json().catch(() => null)) as ClusterHierarchyResponse | null;
    const cluster = json?.data?.clusters?.[0] || null;
    const topics = json?.data?.topics || [];

    return { cluster, topics };
  } catch {
    return { cluster: null as Cluster | null, topics: [] as Topic[] };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalUrl = `${SITE_URL}/cluster/${slug}`;
  const { cluster } = await fetchClusterBySlug(slug);

  return buildPageMetadata(`/cluster/${slug}`, {
    title: cluster?.title ? `${cluster.title} | MoneyNow Wealth` : "Cluster | MoneyNow Wealth",
    description:
      stripHtml(cluster?.description) ||
      "Explore curated clusters and related financial articles on MoneyNow Wealth.",
    image: cluster?.thumbnail ? `${API_BASE}/uploads/thumbnail/${cluster.thumbnail}` : undefined,
    canonicalUrl,
  });
}

export default async function ClusterPage({ params }: PageProps) {
  const { slug } = await params;
  const { cluster, topics } = await fetchClusterBySlug(slug);
  const seo = await resolveSeoEntry(`/cluster/${slug}`);

  if (!cluster) return <p className="p-4">Cluster not found</p>;

  const articles: Article[] = topics.flatMap((topic) => topic.articles || []);
  const formattedDate = cluster.created_at
    ? new Date(cluster.created_at).toLocaleDateString("en-GB")
    : "";

  return (
    <>
      <SeoJsonLd schema={seo?.page_schema} />
      <section className="font-poppins mb-[0px] w-full overflow-x-hidden py-6">
        <div className="mx-auto mb-[30px] max-w-full px-4 md:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 lg:border-r lg:border-[#F0F0F0] lg:pr-[24px]">
              <div className="pr-2 lg:max-h-[180dvh] overflow-y-auto scrollbar-thin">
                <div className="mb-[30px] border-b border-[#F0F0F0]">
                  <h2 className="mb-4 text-[30px] font-semibold">Latest Articles</h2>
                  <h3 className="mb-2 text-[24px] font-semibold text-[#043F79]">
                    {cluster.title}
                  </h3>

                  {formattedDate && (
                    <p className="mb-2 text-[16px] text-gray-600">
                      Created on: {formattedDate}
                    </p>
                  )}

                  {cluster.thumbnail && (
                    <Image
                      src={`${API_BASE}/uploads/thumbnail/${cluster.thumbnail}`}
                      alt={cluster.title}
                      width={1200}
                      height={450}
                      className="mb-4 w-full rounded-[10px]"
                      priority
                      unoptimized
                    />
                  )}

                  {cluster.description && (
                    <p className="mb-4 text-[18px] leading-[28px]">
                      {cluster.description}
                    </p>
                  )}
                </div>

                <ClusterArticleSlider
                  articles={articles}
                  cluster={cluster}
                  apiBase={API_BASE}
                />
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="lg:sticky">
                <div className="relative mb-4 w-full rounded">
                  <Image
                    src="/images/blog-listing-right-banner2.png"
                    alt="Banner"
                    width={1200}
                    height={620}
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="h-auto w-full rounded"
                  />
                </div>

                <MostPopularBlogs />
              </div>
            </div>
          </div>
        </div>
        <SeniorCitizen />
      </section>
      <HomeInvestTrack data={homeInvestTrackData} />
      <div className="relative pb-[30px] pt-[60px]">
        <StayConnected />
      </div>
    </>
  );
}
