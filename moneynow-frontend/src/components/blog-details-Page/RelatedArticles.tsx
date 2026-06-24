"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface RelatedRead {
  title?: string;
  content?: string;
}

interface Article {
  _id?: string;
  title: string;
  slug?: string;
  description?: string;
  author?: string;
  hero_image?: string;
  introduction?: string;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  publish_date?: string;
}

const FALLBACK_RELATED = [
  {
    title: "How to Choose the Right Mutual Fund for Your Goals",
    author: "Team Money Now",
    publish_date: "2026-05-23T00:00:00.000Z",
    created_at: "2026-05-23T00:00:00.000Z",
    slug: "how-to-choose-the-right-mutual-fund-for-your-goals",
    hero_image: "small-article-img1.png",
  },
  {
    title: "New Tax Regime vs Old Tax Regime: Which One Should You Choose?",
    author: "Team Money Now",
    publish_date: "2026-05-23T00:00:00.000Z",
    created_at: "2026-05-23T00:00:00.000Z",
    slug: "new-tax-regime-vs-old-tax-regime-which-one-should-you-choose",
    hero_image: "small-article-img2.png",
  },
  {
    title: "Retirement Planning in Your 30s: Start Early, Retire Worry-Free",
    author: "Team Money Now",
    publish_date: "2026-05-22T00:00:00.000Z",
    created_at: "2026-05-22T00:00:00.000Z",
    slug: "retirement-planning-in-your-30s-start-early-retire-worry-free",
    hero_image: "small-article-img1.png",
  },
  {
    title: "Emergency Fund: Why It's Your First Financial Priority",
    author: "Team Money Now",
    publish_date: "2026-05-22T00:00:00.000Z",
    created_at: "2026-05-22T00:00:00.000Z",
    slug: "emergency-fund-why-its-your-first-financial-priority",
    hero_image: "small-article-img2.png",
  },
];

type RelatedArticlesProps = {
  relatedArticles: any[];
};

const RelatedArticles = ({ relatedArticles }: RelatedArticlesProps) => {
  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL || "";

  return (
    <div className="mt-10 pb-10 font-poppins">
      <h3 className="text-[20px] font-bold text-[#07112C] mb-6">Related Articles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(relatedArticles.length >= 2 ? relatedArticles : FALLBACK_RELATED).map((art, idx) => {
          const imageSrc = art.hero_image
            ? art.hero_image.startsWith("small-article-img") || art.hero_image.startsWith("/")
              ? art.hero_image.startsWith("/") ? art.hero_image : `/images/${art.hero_image}`
              : `${IMAGE_BASE}/hero/${art.hero_image.replace(/^\/+/, "")}`
            : "/images/most-popular-blog-img-1.png";

          const dateStr = (art.publish_date || art.created_at)
            ? new Date(art.publish_date || art.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              })
            : "May 22, 2026";

          return (
            <div key={idx} className="bg-white border border-[#E7ECF5] rounded-xl p-4 shadow-[0_4px_20px_rgba(7,17,44,0.03)] flex gap-4 items-center">
              <div className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                <Image
                  src={imageSrc}
                  alt={art.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-[#07112C] leading-snug line-clamp-2 mb-2 hover:text-[#0A4A87] transition-all">
                  <Link href={`/user/blog/${art.slug}`}>
                    {art.title}
                  </Link>
                </h4>
                
                <p className="text-[11px] text-[#7A88A7] font-semibold mb-2">
                  {art.author || "Team Money Now"} &nbsp;|&nbsp; {dateStr}
                </p>

                <Link href={`/user/blog/${art.slug}`} className="text-[#0A4A87] hover:text-[#083B6C] text-[12px] font-bold inline-flex items-center gap-0.5">
                  <span>Read More</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Link href="/user/insights" className="text-[#0A4A87] hover:text-[#083B6C] text-[15px] font-bold inline-flex items-center gap-1">
          <span>View All Articles</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
};

export default RelatedArticles;
