"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import DOMPurify from "dompurify";
import { normalizeRichTextHtml } from "@/utils/normalizeRichTextHtml";
import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import SeniorCitizen from "@/components/blog-details-Page/SeniorCitizen";
import PremiumUpgradeCard from "@/components/subscription/PremiumUpgradeCard";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";

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

type BlogDetailsClientProps = {
  article: Article | null;
  error?: string | null;
  topicTitle?: string;
  canonicalUrl: string;
};

const BlogDetailsClient = ({
  article,
  error,
  topicTitle = "",
  canonicalUrl,
}: BlogDetailsClientProps) => {
  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL;

  const [activeSection, setActiveSection] = useState<string>("introduction");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("section[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.4 },
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "#introduction, [id^='section-'], #faqs, #tools, #related-reads",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
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

    tempDiv.querySelectorAll("table").forEach((table) => {
      table.setAttribute(
        "style",
        [
          "width: 100%",
          "min-width: 640px",
          "border-collapse: collapse",
          "border: 1px solid #d8dee8",
          "margin: 1.5rem 0",
        ].join("; "),
      );
    });

    tempDiv.querySelectorAll("th").forEach((th) => {
      th.setAttribute(
        "style",
        [
          "border: 1px solid #d8dee8",
          "padding: 14px 16px",
          "text-align: left",
          "vertical-align: top",
          "background: #f4f7fb",
          "font-weight: 700",
        ].join("; "),
      );
    });

    tempDiv.querySelectorAll("td").forEach((td) => {
      td.setAttribute(
        "style",
        [
          "border: 1px solid #d8dee8",
          "padding: 14px 16px",
          "text-align: left",
          "vertical-align: top",
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
    const isPremiumLocked = error.toLowerCase().includes("premium");

    return (
      <div className="mx-auto max-w-5xl px-4 py-20">
        <p className="mb-6 text-center text-red-500">{error}</p>
        {isPremiumLocked && <PremiumUpgradeCard />}
      </div>
    );
  }

  if (!article) return <p className="py-20 text-center">Blog not found</p>;

  const heroImageSrc = article.hero_image
    ? `${IMAGE_BASE}/hero/${article.hero_image.replace(/^\/+/, "")}`
    : null;

  const richContentClass =
    "blog-rich-content font-inter w-full max-w-none text-gray-700 " +
    "[&_p]:mb-3 [&_p]:leading-[28px] " +
    "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 " +
    "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_li]:my-2 [&_li]:leading-[28px] " +
    "[&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800";

  const richContentLargeClass = `${richContentClass} [&_p]:!text-[18px]`;

  return (
    <>
      <section className="w-full bg-white py-10">
        <div className="max-w-full mx-auto px-4 md:px-6 pb-[30px] border-b border-[#E8E8E8]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {topicTitle && (
                <span className="text-[20px] font-inter font-semibold text-[#043F79]">
                  {topicTitle}
                </span>
              )}

              <p className="text-[22px] md:text-[32px] font-poppins font-semibold leading-[44px] mt-[10px] mb-[10px]">
                {article.title}
              </p>

              {article.introduction && (
                <div
                  className="
                    blog-rich-content
                    font-inter
                    line-clamp-5
                    [&_p]:!text-[16px]
                    [&_p]:!leading-[30px]
                    [&_p]:mb-3
                    [&_ul]:my-3
                    [&_ul]:list-disc
                    [&_ul]:pl-6
                    [&_ol]:my-3
                    [&_ol]:list-decimal
                    [&_ol]:pl-6
                    [&_li]:my-1.5
                  "
                  dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
                    article.introduction,
                  )}
                />
              )}

              <div className="flex items-center gap-3 mb-3 mt-6">
                <span className="text-[15px] font-inter">Share:</span>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${canonicalUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaFacebookF />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${canonicalUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaTwitter />
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${canonicalUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaLinkedinIn />
                </a>

                <a
                  href={`https://wa.me/?text=${canonicalUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaWhatsapp />
                </a>
              </div>

              <p className="text-[16px] font-inter font-medium">
                {article.author || "Team Money Now"} |{" "}
                {(article.publish_date || article.created_at) &&
                  new Date(
                    article.publish_date || article.created_at || "",
                  ).toLocaleDateString("en-GB")}
              </p>
            </div>

            {heroImageSrc && (
              <div className="relative w-full rounded-lg overflow-hidden flex items-center justify-center">
                <Image
                  src={heroImageSrc}
                  alt={article.title}
                  width={1200}
                  height={450}
                  className="w-full h-auto rounded"
                  unoptimized
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="w-full font-poppins">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-[50px]">
            <aside className="lg:col-span-3 mb-6 lg:mb-0">
              <div className="sticky top-6 lg:top-24 lg:border-r lg:pr-3 border-[#E8E8E8]">
                <h3 className="text-[20px] font-inter text-[#043F79] font-bold mb-4">
                  Table Of Content
                </h3>

                <ul className="text-[16px] sm:text-[18px] font-medium font-poppins border-t border-b border-[#E8E8E8] divide-y divide-[#E8E8E8]">
                  {article.introduction?.trim() && (
                    <li className="py-3">
                      <a
                        href="#introduction"
                        className={`block transition-colors ${
                          activeSection === "introduction"
                            ? "text-[#043F79] font-bold"
                            : "hover:text-[#043F79]"
                        }`}
                      >
                        Introduction
                      </a>
                    </li>
                  )}

                  {article.sections?.map(
                    (sec, i) =>
                      sec.title?.trim() && (
                        <li key={i} className="py-3">
                          <a
                            href={`#section-${i}`}
                            className={`block transition-colors ${
                              activeSection === `section-${i}`
                                ? "text-[#043F79] font-bold"
                                : "hover:text-[#043F79]"
                            }`}
                          >
                            {sec.title}
                          </a>
                        </li>
                      ),
                  )}

                  {article.faqs?.some(
                    (f) => f.question?.trim() && f.answer?.trim(),
                  ) && (
                    <li className="py-3">
                      <a
                        href="#faqs"
                        className={`block ${activeSection === "faqs" ? "text-[#043F79] font-bold" : "hover:text-[#043F79]"}`}
                      >
                        FAQs
                      </a>
                    </li>
                  )}

                  {article.tools?.some(
                    (tool) => tool.title?.trim() || tool.content?.trim(),
                  ) && (
                    <li className="py-3">
                      <a
                        href="#tools"
                        className={`block ${activeSection === "tools" ? "text-[#043F79] font-bold" : "hover:text-[#043F79]"}`}
                      >
                        Tools
                      </a>
                    </li>
                  )}

                  {article.related_reads?.some(
                    (read) => read.title?.trim() || read.content?.trim(),
                  ) && (
                    <li className="py-3">
                      <a
                        href="#related-reads"
                        className={`block ${activeSection === "related-reads" ? "text-[#043F79] font-bold" : "hover:text-[#043F79]"}`}
                      >
                        Related Reads
                      </a>
                    </li>
                  )}
                </ul>

                <div className="relative w-full rounded mt-6 mb-5">
                  <Image
                    src="/images/blog-listing-right-banner2.png"
                    alt="Banner"
                    width={1200}
                    height={620}
                    className="w-full h-auto rounded"
                  />
                </div>
                <MostPopularBlogs />
              </div>
            </aside>

            <main className="lg:col-span-9 space-y-6 w-full">
              {article.introduction && (
                <section
                  id="introduction"
                  className="space-y-4 w-full scroll-mt-[90px]"
                >
                  <h2
                    className={`text-[22px] leading-[32px] font-poppins font-semibold ${
                      activeSection === "introduction"
                        ? "text-[#043F79]"
                        : "text-black"
                    }`}
                  >
                    Introduction
                  </h2>
                  <div
                    className={`${richContentClass} [&_p]:!text-[16px]`}
                    dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
                      article.introduction,
                    )}
                  />
                </section>
              )}

              {article.sections?.map(
                (sec, i) =>
                  sec.content?.trim() && (
                    <section
                      id={`section-${i}`}
                      key={i}
                      className="space-y-4 w-full scroll-mt-[90px]"
                    >
                      {sec.title && (
                        <h2
                          className={`text-[22px] leading-[32px] font-poppins font-semibold ${
                            activeSection === `section-${i}`
                              ? "text-[#043F79]"
                              : "text-black"
                          }`}
                        >
                          {sec.title}
                        </h2>
                      )}
                      <div
                        className={`${richContentClass} [&_p]:!text-[16px]`}
                        dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
                          sec.content,
                        )}
                      />
                    </section>
                  ),
              )}

              {article.faqs?.some(
                (f) => f.question?.trim() && f.answer?.trim(),
              ) && (
                <section id="faqs" className="space-y-4 w-full scroll-mt-[90px]">
                  <h2 className="text-[22px] font-semibold">FAQs</h2>
                  {article.faqs.map((faq, i) => (
                    <div key={i} className="mb-4">
                      <p className="font-semibold text-[18px]">{faq.question}</p>
                      <div
                        className={richContentLargeClass}
                        dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
                          faq.answer,
                        )}
                      />
                    </div>
                  ))}
                </section>
              )}

              {article.tools?.some(
                (tool) => tool.title?.trim() || tool.content?.trim(),
              ) && (
                <section id="tools" className="space-y-4 w-full scroll-mt-[90px]">
                  <h2 className="text-[22px] font-semibold">Tools</h2>
                  {article.tools?.map((tool, i) => (
                    <div key={i} className="mb-4">
                      {tool.title?.trim() && (
                        <p className="font-semibold text-[18px]">{tool.title}</p>
                      )}
                      {tool.content?.trim() && (
                        <div
                          className={richContentLargeClass}
                          dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
                            tool.content,
                          )}
                        />
                      )}
                    </div>
                  ))}
                </section>
              )}

              {article.related_reads?.some(
                (read) => read.title?.trim() || read.content?.trim(),
              ) && (
                <section
                  id="related-reads"
                  className="space-y-4 w-full scroll-mt-[90px]"
                >
                  <h2 className="text-[22px] font-semibold">Related Reads</h2>
                  {article.related_reads?.map((read, i) => (
                    <div key={i} className="mb-4">
                      {read.title?.trim() && (
                        <p className="font-semibold text-[18px]">{read.title}</p>
                      )}
                      {read.content?.trim() && (
                        <div
                          className={richContentLargeClass}
                          dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
                            read.content,
                          )}
                        />
                      )}
                    </div>
                  ))}
                </section>
              )}
            </main>
          </div>

          <div className="relative pb-[30px]">
            <SeniorCitizen />
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogDetailsClient;





