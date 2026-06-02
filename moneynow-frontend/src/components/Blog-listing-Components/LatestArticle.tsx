"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import ResearchDesk from "@/components/Blog-listing-Components/ResearchDesk";
import HomeInvestTrack from "@/components/home/invest-with-confidence";
import StayConnected from "@/components/home/home-newsletters";
import { homeInvestTrackData } from "@/data/homePageData";
import GetAllCluster from "@/components/Blog-listing-Components/GetAllCluster";
import DOMPurify from "dompurify";
import { normalizeRichTextHtml } from "@/utils/normalizeRichTextHtml";
import { useRefreshSignal } from "@/hooks/useRefreshSignal";
import { API } from "@/app/api/axios";
import { useContentAccess } from "@/hooks/useContentAccess";
import { usePathname } from "next/navigation";

interface Article {
  _id: string;
  title: string;
  slug: string;
  hero_image?: string;
  author?: string;
  created_at?: string;
  introduction?: string;
  cluster?: {
    title: string;
  };
  topic?: {
    title?: string;
  };
  publish_date?: string;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL!;
const FALLBACK_IMAGE = "/images/most-popular-blog-img-1.png";

const sanitize = (html?: string) => ({
  __html: DOMPurify.sanitize(normalizeRichTextHtml(html || "")),
});

const FeaturedArticle = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);
  const { refreshTick } = useRefreshSignal();
  const { accessLevel } = useContentAccess();
  const pathname = usePathname();
  const blogBasePath = pathname.startsWith("/user/") ? "/user/blog" : "/blog";

  useEffect(() => {
    const fetchFeaturedArticle = async () => {
      const isInitialLoad = !hasLoadedRef.current;
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const { data } = await API.get("/api/article/published/latest", {
          params: { limit: 1 },
        });
        const latestArticle =
          data?.articles?.[0] || data?.data?.articles?.[0] || data?.data?.[0];

        if (latestArticle) {
          setArticle({
            _id: latestArticle._id,
            title: latestArticle.title,
            slug: latestArticle.slug,
            hero_image: latestArticle.hero_image,
            author: latestArticle.author,
            created_at: latestArticle.created_at,
            publish_date: latestArticle.publish_date,
            introduction: latestArticle.introduction,
            cluster: latestArticle.cluster,
            topic: latestArticle.topic,
          });
          hasLoadedRef.current = true;
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch featured article");
        if (!hasLoadedRef.current) {
          setArticle(null);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedArticle();
  }, [refreshTick, accessLevel]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!article) return <p>No featured article available</p>;

  const imageSrc = article.hero_image
    ? `${IMAGE_BASE}/hero${article.hero_image.startsWith("/") ? "" : "/"}${article.hero_image}`
    : FALLBACK_IMAGE;

  return (
    <div className="border-b border-[#F0F0F0] mb-[15px]">
      <p className="text-[26px] md:text-[30px] font-poppins font-semibold mb-4 border-b border-[#F0F0F0] pb-[15px]">
        Latest Articles
      </p>

      <div className="relative mb-[15px]">
        {(article.cluster?.title || article.topic?.title) && (
          <Link href={`${blogBasePath}/${article.slug}`}>
            <span className="text-[18px] sm:text-[20px] font-inter text-[#043F79] font-bold cursor-pointer hover:underline">
              {article.cluster?.title || article.topic?.title}
            </span>
          </Link>
        )}

        <Link href={`${blogBasePath}/${article.slug}`}>
          <h3 className="text-[22px] md:text-[30px] font-semibold mt-1 mb-1 cursor-pointer hover:text-[#043F79]">
            {article.title}
          </h3>
        </Link>

        <p className="text-[13px] md:text-[16px] font-medium font-inter mb-[25px]">
          {article.author || "Team Money Now"} &nbsp;|&nbsp;
          {article.publish_date || article.created_at
            ? new Date(
                article.publish_date || article.created_at || "",
              ).toLocaleDateString("en-GB")
            : ""}
        </p>
      </div>

      <Link href={`${blogBasePath}/${article.slug}`}>
        <div className="cursor-pointer">
          <Image
            src={imageSrc}
            alt={article.title}
            width={1200}
            height={450}
            className="w-full h-auto rounded mb-[20px]"
            unoptimized
          />
        </div>
      </Link>

      {article.introduction && (
        <div
          className="
  text-gray-600 font-inter
  line-clamp-[5]
  [&_p]:!text-[18px]
  sm:[&_p]:!text-[20px]
  [&_p]:!leading-[28px]
  sm:[&_p]:!leading-[32px]
  [&_p]:mb-4
  [&_p:last-child]:mb-0
  [&_ul]:my-3
  [&_ul]:list-disc
  [&_ul]:pl-6
  [&_ol]:my-3
  [&_ol]:list-decimal
  [&_ol]:pl-6
  [&_li]:my-1.5
  mb-6
"
          dangerouslySetInnerHTML={sanitize(article.introduction)}
        />
      )}
    </div>
  );
};

const LatestArticle = () => {
  return (
    <>
      <section className="font-poppins w-full py-[20px] mb-[30px] overflow-x-hidden">
        <div className="max-w-full mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-[30px]">
            {/* LEFT SECTION */}
            <div className="lg:col-span-8 lg:border-r lg:border-[#F0F0F0] lg:pr-[24px]">
              <FeaturedArticle />
              <GetAllCluster />
            </div>

            {/* RIGHT SECTION */}
            <div className="lg:col-span-4">
              <MostPopularBlogs />

              <div className="relative w-full rounded">
                <Image
                  src="/images/blog-listing-right-banner2.png"
                  alt="Banner"
                  width={1200}
                  height={620}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          </div>

          {/* Banner Images */}
          <div className="hidden sm:block w-full pt-[30px]">
            <Image
              src="/images/blog-listing-MF-sahi.png"
              alt="Latest Article"
              width={1200}
              height={50}
              sizes="(min-width: 640px) 1200px"
              className="w-full h-auto rounded"
            />
          </div>

          <div className="block sm:hidden w-full">
            <Image
              src="/images/blog-listing-MF-sahi-mb.png"
              alt="Latest Article Mobile"
              width={640}
              height={200}
              sizes="100vw"
              className="w-full h-auto rounded"
            />
          </div>

          <ResearchDesk />

          <div className="hidden sm:block w-full">
            <Image
              src="/images/senior-citizen-img.png"
              alt="Senior Citizen"
              width={1200}
              height={200}
              sizes="(min-width: 640px) 1200px"
              className="w-full h-auto rounded"
              priority
            />
          </div>

          <div className="block sm:hidden w-full ">
            <Image
              src="/images/senior-citizen-img-mb.png"
              alt="Senior Citizen Mobile"
              width={640}
              height={300}
              sizes="100vw"
              className="w-full h-auto rounded"
              priority
            />
          </div>
        </div>
      </section>

      <div className="w-full">
        <HomeInvestTrack data={homeInvestTrackData} />

        <div className="relative pt-[60px] pb-[20px]">
          <StayConnected />
        </div>
      </div>
    </>
  );
};

export default LatestArticle;





