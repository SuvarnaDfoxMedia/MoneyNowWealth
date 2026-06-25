"use client";

import Image from "next/image";
import { useFetchCards } from "@/hooks/useHomeBlog";

interface LatestRecommendationBlogsProps {
  title?: string;
  subtitle?: string;
}

const FALLBACK_IMAGE = "/images/dash-latest-blog-img.png";

/** Date formatter */
const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

const LatestRecommendationBlogs: React.FC<LatestRecommendationBlogsProps> = ({
  title = "Latest Recommendation Blogs",
  subtitle = "Curated ideas from our latest research and insights.",
}) => {
  const { cards, loading, error } = useFetchCards(
    "/api/article/published/latest",
    5,
    { visibilityField: "show_on_dashboard" },
  );

  return (
    <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow">
      {/* Section Label */}
      {/* <h2 className="font-semibold mb-5 text-[22px]">Recommended For You</h2> */}

      {/* Title */}
      <h2 className="text-[24px] sm:text-[30px] font-poppins font-semibold mb-4 border-b border-[#F0F0F0] pb-[15px]">
        {title}
      </h2>

      {/* Subtitle */}
      {/* <p className="text-[15px] text-[#6A6A6A] mb-5">{subtitle}</p> */}

      {/* Loading / Error */}
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Cards */}
      {!loading && !error && (
        <div className="space-y-5">
          {cards.slice(0, 5).map((item: any, index: number) => {
            return (
              <a
                href={`/blog/${item.slug}`}
                key={item.slug || index}
                className="flex gap-3 items-start border-b border-[#F0F0F0] pb-[30px]"
              >
                {/* Image LEFT */}
                <div className="relative w-[124px] h-[104px] shrink-0 rounded-[6px] overflow-hidden">
                  <Image
                    src={item.imageSrc || FALLBACK_IMAGE}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Content RIGHT */}
                <div className="flex-1">
                  <span className="block text-[16px] sm:text-[16px] font-semibold text-[#043F79] mb-[8px]">
                    {item.category || "General"}
                  </span>

                  <p className="text-[18px] sm:text-[18px] font-semibold leading-[18px] sm:leading-[18px] mb-[8px] line-clamp-2">
                    {item.title}
                  </p>

                  <p className="text-[13px] sm:text-[15px] font-inter font-medium">
                    {item.author || "Team Money Now"} &nbsp;|&nbsp;
                    {formatDate(item.published_at)}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LatestRecommendationBlogs;
