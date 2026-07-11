"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { useArticles } from "@/hooks/useArticles";
import { useSubscription } from "@/hooks/useSubscription";

import { API } from "@/app/api/axios";

// Custom Crown Icon to match design exactly
const CrownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2L15 8L21 6L18 13H6L3 6L9 8L12 2Z" />
    <path d="M6 15H18V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V15Z" />
  </svg>
);

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Market Outlook":
      return "bg-[#EBF3FE] text-[#0A4A87]";
    case "Mutual Funds":
      return "bg-[#ECFDF5] text-[#10B981]";
    case "Tax Planning":
      return "bg-[#FFF1E5] text-[#F97316]";
    case "Retirement":
      return "bg-[#F3E8FF] text-[#A855F7]";
    case "Personal Finance":
      return "bg-[#FFF1E5] text-[#F97316]";
    case "Insurance":
      return "bg-[#FDF2F8] text-[#EC4899]";
    case "Investing Basics":
      return "bg-[#F0F9FF] text-[#0EA5E9]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
export default function Insights() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState("All");
  const [activeTag, setActiveTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [clusters, setClusters] = useState<{ _id: string; title: string }[]>([]);

  // Fetch clusters dynamically
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const { data } = await API.get("/api/cluster");
        if (data.success && Array.isArray(data.clusters)) {
          setClusters(data.clusters);
        }
      } catch (err) {
        console.error("Failed to fetch clusters", err);
      }
    };
    fetchClusters();
  }, []);

  const tags = ["All", ...clusters.map((c) => c.title)];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When tag or tab changes, reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag, activeTab]);

  // Find cluster ID if a tag is selected
  const activeClusterId =
    activeTag !== "All"
      ? clusters.find((c) => c.title === activeTag)?._id
      : undefined;

  // Build search term (only use the text search query)
  const effectiveSearch = debouncedSearch;

  // Fetch articles from API
  const { articles, loading, error, totalPages, getImageUrl } = useArticles({
    page: currentPage,
    limit: 9,
    status: "published",
    search: effectiveSearch,
    access_type: activeTab === "Premium" ? "premium" : undefined,
    cluster_id: activeClusterId,
  });

  const { currentSubscription, latestSubscription } = useSubscription();

  const isPremiumActive = currentSubscription?.isPremium === true && currentSubscription?.isActive === true;

  const isExpiredPremium = 
    !isPremiumActive && 
    latestSubscription?.planName?.toLowerCase().includes("premium") === true;

  return (
    <div className="w-full font-inter">
      {/* Header section */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[32px] font-bold text-[#051338]">Insights</h1>
          <p className="mt-1 text-[15px] text-[#64748B]">
            Stay informed with expert insights, market updates, and investment strategies.
          </p>
        </div>
        <div className="flex h-[42px] w-fit overflow-hidden rounded-md border border-[#E7ECF5] bg-white">
          <button
            onClick={() => setActiveTab("All")}
            className={`px-8 text-[14px] font-semibold transition-colors ${
              activeTab === "All"
                ? "bg-[#0A4A87] text-white"
                : "text-[#475569] hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("Premium")}
            className={`flex items-center gap-1.5 px-6 text-[14px] font-semibold transition-colors ${
              activeTab === "Premium"
                ? "bg-[#0A4A87] text-white"
                : "text-[#475569] hover:bg-gray-50"
            }`}
          >
            <CrownIcon className="h-[18px] w-[18px] text-[#F59E0B]" />
            Premium
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search articles by keyword or topic......"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-[#E7ECF5] bg-white py-4 pl-[48px] pr-4 text-[15px] text-[#0A1633] outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
        />
      </div>

      {/* Popular Searches */}
      <div className="mb-8">
        <h3 className="mb-4 text-[15px] font-semibold text-[#0A1633]">
          Popular Searches
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                activeTag === tag
                  ? "bg-[#0A4A87] text-white"
                  : "border border-[#E7ECF5] bg-white text-[#475569] hover:bg-gray-50"
              }`}
            >
              {tag}
            </button>
          ))}
          <button className="flex items-center gap-1.5 rounded-full border border-[#E7ECF5] bg-white px-5 py-2 text-[14px] font-medium text-[#475569] hover:bg-gray-50 transition-colors">
            More <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#64748B]">
          Loading articles...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-red-500">
          {error}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-[#64748B]">
          No articles found for the selected criteria.
        </div>
      ) : (
        <>
          {/* Blog Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: any) => {
              const category = article.topic_id?.title || article.topic?.title || "General";
              
              const isPremium = Boolean(
                article.is_premium ||
                article.premium ||
                article.topic_id?.access_type?.toLowerCase() === "premium" ||
                article.topic?.access_type?.toLowerCase() === "premium" ||
                article.access_level?.toLowerCase() === "premium" ||
                article.plan_type?.toLowerCase() === "premium"
              );

              return (
                <div
                  key={article.id || article._id}
                  className="group relative flex flex-col overflow-hidden rounded-[20px] border border-[#E7ECF5] bg-white shadow-[0_2px_12px_rgba(15,34,74,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(15,34,74,0.06)]"
                >
                  {/* Image container */}
                  <div className="relative h-[220px] w-full overflow-hidden bg-gray-100">
                    <Image
                      src={getImageUrl(article.hero_image) || "/images/article-img-1.png"}
                      alt={article.title || "Article Image"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    
                    {isPremium && !isPremiumActive && (
                      <>
                        {/* Crown Icon Always Visible (styled with white border as in reference) */}
                        <div className="absolute right-4 top-4 z-20 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#0A4A87] border-[2px] border-white shadow-md">
                          <CrownIcon className="h-4 w-4 text-[#F59E0B]" />
                        </div>

                        {/* Hover Overlay for Premium */}
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <p className="mb-4 mt-8 text-[16px] font-medium text-white text-center px-4">
                            {isExpiredPremium ? "Your premium access has expired" : "Unlock premium insight"}
                          </p>
                          <button className="rounded-md bg-white px-6 py-2.5 text-[14px] font-semibold text-[#0A1633] transition-colors hover:bg-gray-50">
                            {isExpiredPremium ? "Renew Premium" : "Unlock Premium"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-[24px]">
                    <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                      <span
                        className={`w-fit truncate rounded-full px-3 py-1.5 text-[12px] font-bold ${getCategoryStyles(
                          category
                        )}`}
                        title={category}
                      >
                        {category}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                          isPremium
                            ? "bg-[#FFF1E5] text-[#F59E0B]" // Orange/Yellowish for Premium
                            : "bg-[#ECFDF5] text-[#10B981]" // Green for Free
                        }`}
                      >
                        {isPremium ? "Premium" : "Free"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-[18px] font-bold leading-[1.4] text-[#0A1633] line-clamp-2">
                        {article.title}
                      </h3>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
                        <span>{article.author || "Team Money Now"}</span>
                        <span className="h-[3px] w-[3px] rounded-full bg-[#CBD5E1]"></span>
                        <span>{formatDate(article.publish_date || article.created_at)}</span>
                      </div>

                      <Link
                        href={`/user/blog/${article.slug}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-[#0A4A87] hover:underline"
                      >
                        Read More <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Container using existing Pagination component */}
          {totalPages > 1 && (
            <div className="mt-[48px] flex items-center justify-center gap-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showPageNumbers={true}
                showBoundaryButtons={false}
                className="gap-2"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
