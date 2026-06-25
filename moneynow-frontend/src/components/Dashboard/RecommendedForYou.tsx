"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { useFetchCards } from "@/hooks/useHomeBlog";

const FALLBACK_IMAGE = "/images/article-img-1.png";

/** Date formatter */
const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

export default function RecommendedForYou() {
  const { cards, loading, error } = useFetchCards(
    "/api/article/published/latest",
    4,
    { visibilityField: "show_on_dashboard" },
  );

  const leftCard = cards[0];
  const rightCards = cards.slice(1, 4);

  return (
    <DashboardCard className="mt-4 rounded-[24px] p-6 md:p-7">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-[#051338]">
          Recommended for You
        </h2>
        <Link href="/user/insights" className="group inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-sm bg-[#0A4A87] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#083A69]">
          View all
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 text-white" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
        </Link>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-center py-5">Loading...</p>}
      {error && <p className="text-center text-red-500 py-5">{error}</p>}

      {/* Grid Layout */}
      {!loading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Left Big Card */}
          {leftCard && (
            <div className="flex h-fit flex-col overflow-hidden rounded-xl border border-[#E7ECF5] bg-[#F7FAFF] shadow-[0_2px_8px_rgba(15,34,74,0.04)]">
              <div className="relative mb-4 h-[180px] w-full overflow-hidden rounded-xl sm:h-[220px]">
                <Image
                  src={leftCard.imageSrc || FALLBACK_IMAGE}
                  alt={leftCard.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="mt-auto pt-0 px-3">
                <span className="text-[13px] font-bold text-[#9333EA]">
                  {leftCard.category || "General"}
                </span>
                <h3 className="mt-2 text-[20px] font-semibold leading-[1.40] text-[#0A1633] line-clamp-2">
                  {leftCard.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#475569] line-clamp-2">
                  {leftCard.description}
                </p>

                <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
                  <span>{leftCard.author || "Team Money Now"}</span>
                  <span className="h-1 w-1 rounded-full bg-[#CBD5E1]"></span>
                  <span>{formatDate(leftCard.published_at)}</span>
                  <span className="h-1 w-1 rounded-full bg-[#CBD5E1]"></span>
                  <span>5 min read</span>
                </div>

                <Link
                  href={`/user/blog/${leftCard.slug}`}
                  className="mt-3 mb-5 inline-flex items-center gap-2 text-[15px] font-bold text-[#0A4A87] hover:underline"
                >
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
            </div>
          )}

          {/* Right Small Cards */}
          <div className="flex flex-col">
            <h3 className="mb-4 text-[22px] font-semibold leading-[1.25] text-[#0A1633]">
              Most Popular
            </h3>
            {rightCards.map((item, index) => (
              <Link
                href={`/user/blog/${item.slug}`}
                key={item.slug || index}
                className={`flex items-center gap-5 py-5
                   ${
                  index !== rightCards.length - 1 ? "border-b border-[#F1F5F9]" : ""
                } ${index === 0 ? "pt-0" : ""} ${index === rightCards.length - 1 ? "pb-0" : ""}`}
              >
                <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-[110px] sm:w-[110px]">
                  <Image
                    src={item.imageSrc || `/images/blog-img-${index + 1}.png`}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex-1">
                  <span className="text-[13px] font-semibold text-[#0A4A87]">
                    {item.category || "General"}
                  </span>
                  <h4 className="mt-2 text-[16px] font-semibold leading-[1.5] text-[#0A1633] sm:text-[17px] line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
                    <span>{formatDate(item.published_at)}</span>
                    <span className="h-1 w-1 rounded-full bg-[#CBD5E1]"></span>
                    <span>4 min read</span>
                  </div>
                </div>

                
              </Link>
            ))}
          </div>
          
        </div>
      )}
    </DashboardCard>
  );
}
