// "use client";

// import React, { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import Image from "next/image";
// import DOMPurify from "dompurify";
// import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
// import SeniorCitizen from "@/components/blog-details-Page/SeniorCitizen";
// import {
//   FaFacebookF,
//   FaTwitter,
//   FaLinkedinIn,
//   FaWhatsapp,
// } from "react-icons/fa";

// /* ================= TYPES ================= */
// interface Section {
//   title?: string;
//   content?: string;
// }
// interface Faq {
//   question: string;
//   answer?: string;
// }
// interface Tool {
//   title?: string;
//   content?: string;
// }
// interface RelatedRead {
//   title?: string;
//   content?: string;
// }
// interface Article {
//   title: string;
//   description?: string;
//   author?: string;
//   hero_image?: string;
//   introduction?: string;
//   sections?: Section[];
//   faqs?: Faq[];
//   tools?: Tool[];
//   related_reads?: RelatedRead[];
//   created_at?: string;
//   published_at?: string;
// }
// interface ApiResponse {
//   topic?: { title?: string };
//   articles?: Article[];
// }

// /* ================= COMPONENT ================= */
// const BlogDetails = () => {
//   const params = useParams();
//   const slug = params?.slug;

//   const [article, setArticle] = useState<Article | null>(null);
//   const [topicTitle, setTopicTitle] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const pageUrl = typeof window !== "undefined" ? window.location.href : "";

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
//   const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL;

//   const [activeSection, setActiveSection] = useState<string>("introduction"); // default active

//   useEffect(() => {
//     const sections = document.querySelectorAll<HTMLElement>("section[id]");

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             setActiveSection(entry.target.id);
//           }
//         });
//       },
//       { root: null, rootMargin: "0px", threshold: 0.4 },
//     );

//     sections.forEach((sec) => observer.observe(sec));

//     return () => {
//       sections.forEach((sec) => observer.unobserve(sec));
//     };
//   }, []);

//   useEffect(() => {
//     const sections = document.querySelectorAll<HTMLElement>(
//       "#introduction, [id^='section-'], #faqs, #tools, #related-reads",
//     );

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             setActiveSection(entry.target.id);
//           }
//         });
//       },
//       { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
//     );

//     sections.forEach((section) => observer.observe(section));

//     return () => {
//       sections.forEach((section) => observer.unobserve(section));
//     };
//   }, [article]);

//   /* ================= FETCH BLOG ================= */
//   useEffect(() => {
//     if (!slug) return;

//     const fetchBlog = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch(
//           `${API_BASE}/api/topic/published/slug/${encodeURIComponent(slug)}`,
//         );
//         if (!res.ok) throw new Error("Failed to fetch blog");
//         const json: ApiResponse = await res.json();
//         if (!json.articles || json.articles.length === 0) {
//           setError("Blog not found");
//           setArticle(null);
//           setTopicTitle("");
//           return;
//         }
//         setTopicTitle(json.topic?.title || "");
//         // setArticle(json.articles[0]);
//         setArticle({
//           ...json.articles[0],
//           published_at: json.topic?.publish_date,
//         });
//       } catch (err: any) {
//         console.error(err);
//         setError("Something went wrong");
//         setArticle(null);
//         setTopicTitle("");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBlog();
//   }, [slug, API_BASE]);

//   const sanitize = (html?: string) => ({
//     __html: DOMPurify.sanitize(html || ""),
//   });

//   if (loading) return <p className="py-20 text-center">Loading blog...</p>;
//   if (error) return <p className="py-20 text-center text-red-500">{error}</p>;
//   if (!article) return <p className="py-20 text-center">Blog not found</p>;

//   const heroImageSrc = article.hero_image
//     ? `${IMAGE_BASE}/hero/${article.hero_image.replace(/^\/+/, "")}`
//     : null;

//   return (
//     <>
//       {/* ================= HERO ================= */}
//       <section className="w-full bg-white py-10">
//         <div className="max-w-full mx-auto px-4 md:px-6 pb-[30px] border-b border-[#E8E8E8]">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* LEFT */}
//             <div>
//               {topicTitle && (
//                 <span className="text-[20px] font-inter font-semibold text-[#043F79]">
//                   {topicTitle}
//                 </span>
//               )}
//               <p className="text-[22px] md:text-[32px] font-poppins font-semibold leading-[44px] mt-[10px] mb-[10px]">
//                 {article.title}
//               </p>

//               {article.introduction && (
//                 <div
//                   className="
//       font-inter
//       line-clamp-5
//       [&_p]:!text-[19px]
//       [&_p]:!leading-[30px]
//       [&_p]:mb-3
//     "
//                   dangerouslySetInnerHTML={sanitize(article.introduction)}
//                 />
//               )}

//               {/* SHARE */}
//               <div className="flex items-center gap-3 mb-3 mt-6">
//                 <span className="text-[15px] font-inter">Share:</span>
//                 <a
//                   href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
//                   target="_blank"
//                   className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
//                 >
//                   <FaFacebookF />
//                 </a>
//                 <a
//                   href={`https://twitter.com/intent/tweet?url=${pageUrl}`}
//                   target="_blank"
//                   className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
//                 >
//                   <FaTwitter />
//                 </a>
//                 <a
//                   href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`}
//                   target="_blank"
//                   className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
//                 >
//                   <FaLinkedinIn />
//                 </a>
//                 <a
//                   href={`https://wa.me/?text=${pageUrl}`}
//                   target="_blank"
//                   className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
//                 >
//                   <FaWhatsapp />
//                 </a>
//               </div>
//               {/* <p className="text-[16px] font-inter font-medium">{article.author || "Team Money Now"} | {article.created_at && new Date(article.created_at).toLocaleDateString("en-GB")}</p> */}
//               <p className="text-[16px] font-inter font-medium">
//                 {article.author || "Team Money Now"} |{" "}
//                 {article.published_at &&
//                   new Date(article.published_at).toLocaleDateString("en-GB")}
//               </p>
//             </div>

//             {heroImageSrc && (
//               <div className="relative w-full rounded-lg overflow-hidden flex items-center justify-center">
//                 <Image
//                   src={heroImageSrc}
//                   alt={article.title}
//                   width={1200}
//                   height={450}
//                   className="w-full h-auto rounded"
//                   unoptimized
//                   priority
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       </section>

//       {/* ================= CONTENT ================= */}
//       <section className="w-full font-poppins mb-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6">
//           {/* MAIN GRID */}
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-[35px]">
//             {/* LEFT – TOC */}
//             <aside className="lg:col-span-4 mb-6 lg:mb-0">
//               <div className="sticky top-6 lg:top-24 border-r pr-0 lg:pr-6 border-[#E8E8E8]">
//                 <h3 className="text-[20px] font-inter text-[#043F79] font-bold mb-4">
//                   Table Of Content
//                 </h3>

//                 <ul className="text-[16px] sm:text-[18px] font-medium font-poppins border-t border-b border-[#E8E8E8] divide-y divide-[#E8E8E8]">
//                   {article.introduction?.trim() && (
//                     <li className="py-3">
//                       <a
//                         href="#introduction"
//                         className={`block ${
//                           activeSection === "introduction"
//                             ? "text-[#043F79] font-bold"
//                             : "hover:text-[#043F79]"
//                         }`}
//                       >
//                         Introduction
//                       </a>
//                     </li>
//                   )}

//                   {article.sections?.map(
//                     (sec, i) =>
//                       sec.title?.trim() && (
//                         <li key={i} className="py-3">
//                           <a
//                             href={`#section-${i}`}
//                             className={`block ${
//                               activeSection === `section-${i}`
//                                 ? "text-[#043F79] font-bold"
//                                 : "hover:text-[#043F79]"
//                             }`}
//                           >
//                             {sec.title}
//                           </a>
//                         </li>
//                       ),
//                   )}

//                   {article.faqs?.some(
//                     (f) => f.question?.trim() && f.answer?.trim(),
//                   ) && (
//                     <li className="py-3">
//                       <a
//                         href="#faqs"
//                         className={`block ${
//                           activeSection === "faqs"
//                             ? "text-[#043F79] font-bold"
//                             : "hover:text-[#043F79]"
//                         }`}
//                       >
//                         FAQs
//                       </a>
//                     </li>
//                   )}

//                   {article.tools?.some(
//                     (t) => t.title?.trim() && t.content?.trim(),
//                   ) && (
//                     <li className="py-3">
//                       <a
//                         href="#tools"
//                         className={`block ${
//                           activeSection === "tools"
//                             ? "text-[#043F79] font-bold"
//                             : "hover:text-[#043F79]"
//                         }`}
//                       >
//                         Tools
//                       </a>
//                     </li>
//                   )}

//                   {article.related_reads?.some(
//                     (r) => r.title?.trim() && r.content?.trim(),
//                   ) && (
//                     <li className="py-3">
//                       <a
//                         href="#related-reads"
//                         className={`block ${
//                           activeSection === "related-reads"
//                             ? "text-[#043F79] font-bold"
//                             : "hover:text-[#043F79]"
//                         }`}
//                       >
//                         Related Reads
//                       </a>
//                     </li>
//                   )}
//                 </ul>

//                 <div className="relative w-full rounded mt-6 mb-5">
//                   <Image
//                     src="/images/blog-listing-right-banner2.png"
//                     alt="Banner"
//                     width={1200}
//                     height={620}
//                     className="w-full h-auto rounded"
//                   />
//                 </div>

//                 <MostPopularBlogs />
//               </div>
//             </aside>

//             {/* RIGHT – ARTICLE */}
//             <main className="lg:col-span-8 space-y-6">
//               {/* Introduction */}
//               {article.introduction && (
//                 <section id="introduction" className="space-y-4">
//                   <h2
//                     className={`text-[22px] leading-[32px] font-poppins font-semibold ${
//                       activeSection === "introduction"
//                         ? "text-[#043F79]"
//                         : "text-black"
//                     }`}
//                   >
//                     Introduction
//                   </h2>
//                   <div
//                     className="font-inter [&_p]:!text-[19px] [&_p]:!leading-[28px]"
//                     dangerouslySetInnerHTML={sanitize(article.introduction)}
//                   />
//                 </section>
//               )}

//               {/* Sections */}
//               {article.sections?.map(
//                 (sec, i) =>
//                   sec.content?.trim() && (
//                     <section id={`section-${i}`} key={i} className="space-y-4">
//                       {sec.title && (
//                         <h2
//                           className={`text-[22px] leading-[32px] font-poppins font-semibold ${
//                             activeSection === `section-${i}`
//                               ? "text-[#043F79]"
//                               : "text-black"
//                           }`}
//                         >
//                           {sec.title}
//                         </h2>
//                       )}
//                       <div
//                         className="font-inter [&_p]:!text-[19px] [&_p]:!leading-[28px]"
//                         dangerouslySetInnerHTML={sanitize(sec.content)}
//                       />
//                     </section>
//                   ),
//               )}

//               {/* FAQs */}
//               {article.faqs?.some(
//                 (f) => f.question?.trim() && f.answer?.trim(),
//               ) && (
//                 <section id="faqs" className="space-y-4">
//                   <h2 className="text-[22px] font-semibold">FAQs</h2>
//                   {article.faqs.map(
//                     (faq, i) =>
//                       faq.question?.trim() &&
//                       faq.answer?.trim() && (
//                         <div key={i}>
//                           <p className="font-semibold text-[18px]">
//                             {faq.question}
//                           </p>
//                           <div
//                             className="font-inter [&_p]:!text-[18px]"
//                             dangerouslySetInnerHTML={sanitize(faq.answer)}
//                           />
//                         </div>
//                       ),
//                   )}
//                 </section>
//               )}
//             </main>
//           </div>

//           <SeniorCitizen />
//         </div>
//       </section>
//     </>
//   );
// };

// export default BlogDetails;

"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import DOMPurify from "dompurify";
import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import SeniorCitizen from "@/components/blog-details-Page/SeniorCitizen";
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
  title?: string;
  content?: string;
}
interface RelatedRead {
  title?: string;
  content?: string;
}
interface Article {
  title: string;
  description?: string;
  author?: string;
  hero_image?: string;
  introduction?: string;
  sections?: Section[];
  faqs?: Faq[];
  tools?: Tool[];
  related_reads?: RelatedRead[];
  created_at?: string;
  published_at?: string;
}
interface ApiResponse {
  topic?: { title?: string; publish_date?: string };
  articles?: Article[];
}

/* ================= COMPONENT ================= */
const BlogDetails = () => {
  const params = useParams();
  const slug = params?.slug;

  const [article, setArticle] = useState<Article | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL;

  const [activeSection, setActiveSection] = useState<string>("introduction"); // default active

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

  /* ================= FETCH BLOG ================= */
  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/topic/published/slug/${encodeURIComponent(String(slug))}`,
        );
        if (!res.ok) throw new Error("Failed to fetch blog");
        const json: ApiResponse = await res.json();

        if (!json.articles || json.articles.length === 0) {
          setError("Blog not found");
          setArticle(null);
          setTopicTitle("");
          return;
        }

        setTopicTitle(json.topic?.title || "");

        setArticle({
          ...json.articles[0],
          published_at: json.topic?.publish_date,
        });
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong");
        setArticle(null);
        setTopicTitle("");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, API_BASE]);

  const sanitize = (html?: string) => ({
    __html: DOMPurify.sanitize(html || ""),
  });

  if (loading) return <p className="py-20 text-center">Loading blog...</p>;
  if (error) return <p className="py-20 text-center text-red-500">{error}</p>;
  if (!article) return <p className="py-20 text-center">Blog not found</p>;

  const heroImageSrc = article.hero_image
    ? `${IMAGE_BASE}/hero/${article.hero_image.replace(/^\/+/, "")}`
    : null;

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="w-full bg-white py-10">
        <div className="max-w-full mx-auto px-4 md:px-6 pb-[30px] border-b border-[#E8E8E8]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT */}
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
                    font-inter
                    line-clamp-5
                    [&_p]:!text-[19px]
                    [&_p]:!leading-[30px]
                    [&_p]:mb-3
                  "
                  dangerouslySetInnerHTML={sanitize(article.introduction)}
                />
              )}

              {/* SHARE */}
              <div className="flex items-center gap-3 mb-3 mt-6">
                <span className="text-[15px] font-inter">Share:</span>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaFacebookF />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaTwitter />
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaLinkedinIn />
                </a>

                <a
                  href={`https://wa.me/?text=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"
                  rel="noreferrer"
                >
                  <FaWhatsapp />
                </a>
              </div>

              <p className="text-[16px] font-inter font-medium">
                {article.author || "Team Money Now"} |{" "}
                {article.published_at &&
                  new Date(article.published_at).toLocaleDateString("en-GB")}
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

      {/* ================= CONTENT ================= */}
      <section className="w-full font-poppins mb-10">
        {/*  Wider container so TOC doesn’t look shifted */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-[35px]">
            {/* LEFT – TOC */}
            <aside className="lg:col-span-3 mb-6 lg:mb-0">
              {/*  Reduced right padding to avoid TOC shifting */}
              <div className="sticky top-6 lg:top-24 lg:border-r lg:pr-3 border-[#E8E8E8]">
                <h3 className="text-[20px] font-inter text-[#043F79] font-bold mb-4">
                  Table Of Content
                </h3>

                <ul className="text-[16px] sm:text-[18px] font-medium font-poppins border-t border-b border-[#E8E8E8] divide-y divide-[#E8E8E8]">
                  {article.introduction?.trim() && (
                    <li className="py-3">
                      <a
                        href="#introduction"
                        className={`block ${
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
                            className={`block ${
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
                        className={`block ${
                          activeSection === "faqs"
                            ? "text-[#043F79] font-bold"
                            : "hover:text-[#043F79]"
                        }`}
                      >
                        FAQs
                      </a>
                    </li>
                  )}

                  {article.tools?.some(
                    (t) => t.title?.trim() && t.content?.trim(),
                  ) && (
                    <li className="py-3">
                      <a
                        href="#tools"
                        className={`block ${
                          activeSection === "tools"
                            ? "text-[#043F79] font-bold"
                            : "hover:text-[#043F79]"
                        }`}
                      >
                        Tools
                      </a>
                    </li>
                  )}

                  {article.related_reads?.some(
                    (r) => r.title?.trim() && r.content?.trim(),
                  ) && (
                    <li className="py-3">
                      <a
                        href="#related-reads"
                        className={`block ${
                          activeSection === "related-reads"
                            ? "text-[#043F79] font-bold"
                            : "hover:text-[#043F79]"
                        }`}
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

            {/* RIGHT – ARTICLE */}
            <main className="lg:col-span-9 space-y-6 w-full">
              {/* Introduction */}
              {article.introduction && (
                <section id="introduction" className="space-y-4 w-full">
                  <h2
                    className={`text-[22px] leading-[32px] font-poppins font-semibold ${
                      activeSection === "introduction"
                        ? "text-[#043F79]"
                        : "text-black"
                    }`}
                  >
                    Introduction
                  </h2>

                  {/*  Force full width */}
                  <div
                    className="font-inter w-full max-w-none [&_p]:!text-[19px] [&_p]:!leading-[28px]"
                    dangerouslySetInnerHTML={sanitize(article.introduction)}
                  />
                </section>
              )}

              {/* Sections */}
              {article.sections?.map(
                (sec, i) =>
                  sec.content?.trim() && (
                    <section
                      id={`section-${i}`}
                      key={i}
                      className="space-y-4 w-full"
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
                        className="font-inter w-full max-w-none [&_p]:!text-[19px] [&_p]:!leading-[28px]"
                        dangerouslySetInnerHTML={sanitize(sec.content)}
                      />
                    </section>
                  ),
              )}

              {/* FAQs */}
              {article.faqs?.some(
                (f) => f.question?.trim() && f.answer?.trim(),
              ) && (
                <section id="faqs" className="space-y-4 w-full">
                  <h2 className="text-[22px] font-semibold">FAQs</h2>

                  {article.faqs.map(
                    (faq, i) =>
                      faq.question?.trim() &&
                      faq.answer?.trim() && (
                        <div key={i}>
                          <p className="font-semibold text-[18px]">
                            {faq.question}
                          </p>

                          <div
                            className="font-inter w-full max-w-none [&_p]:!text-[18px]"
                            dangerouslySetInnerHTML={sanitize(faq.answer)}
                          />
                        </div>
                      ),
                  )}
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

