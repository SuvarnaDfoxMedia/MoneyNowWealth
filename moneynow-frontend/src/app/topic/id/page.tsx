"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import DOMPurify from "dompurify";
import { useParams } from "next/navigation";

import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import SeniorCitizen from "@/components/Blog-details-Page/SeniorCitizen";

import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";

/* ================= TYPES ================= */
interface Section {
  title?: string;
  content?: string;
}
interface Faq {
  question: string;
  answer?: string;
}
interface Tool {
  title: string;
  content?: string;
}
interface RelatedRead {
  title: string;
  content?: string;
}
interface Article {
  title: string;
  author?: string;
  image?: string;
  introduction?: string;
  sections?: Section[];
  faqs?: Faq[];
  tools?: Tool[];
  related_reads?: RelatedRead[];
  created_at?: string;
}
interface ApiResponse {
  topic?: { title?: string };
  articles?: Article[];
}

/* ================= COMPONENT ================= */
const BlogDetails = () => {
  const params = useParams();
  const topicId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!topicId) return;

    const fetchBlog = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/topic/published/${topicId}`,
          { cache: "no-store" }
        );
        const json: ApiResponse = await res.json();

        setTopicTitle(json?.topic?.title || "");
        setArticle(json?.articles?.[0] || null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [topicId]);

  const sanitize = (html?: string) => ({
    __html: DOMPurify.sanitize(html || ""),
  });

  if (loading)
    return <p className="py-20 text-center">Loading blog...</p>;

  if (!article)
    return <p className="py-20 text-center">Blog not found</p>;

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="w-full bg-white py-10">
        <div className="max-w-full mx-auto px-4 md:px-6 pb-8 border-b border-[#E8E8E8]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <span className="text-[20px] font-inter font-semibold text-[#043F79]">
                {topicTitle}
              </span>

              <h1 className="text-[22px] md:text-[32px] font-poppins font-semibold leading-[44px] mt-2 mb-4">
                {article.title}
              </h1>

              {article.introduction && (
                <div
                  className="font-inter text-gray-600 [&_p]:text-[20px] [&_p]:leading-[32px] [&_p]:mb-4"
                  dangerouslySetInnerHTML={sanitize(article.introduction)}
                />
              )}

              <div className="flex items-center gap-3 mb-6">
                <span className="text-[15px] font-inter">Share:</span>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-black border-dashed"
                >
                  <FaFacebookF />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-black border-dashed"
                >
                  <FaTwitter />
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-black border-dashed"
                >
                  <FaLinkedinIn />
                </a>

                <a
                  href={`https://wa.me/?text=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-black border-dashed"
                >
                  <FaWhatsapp />
                </a>
              </div>

              <p className="text-[16px] font-inter">
                {article.author || "Team Money Now"} |{" "}
                {article.created_at &&
                  new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] rounded-lg overflow-hidden">
              <Image
                src={article.image || "/images/blog-details-page-img.png"}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENT ================= */}
      <section className="w-full font-poppins mb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <aside className="lg:col-span-4">
              <div className="sticky top-24 pr-6 border-r border-[#E8E8E8]">
                <h3 className="text-[20px] font-inter font-bold text-[#043F79] mb-4">
                  Table Of Content
                </h3>

                <ul className="border-t border-b divide-y">
                  {article.sections?.map(
                    (sec, i) =>
                      sec.title && (
                        <li key={i} className="py-3">
                          <a href={`#section-${i}`}>{sec.title}</a>
                        </li>
                      )
                  )}
                  {article.faqs?.length && (
                    <li className="py-3">
                      <a href="#faqs">FAQs</a>
                    </li>
                  )}
                  {article.tools?.length && (
                    <li className="py-3">
                      <a href="#tools">Tools</a>
                    </li>
                  )}
                  {article.related_reads?.length && (
                    <li className="py-3">
                      <a href="#related-reads">Related Reads</a>
                    </li>
                  )}
                </ul>

                <MostPopularBlogs />
              </div>
            </aside>

            <main className="lg:col-span-8 space-y-8">
              {article.sections?.map(
                (sec, i) =>
                  sec.content && (
                    <section id={`section-${i}`} key={i}>
                      {sec.title && (
                        <h2 className="text-[22px] font-semibold mb-3">
                          {sec.title}
                        </h2>
                      )}
                      <div dangerouslySetInnerHTML={sanitize(sec.content)} />
                    </section>
                  )
              )}

              {article.faqs && (
                <section id="faqs">
                  <h2 className="text-[22px] font-semibold mb-4">FAQs</h2>
                  {article.faqs.map((faq, i) => (
                    <div key={i}>
                      <p className="font-semibold">{faq.question}</p>
                      <div dangerouslySetInnerHTML={sanitize(faq.answer)} />
                    </div>
                  ))}
                </section>
              )}

              {article.tools && (
                <section id="tools">
                  <h2 className="text-[22px] font-semibold mb-4">Tools</h2>
                  {article.tools.map((tool, i) => (
                    <div key={i}>
                      <p className="font-semibold">{tool.title}</p>
                      <div dangerouslySetInnerHTML={sanitize(tool.content)} />
                    </div>
                  ))}
                </section>
              )}

              {article.related_reads && (
                <section id="related-reads">
                  <h2 className="text-[22px] font-semibold mb-4">
                    Related Reads
                  </h2>
                  {article.related_reads.map((read, i) => (
                    <div key={i}>
                      <p className="font-semibold">{read.title}</p>
                      <div dangerouslySetInnerHTML={sanitize(read.content)} />
                    </div>
                  ))}
                </section>
              )}
            </main>
          </div>

          <SeniorCitizen />
        </div>
      </section>
    </>
  );
};

export default BlogDetails;
