"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Simple sanitize function to allow basic HTML (you can replace with DOMPurify if needed)
const sanitize = (html?: string) => {
  return { __html: html || "" };
};

interface Article {
  _id: string;
  title: string;
  slug: string;
  hero_image?: string;
  introduction?: string;
  author?: string;
  created_at?: string;
  publish_date?: string;
}

interface Cluster {
  title: string;
}

interface Props {
  articles: Article[];
  cluster: Cluster;
  apiBase: string;
  perPage?: number; // Articles per page
}

const ClusterArticlePagination: React.FC<Props> = ({
  articles,
  cluster,
  apiBase,
  perPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleArticles, setVisibleArticles] = useState<Article[]>([]);

  const totalPages = Math.ceil(articles.length / perPage);

  useEffect(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    setVisibleArticles(articles.slice(start, end));
  }, [currentPage, articles, perPage]);

  if (articles.length === 0)
    return <p className="text-gray-500">No articles available</p>;

  return (
    <div className="w-full">
      <h3 className="text-[24px] sm:text-[28px] font-poppins font-semibold">
        Explore Topics
      </h3>

      <div className="flex flex-col gap-6">
        {visibleArticles.map((article) => (
          <Link
            key={article._id}
            href={`/blog/${article.slug}`}
            className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden transition"
          >
            <div className="flex-1 py-5 pr-5 flex flex-col justify-between">
              <span className="text-[#043F79] font-bold text-[18px] font-inter">
                {cluster.title}
              </span>

              <h3 className="mt-2 text-[20px] font-semibold line-clamp-2 font-poppins">
                {article.title}
              </h3>

              <div className="mt-2 text-[15px] flex gap-1 flex-wrap items-center">
                <span>{article.author || "Team Money Now"}</span>
                {article.created_at && (
                  <>
                    <span>|</span>
                    <span>
                      {new Date(article.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </>
                )}
              </div>

              {/* Introduction — FIXED */}
              {article.introduction && (
                <div
                  className=" mt-2 font-inter line-clamp-3
                       [&_p]:inline
                       [&_p]:!text-[20px]
                       [&_p]:!leading-[30px]
                       [&_p]:mb-0"
                  dangerouslySetInnerHTML={sanitize(article.introduction)}
                />
              )}
            </div>

            {article.hero_image && (
              <div className="relative w-full md:w-[300px] h-[150px] md:h-auto flex-shrink-0 rounded-xl overflow-hidden">
                <Image
                  src={`${apiBase}/uploads/hero/${article.hero_image
                    .replace(/\\/g, "/")
                    .split("/")
                    .pop()}`}
                  alt={article.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-1">
        {/* Previous */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center 
               bg-gray-200 text-gray-600
               disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Numbers */}
        {(() => {
          const pages: (number | string)[] = [];
          if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
          } else {
            if (currentPage <= 4) {
              pages.push(1, 2, 3, 4, 5, "...", totalPages);
            } else if (currentPage >= totalPages - 3) {
              pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
              pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
          }
          return pages.map((p, i) => (
            <button
              key={i}
              disabled={p === "..."}
              onClick={() => p !== "..." && setCurrentPage(Number(p))}
              className={`w-9 h-9 text-sm flex items-center justify-center border
          ${
            p === "..."
              ? "bg-transparent text-gray-500 border-transparent cursor-default font-bold"
              : currentPage === p
              ? "bg-[#043F79] text-white border-[#043F79] font-medium"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
            >
              {p}
            </button>
          ));
        })()}

        {/* Next */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center 
               bg-gray-200 text-gray-600
               disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ClusterArticlePagination;
