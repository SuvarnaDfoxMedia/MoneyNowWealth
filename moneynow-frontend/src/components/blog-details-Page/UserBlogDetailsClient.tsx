"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "dompurify";
import { normalizeRichTextHtml } from "@/utils/normalizeRichTextHtml";
import { API } from "@/app/api/axios";
import RelatedTools from "./RelatedTools";
import RelatedArticles from "./RelatedArticles";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaLink,
} from "react-icons/fa";
import { Clock, ArrowLeft, BarChart2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

// Custom Crown Icon to replace missing image
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



interface Section {
  title?: string;
  content?: string;
}

interface Faq {
  question: string;
  answer?: string;
}

interface Tool {
  title?: string;
  content?: string;
}

interface RelatedRead {
  title?: string;
  content?: string;
}

export interface Article {
  _id?: string;
  title: string;
  slug?: string;
  description?: string;
  author?: string;
  hero_image?: string;
  introduction?: string;
  seo_title?: string;
  seo_description?: string;
  sections?: Section[];
  faqs?: Faq[];
  tools?: Tool[];
  related_reads?: RelatedRead[];
  created_at?: string;
  publish_date?: string;
  topic?: {
    title?: string;
    publish_date?: string;
  };
}

type UserBlogDetailsClientProps = {
  article: Article | null;
  error?: string | null;
  topicTitle?: string;
  canonicalUrl: string;
};

const UserBlogDetailsClient = ({
  article,
  error,
  topicTitle = "",
  canonicalUrl,
}: UserBlogDetailsClientProps) => {
  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL || "";

  const [isMounted, setIsMounted] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);

  const { currentSubscription, latestSubscription } = useSubscription();
  
  const isPremiumActive = currentSubscription?.isPremium === true && currentSubscription?.isActive === true;

  const isExpiredPremium = 
    !isPremiumActive && 
    latestSubscription?.planName?.toLowerCase().includes("premium") === true;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track reading scroll progress
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      const articleElement = document.getElementById("blog-article-content");
      if (!articleElement) return;

      const rect = articleElement.getBoundingClientRect();
      const articleHeight = rect.height;
      const articleTop = rect.top;

      const windowHeight = window.innerHeight;

      if (articleTop > windowHeight) {
        setScrollPercent(0);
        return;
      }

      // Calculate scrolled past article height
      const scrolledPast = windowHeight - articleTop;
      const percentage = Math.min(
        Math.max((scrolledPast / articleHeight) * 100, 0),
        100,
      );
      setScrollPercent(Math.round(percentage));
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMounted, article]);

  // Fetch related articles
  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        const { data } = await API.get("/api/article/published/latest", {
          params: { limit: 5 },
        });
        const list = data?.articles || data?.data?.articles || data?.data || [];
        const filtered = list
          .filter((a: any) => a.slug !== article?.slug)
          .slice(0, 4);
        setRelatedArticles(filtered);
      } catch (err) {
        console.error("Error fetching related articles", err);
      }
    };

    if (article?.slug) {
      fetchRelatedArticles();
    }
  }, [article]);

  const sanitizeAndNormalizeHtml = (html?: string) => {
    if (!html) return { __html: "" };

    if (!isMounted || typeof document === "undefined") {
      return {
        __html: html,
      };
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = normalizeRichTextHtml(html);

    // Apply basic styles for tables if inline styling is needed
    tempDiv.querySelectorAll("table").forEach((table) => {
      table.setAttribute(
        "style",
        [
          "width: 100%",
          "border-collapse: collapse",
          "border: 1px solid #DEE5F1",
          "margin: 1.5rem 0",
          "border-radius: 12px",
          "overflow: hidden",
        ].join("; "),
      );
    });

    tempDiv.querySelectorAll("th").forEach((th) => {
      th.setAttribute(
        "style",
        [
          "border: 1px solid #DEE5F1",
          "padding: 14px 16px",
          "text-align: left",
          "background: #f4f7fb",
          "font-weight: 700",
          "color: #043F79",
        ].join("; "),
      );
    });

    tempDiv.querySelectorAll("td").forEach((td) => {
      td.setAttribute(
        "style",
        [
          "border: 1px solid #DEE5F1",
          "padding: 14px 16px",
          "text-align: left",
          "color: #4A5B83",
        ].join("; "),
      );
    });

    tempDiv.querySelectorAll("tbody tr:nth-child(even)").forEach((row) => {
      row.setAttribute("style", "background: #fafcff");
    });

    tempDiv.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") || "#";
      if (
        !href.startsWith("http://") &&
        !href.startsWith("https://") &&
        !href.startsWith("/") &&
        !href.startsWith("mailto:")
      ) {
        a.setAttribute("href", `https://${href}`);
      }
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });

    return {
      __html: DOMPurify.sanitize(tempDiv.innerHTML, {
        USE_PROFILES: { html: true },
        ADD_TAGS: [
          "table",
          "thead",
          "tbody",
          "tfoot",
          "tr",
          "td",
          "th",
          "colgroup",
          "col",
        ],
        ADD_ATTR: ["target", "rel", "style", "class"],
        KEEP_CONTENT: true,
      }),
    };
  };

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 font-poppins">
        <p className="mb-6 text-center text-red-500 font-semibold">{error}</p>
        <div className="text-center">
          <Link
            href="/user/insights"
            className="inline-flex items-center gap-2 bg-[#0A4A87] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#083B6C] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return <p className="py-20 text-center font-poppins text-gray-500">Blog not found</p>;
  }

  // Calculate read time dynamic estimation
  const textBody = [
    article.introduction || "",
    ...(article.sections?.map((s) => (s.title || "") + " " + (s.content || "")) || []),
  ].join(" ");
  const wordCount = textBody.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(Math.round(wordCount / 200), 5); // default/min 5 min read

  const publishDate = article.publish_date || article.created_at;
  const publishDateStr = publishDate
    ? new Date(publishDate).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, " | ")
    : "16 | 05 | 2026";

  const heroImageSrc = article.hero_image
    ? `${IMAGE_BASE}/hero/${article.hero_image.replace(/^\/+/, "")}`
    : null;

  // Insert CTA comparison box right before tables dynamically
  const renderContentWithCTAs = (htmlContent: string) => {
    if (!htmlContent) return null;

    if (htmlContent.includes("<table")) {
      const parts = htmlContent.split("<table");
      return (
        <div className="w-full">
          <div dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(parts[0])} />
          
          {/* Comparison CTA Box */}
  <div className="bg-[#FFF9F2] border border-[#FFE7CC] rounded-xl px-6 py-6 md:px-8 md:py-6 flex flex-col md:flex-row items-center gap-6 md:gap-8 my-6">
  <div className="shrink-0 flex items-center justify-center">
    <Image
      src="/images/want-to-compare-fund.png"
      alt="Compare Funds"
      width={160}
      height={160}
      className="object-contain w-[120px] md:w-[150px] h-auto"
    />
  </div>

  <div className="flex flex-col items-start w-full -mt-5 md:-mt-7">
    <h4 className="text-[18px] md:text-[20px] font-bold text-[#07112C] font-poppins leading-tight">
      Want to compare debt funds?
    </h4>

    <p className="text-[14px] md:text-[15px] text-[#5E6B85] mt-2 mb-5">
      Use our free tools to analyse and compare funds better.
    </p>

    <Link
      href="/mutual-funds"
      className="inline-block bg-[#0A4A87] hover:bg-[#083B6C] text-white px-6 py-3 rounded-lg text-[14px] font-bold transition-all font-poppins mb-1"
    >
      Open Fund Comparison Tools →
    </Link>
  </div>
</div>

          <div dangerouslySetInnerHTML={sanitizeAndNormalizeHtml("<table" + parts[1])} />
        </div>
      );
    }

    return <div dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(htmlContent)} />;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Blog main body) */}
        <div className="lg:col-span-9 space-y-6">

          {/* Main Card */}
          <article className="">
            
            {/* Back link */}
            <Link
              href="/user/insights"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-[#0A1A3E] hover:text-[#0A4A87] transition-all mb-8 font-poppins"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to insights</span>
            </Link>
            
            {/* Category / Read time */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="border border-[#0A4A87] text-[#0A4A87] px-3.5 py-1.5 rounded-md text-[13px] font-semibold font-poppins">
                {article.topic?.title || topicTitle || "Debt Funds"}
              </span>
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#07112C] font-poppins">
                <Clock className="w-4 h-4 text-[#07112C]" />
                <span>{readTime} min read</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[24px] md:text-[30px] font-bold text-[#07112C] leading-snug md:leading-normal mb-4 font-poppins">
              {article.title}
            </h1>

            {/* Description (Subtitle) */}
            {article.description && (
              <p className="text-[16px] text-[#3D4E79] mb-6 font-poppins leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Author details & share icons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4  border-b border-[#EDF1F7] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#001D3A] text-white flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className="font-poppins flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] font-bold text-[#0F172A]">{article.author || "Team Money Now"}</span>
                    <span className="w-4 h-4 bg-[#0A4A87] rounded-full flex items-center justify-center text-white text-[9px] font-extrabold" title="Verified Author">✓</span>
                  </div>
                  <span className="text-[#7A88A7] text-[15px]">|</span>
                  <span className="text-[13px] font-medium text-[#7A88A7]">{publishDateStr}</span>
                </div>
              </div>

              {/* Share links */}
              <div className="flex items-center gap-2 font-poppins">
                <span className="text-[13px] font-bold text-[#6B7280] mr-1">Share:</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${canonicalUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full border border-[#DEE5F1] flex items-center justify-center text-[#4A5B83] hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] transition-all"
                >
                  <FaFacebookF className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${canonicalUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full border border-[#DEE5F1] flex items-center justify-center text-[#4A5B83] hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] transition-all"
                >
                  <FaTwitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${canonicalUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full border border-[#DEE5F1] flex items-center justify-center text-[#4A5B83] hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] transition-all"
                >
                  <FaLinkedinIn className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(canonicalUrl)}
                  className="w-8 h-8 rounded-full border border-[#DEE5F1] flex items-center justify-center text-[#4A5B83] hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] transition-all cursor-pointer"
                  title="Copy link"
                >
                  <FaLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Hero Image */}
            {heroImageSrc && (
              <div className="relative w-full rounded-xl overflow-hidden mb-6 aspect-[16/6] bg-[#F8FAFC] border border-[#EDF1F7]">
                <Image
                  src={heroImageSrc}
                  alt={article.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              </div>
            )}

            {/* Rich Content Area */}
            <div id="blog-article-content" className="user-blog-content font-inter">
              
              <style dangerouslySetInnerHTML={{ __html: `
                .user-blog-content ul {
                  list-style-type: none !important;
                  padding-left: 0 !important;
                  margin-top: 1rem;
                  margin-bottom: 1.5rem;
                }
                .user-blog-content ul li {
                  position: relative;
                  padding-left: 2.25rem !important;
                  margin-bottom: 0.875rem;
                  line-height: 1.8;
                  font-size: 16px;
                  color: #3D4E79;
                }
                .user-blog-content ul li::before {
                  content: "✓";
                  position: absolute;
                  left: 0;
                  top: 4px;
                  width: 20px;
                  height: 20px;
                  background-color: #0A4A87;
                  color: white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  font-weight: 900;
                }
                .user-blog-content ol {
                  list-style-type: none !important;
                  counter-reset: item;
                  padding-left: 0 !important;
                  margin-top: 1rem;
                  margin-bottom: 1.5rem;
                }
                .user-blog-content ol li {
                  position: relative;
                  padding-left: 2.25rem !important;
                  margin-bottom: 0.875rem;
                  counter-increment: item;
                  line-height: 1.8;
                  font-size: 16px;
                  color: #3D4E79;
                }
                .user-blog-content ol li::before {
                  content: counter(item);
                  position: absolute;
                  left: 0;
                  top: 4px;
                  width: 20px;
                  height: 20px;
                  background-color: #0A4A87;
                  color: white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  font-weight: 700;
                }
                .user-blog-content p {
                  font-size: 16px;
                  line-height: 1.8;
                  color: #3D4E79;
                  margin-bottom: 1.25rem;
                }
                .user-blog-content h2, .user-blog-content h3 {
                  font-size: 22px;
                  font-weight: 700;
                  color: #07112C;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                  font-family: var(--font-poppins);
                }
                .user-blog-content h4 {
                  font-size: 18px;
                  font-weight: 700;
                  color: #07112C;
                  margin-top: 1.75rem;
                  margin-bottom: 0.75rem;
                  font-family: var(--font-poppins);
                }
              ` }} />

              {/* Introduction */}
              {article.introduction && (
                <section id="introduction" className="scroll-mt-24">
                  {renderContentWithCTAs(article.introduction)}
                </section>
              )}

              {/* In This Article block */}
              {article.sections && article.sections.length > 0 && (
                <div className="border border-[#DEE5F1] rounded-xl p-5 md:p-6 bg-[#FCFDFF] my-6 font-poppins">
                  <h4 className="text-[17px] font-bold text-[#043F79] mb-4 !mt-0">In This Article</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {article.introduction && (
                      <button
                        onClick={() => document.getElementById("introduction")?.scrollIntoView({ behavior: "smooth" })}
                        className="bg-white hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] text-[#4A5B83] border border-[#DEE5F1] rounded-full px-4.5 py-2 text-[13.5px] font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        Introduction
                      </button>
                    )}
                    {article.sections?.map((sec, i) => sec.title?.trim() && (
                      <button
                        key={i}
                        onClick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth" })}
                        className="bg-white hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] text-[#4A5B83] border border-[#DEE5F1] rounded-full px-4.5 py-2 text-[13.5px] font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        {sec.title}
                      </button>
                    ))}
                    {article.faqs?.some(f => f.question?.trim() && f.answer?.trim()) && (
                      <button
                        onClick={() => document.getElementById("faqs")?.scrollIntoView({ behavior: "smooth" })}
                        className="bg-white hover:bg-[#F2F6FD] hover:text-[#0A4A87] hover:border-[#0A4A87] text-[#4A5B83] border border-[#DEE5F1] rounded-full px-4.5 py-2 text-[13.5px] font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        FAQs
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Sections */}
              {article.sections?.map((sec, i) => sec.content?.trim() && (
                <section id={`section-${i}`} key={i} className="scroll-mt-24 mt-8">
                  {sec.title && (
                    <h2 className="text-[22px] font-bold text-[#07112C] mb-4 font-poppins">
                      {sec.title}
                    </h2>
                  )}
                  {renderContentWithCTAs(sec.content)}
                </section>
              ))}

              {/* FAQs */}
              {article.faqs?.some(f => f.question?.trim() && f.answer?.trim()) && (
                <section id="faqs" className="scroll-mt-24 mt-12 border-t border-[#EDF1F7] pt-8">
                  <h2 className="text-[24px] font-bold text-[#07112C] mb-6 font-poppins">FAQs</h2>
                  {article.faqs.map((faq, i) => (
                    <div key={i} className="mb-6 bg-[#F8FAFC] p-5 rounded-xl border border-[#EDF1F7]">
                      <p className="font-bold text-[17px] text-[#07112C] mb-2 font-poppins">{faq.question}</p>
                      <div className="text-[15px] leading-relaxed text-[#3D4E79]" dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(faq.answer)} />
                    </div>
                  ))}
                </section>
              )}

            </div>
          </article>

          <RelatedTools />
          <RelatedArticles relatedArticles={relatedArticles} />

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
          
          {/* Reading Progress Card */}
          <div className="bg-white border border-[#E7ECF5] rounded-xl p-5 shadow-[0_4px_20px_rgba(7,17,44,0.03)] font-poppins">
            <h3 className="text-[16px] font-bold text-[#07112C] mb-4">Reading Progress</h3>
            
            <div className="flex items-center justify-between text-[14px] font-bold text-[#0A4A87] mb-2">
              <span>{scrollPercent}% Completed</span>
            </div>

            <div className="w-full bg-[#E7ECF5] h-2 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-[#0A4A87] h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${scrollPercent}%` }}
              />
            </div>

            <div className="text-[12px] text-[#7A88A7]">
              <span className="font-medium">Estimated read time:</span>
              <span className="font-bold text-[#07112C] ml-1">{readTime} min</span>
            </div>
          </div>

          {/* Go Premium Card */}
          {!isPremiumActive && (
            <div className="bg-white border border-[#E7ECF5] rounded-xl p-5 text-center shadow-[0_4px_20px_rgba(7,17,44,0.03)] font-poppins flex flex-col items-center">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center mb-4 bg-[#F2F6FD] rounded-full border border-[#DCE4F2]">
                <CrownIcon className="w-6 h-6 text-[#F59E0B]" />
              </div>
              
              <h3 className="text-[18px] font-bold text-[#07112C] mb-2">
                {isExpiredPremium ? "Renew Premium" : "Go Premium"}
              </h3>
              <p className="text-[13px] text-[#5E6B85] leading-relaxed mb-5">
                {isExpiredPremium 
                  ? "Your premium access has expired. Renew to regain access to insights and tools." 
                  : "Unlock exclusive research, expert insights and advanced tools."}
              </p>

              <Link 
                href="/user/dashboard/subscription" 
                className="w-full py-3 bg-[#0A4A87] hover:bg-[#083B6C] text-white rounded-[6px] text-[14px] font-bold transition-all inline-block text-center shadow-[0_2px_4px_rgba(10,74,135,0.1)]"
              >
                {isExpiredPremium ? "Renew Now" : "Upgrade Now"}
              </Link>
            </div>
          )}

          {/* Promotion Banner */}
          <div className="relative w-full rounded-xl overflow-hidden border border-[#E7ECF5] shadow-[0_4px_20px_rgba(7,17,44,0.03)] bg-white">
            <Image 
              src="/images/blog-listing-right-banner2.png" 
              alt="MoneyNow Mutual Funds Banner" 
              width={1200}
              height={620}
              className="w-full h-auto rounded"
              unoptimized
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserBlogDetailsClient;
