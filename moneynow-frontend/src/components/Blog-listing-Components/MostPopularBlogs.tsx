

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Article {
  _id: string;
  title: string;
  slug: string;
  hero_image?: string;
  author?: string;
  created_at?: string;
  cluster?: {
    title: string;
  };
}

interface Props {
  folder?: string; 
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL!;
const FALLBACK_IMAGE = "/images/most-popular-blog-img-1.png";

const MostPopularBlogs: React.FC<Props> = ({ folder = "/hero" }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        if (!API_BASE) throw new Error("API base URL missing");

        const res = await fetch(`${API_BASE}/api/cluster/first-topic-article/all`);
        if (!res.ok) throw new Error("API request failed");

        const data = await res.json();

        const formatted: Article[] =
          data?.clusters
            ?.filter((c: any) => c?.topic?.article)
            .map((cluster: any) => ({
              _id: cluster.topic.article._id,
              title: cluster.topic.article.title,
              slug: cluster.topic.article.slug,
              hero_image: cluster.topic.article.hero_image,
              author: cluster.topic.article.author,
              created_at: cluster.topic.article.created_at,
              cluster: {
                title: cluster.title,
              },
            })) || [];

        setArticles(formatted);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="lg:col-span-4 mb-[30px]">
    <h2 className="text-[24px] sm:text-[30px] font-poppins font-semibold mb-4 border-b border-[#F0F0F0] pb-[15px]">
  Most Popular
</h2>


        <div className="space-y-5">
          {articles.slice(0, 3).map((article) => {
            // Build image URL with IMAGE_BASE + folder + hero_image
            const imageSrc =
              article.hero_image
                ? `${IMAGE_BASE}${folder}${article.hero_image.startsWith("/") ? "" : "/"}${article.hero_image}`
                : FALLBACK_IMAGE;

            return (
              <Link
                href={`/blog/${article.slug}`}
                key={article._id}
                className="flex gap-2 items-start border-b border-[#F0F0F0] pb-[30px]"
              >
                {/* Content */}
         <div className="flex-1">
  <span className="block text-[16px] sm:text-[18px] font-bold text-[#043F79] mb-[8px]">
    {article.cluster?.title || "General"}
  </span>

  <p className="text-[18px] sm:text-[20px] font-semibold leading-[24px] sm:leading-[26px] mb-[8px] line-clamp-2">
    {article.title}
  </p>

  <p className="text-[13px] sm:text-[15px] font-inter font-medium">
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


                {/* Image */}
                <div className="relative w-[124px] h-[104px] shrink-0">
                  <Image
                    src={imageSrc}
                    alt={article.title}
                    fill
                    className="object-cover rounded-[6px]"
                    unoptimized
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </>
  );
};

export default MostPopularBlogs;
