"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import ResearchDesk from "@/components/Blog-listing-Components/ResearchDesk";
import HomeInvestTrack from "@/components/home/home-invest-track";
import StayConnected from "@/components/home/stay-connected";
import { homeInvestTrackData } from "@/data/homePageData";
import GetAllCluster from "@/components/Blog-listing-Components/GetAllCluster";
import DOMPurify from "dompurify";

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
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL!;
const FALLBACK_IMAGE = "/images/most-popular-blog-img-1.png";

// ===== SANITIZE FUNCTION =====
const sanitize = (html?: string) => ({
  __html: DOMPurify.sanitize(html || ""),
});

const FeaturedArticle = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeaturedArticle = async () => {
      try {
        if (!API_BASE) throw new Error("API base URL missing");

        const res = await fetch(`${API_BASE}/api/cluster/first-topic-article/all`);
        if (!res.ok) throw new Error("API request failed");

        const data = await res.json();
        const firstClusterArticle = data?.clusters?.[0]?.topic?.article;

        if (firstClusterArticle) {
          setArticle({
            _id: firstClusterArticle._id,
            title: firstClusterArticle.title,
            slug: firstClusterArticle.slug,
            hero_image: firstClusterArticle.hero_image,
            author: firstClusterArticle.author,
            created_at: firstClusterArticle.created_at,
            introduction: firstClusterArticle.introduction,
            cluster: { title: data?.clusters?.[0]?.title },
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch featured article");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedArticle();
  }, []);

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
        {article.cluster?.title && (
    <Link href={`/blog/${article.slug}`}>
      <span className="text-[18px] sm:text-[20px] font-inter text-[#043F79] font-bold cursor-pointer hover:underline">
        {article.cluster.title}
      </span>
    </Link>
        )}

       <Link href={`/blog/${article.slug}`}>
  <h3 className="text-[22px] md:text-[30px] font-semibold mt-1 mb-1 cursor-pointer hover:text-[#043F79]">
    {article.title}
  </h3>
</Link>


      <p className="text-[13px] md:text-[16px] font-medium font-inter mb-[25px]">
  {article.author || "Team Money Now"} &nbsp;|&nbsp;
  {article.created_at
    ? new Date(article.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : ""}
</p>

      </div>

      <Link href={`/blog/${article.slug}`}>
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
    className="text-gray-600 font-inter [&_p]:!text-[18px] sm:[&_p]:!text-[20px] [&_p]:!leading-[28px] sm:[&_p]:!leading-[32px] [&_p]:mb-4 [&_p:last-child]:mb-0 mb-6"
    dangerouslySetInnerHTML={sanitize(article.introduction)}
  />
)}

    </div>
  );
};

const LatestArticle = () => {
  return (
    <>
      <section className="font-poppins w-full py-6 mb-[30px] md:mb-[120px] overflow-x-hidden">
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
            </div>
          </div>

          {/* Banner Images */}
          <div className="hidden sm:block w-full">
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

          <div className="hidden sm:block w-full mt-6">
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

          <div className="block sm:hidden w-full mt-6">
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

<div className="w-full mt-24 sm:mt-0">
          <HomeInvestTrack data={homeInvestTrackData} />
        <div className="border-t border-[#E5E7EB]">
          <StayConnected />
        </div>
      </div>
    </>
  );
};

export default LatestArticle;
