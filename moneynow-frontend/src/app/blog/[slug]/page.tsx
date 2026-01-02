// "use client";

// import React, { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import Image from "next/image";
// import DOMPurify from "dompurify";
// import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
// import SeniorCitizen from "@/components/Blog-details-Page/SeniorCitizen";
// import {
//   FaFacebookF,
//   FaTwitter,
//   FaLinkedinIn,
//   FaWhatsapp,
// } from "react-icons/fa";

// /* ================= TYPES ================= */
// interface Section { title?: string; content?: string; }
// interface Faq { question: string; answer?: string; }
// interface Tool { title: string; content?: string; }
// interface RelatedRead { title: string; content?: string; }
// interface Article {
//   title: string;
//   description?: string;
//   author?: string;
//   image?: string;
//   introduction?: string;
//   sections?: Section[];
//   faqs?: Faq[];
//   tools?: Tool[];
//   related_reads?: RelatedRead[];
//   created_at?: string;
// }
// interface ApiResponse { topic?: { title?: string }; articles?: Article[]; }

// /* ================= COMPONENT ================= */
// const BlogDetails = () => {
//   const params = useParams();
//   const slug = params?.slug;

//   const [article, setArticle] = useState<Article | null>(null);
//   const [topicTitle, setTopicTitle] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const pageUrl = typeof window !== "undefined" ? window.location.href : "";

//   /* ================= FETCH BLOG ================= */
//   useEffect(() => {
//     if (!slug) return;

//     const fetchBlog = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch(
//           `http://localhost:5000/api/topic/published/slug/${encodeURIComponent(slug)}`
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
//         setArticle(json.articles[0]);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message || "Something went wrong");
//         setArticle(null);
//         setTopicTitle("");
//       } finally { setLoading(false); }
//     };

//     fetchBlog();
//   }, [slug]);

//   const sanitize = (html?: string) => ({ __html: DOMPurify.sanitize(html || "") });

//   if (loading) return <p className="py-20 text-center">Loading blog...</p>;
//   if (error) return <p className="py-20 text-center text-red-500">{error}</p>;
//   if (!article) return <p className="py-20 text-center">Blog not found</p>;

//   return (
//     <>
//       {/* ================= HERO ================= */}
//       <section className="w-full bg-white py-10">
//         <div className="max-w-full mx-auto px-4 md:px-6 pb-[30px] border-b border-[#E8E8E8]">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* LEFT */}
//             <div>
//               {topicTitle && (
//                 <span className="text-[20px] font-inter font-semibold text-[#043F79]">{topicTitle}</span>
//               )}
//               <h1 className="text-[22px] md:text-[32px] font-poppins font-semibold leading-[44px] mt-[10px] mb-[20px]">{article.title}</h1>
//               {article.introduction && (
//                 <div
//                   className="text-gray-600 mb-6 font-inter [&_p]:!text-[20px] [&_p]:!leading-[32px] [&_p]:mb-4"
//                   dangerouslySetInnerHTML={sanitize(article.introduction)}
//                 />
//               )}
//               {/* SHARE */}
//               <div className="flex items-center gap-3 mb-6">
//                 <span className="text-[15px] font-inter">Share:</span>
//                 <a href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaFacebookF /></a>
//                 <a href={`https://twitter.com/intent/tweet?url=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaTwitter /></a>
//                 <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaLinkedinIn /></a>
//                 <a href={`https://wa.me/?text=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaWhatsapp /></a>
//               </div>
//               <p className="text-[16px] font-inter font-medium">{article.author || "Team Money Now"} | {article.created_at && new Date(article.created_at).toLocaleDateString()}</p>
//             </div>
//             {/* RIGHT IMAGE */}
//             <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] lg:h-[430px] rounded-lg overflow-hidden">
//               <Image src={article.image || "/images/blog-details-page-img.png"} alt={article.title} fill className="object-cover" priority />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ================= CONTENT ================= */}
//       <section className="w-full font-poppins mb-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6">
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//             {/* LEFT – TOC */}
//             <aside className="lg:col-span-4 mb-6 lg:mb-0">
//               <div className="sticky top-6 lg:top-24 border-r lg:border-r pr-0 lg:pr-6 border-[#E8E8E8]">
//                 <h3 className="text-[20px] font-inter text-[#043F79] font-bold mb-4">Table Of Content</h3>
//                 <ul className="text-[16px] sm:text-[18px] font-medium font-poppins border-t border-b border-[#E8E8E8] divide-y divide-[#E8E8E8]">
//                   {article.sections?.map((sec, i) => sec.title?.trim() ? <li key={i} className="py-3 last:border-b-0"><a href={`#section-${i}`} className="block hover:text-[#043F79]">{sec.title}</a></li> : null)}
//                   {article.faqs?.some(f => f.question?.trim() && f.answer?.trim()) && <li className="py-3"><a href="#faqs" className="block hover:text-[#043F79]">FAQs</a></li>}
//                   {article.tools?.some(t => t.title?.trim() && t.content?.trim()) && <li className="py-3"><a href="#tools" className="block hover:text-[#043F79]">Tools</a></li>}
//                   {article.related_reads?.some(r => r.title?.trim() && r.content?.trim()) && <li className="py-3"><a href="#related-reads" className="block hover:text-[#043F79]">Related Reads</a></li>}
//                 </ul>
//                 <div className="relative w-full rounded mt-6 mb-5">
//                   <Image src="/images/blog-listing-right-banner2.png" alt="Banner" width={1200} height={620} sizes="(max-width: 768px) 100vw, 1200px" className="w-full h-auto rounded" />
//                 </div>
//                 <MostPopularBlogs />
//               </div>
//             </aside>

//             {/* RIGHT – ARTICLE */}
//             <main className="lg:col-span-8 space-y-6">
//               {article.sections?.map((sec, i) => sec.content?.trim() && (
//                 <section id={`section-${i}`} key={i} className="space-y-4">
//                   {sec.title && <h2 className="text-[22px] leading-[32px] font-poppins font-semibold">{sec.title}</h2>}
//                   <div className="overflow-x-auto sm:overflow-x-hidden">
//                     <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(sec.content)} />
//                   </div>
//                 </section>
//               ))}

//               {/* FAQ, Tools, Related Reads – same structure as original */}
//               {article.faqs?.some(f => f.question?.trim() && f.answer?.trim()) && (
//                 <section id="faqs" className="space-y-4">
//                   <h2 className="text-[22px] font-semibold">FAQs</h2>
//                   {article.faqs.map((faq, i) => faq.question?.trim() && faq.answer?.trim() && (
//                     <div key={i} className="space-y-2">
//                       <p className="font-semibold text-[18px]">{faq.question}</p>
//                       <div className="overflow-x-auto sm:overflow-x-hidden">
//                         <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(faq.answer)} />
//                       </div>
//                     </div>
//                   ))}
//                 </section>
//               )}

//               {article.tools?.some(t => t.title?.trim() && t.content?.trim()) && (
//                 <section id="tools" className="space-y-4">
//                   <h2 className="text-[22px] font-semibold">Tools</h2>
//                   {article.tools.map((tool, i) => tool.title?.trim() && tool.content?.trim() && (
//                     <div key={i} className="space-y-2">
//                       <p className="font-semibold text-[18px]">{tool.title}</p>
//                       <div className="overflow-x-auto sm:overflow-x-hidden">
//                         <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[30px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:text-[18px] [&_li]:leading-[30px] [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(tool.content)} />
//                       </div>
//                     </div>
//                   ))}
//                 </section>
//               )}

//               {article.related_reads?.some(r => r.title?.trim() && r.content?.trim()) && (
//                 <section id="related-reads" className="space-y-4">
//                   <h2 className="text-[22px] font-semibold">Related Reads</h2>
//                   {article.related_reads.map((read, i) => read.title?.trim() && read.content?.trim() && (
//                     <div key={i} className="space-y-2">
//                       <p className="font-semibold text-[18px]">{read.title}</p>
//                       <div className="overflow-x-auto sm:overflow-x-hidden">
//                         <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(read.content)} />
//                       </div>
//                     </div>
//                   ))}
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
import SeniorCitizen from "@/components/Blog-details-Page/SeniorCitizen";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";

/* ================= TYPES ================= */
interface Section { title?: string; content?: string; }
interface Faq { question: string; answer?: string; }
interface Tool { title?: string; content?: string; }
interface RelatedRead { title?: string; content?: string; }
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
}
interface ApiResponse { topic?: { title?: string }; articles?: Article[]; }

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

  /* ================= FETCH BLOG ================= */
  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/topic/published/slug/${encodeURIComponent(slug)}`
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
        setArticle(json.articles[0]);
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong");
        setArticle(null);
        setTopicTitle("");
      } finally { setLoading(false); }
    };

    fetchBlog();
  }, [slug, API_BASE]);

  const sanitize = (html?: string) => ({ __html: DOMPurify.sanitize(html || "") });

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
      <span className="text-[20px] font-inter font-semibold text-[#043F79]">{topicTitle}</span>
    )}
    <h1 className="text-[22px] md:text-[32px] font-poppins font-semibold leading-[44px] mt-[10px] mb-[20px]">{article.title}</h1>
    {article.introduction && (
      <div
        className="text-gray-600 mb-6 font-inter [&_p]:!text-[20px] [&_p]:!leading-[32px] [&_p]:mb-4"
        dangerouslySetInnerHTML={sanitize(article.introduction)}
      />
    )}
    {/* SHARE */}
    <div className="flex items-center gap-3 mb-3"> {/* reduced from mb-6 to mb-3 */}
      <span className="text-[15px] font-inter">Share:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaFacebookF /></a>
      <a href={`https://twitter.com/intent/tweet?url=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaTwitter /></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaLinkedinIn /></a>
      <a href={`https://wa.me/?text=${pageUrl}`} target="_blank" className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed"><FaWhatsapp /></a>
    </div>
    <p className="text-[16px] font-inter font-medium">{article.author || "Team Money Now"} | {article.created_at && new Date(article.created_at).toLocaleDateString()}</p>
  </div>

  {/* RIGHT HERO IMAGE ONLY IF hero_image EXISTS */}
  {heroImageSrc && (
    <div className="relative w-full rounded-lg overflow-hidden">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT – TOC */}
            <aside className="lg:col-span-4 mb-6 lg:mb-0">
              <div className="sticky top-6 lg:top-24 border-r lg:border-r pr-0 lg:pr-6 border-[#E8E8E8]">
                <h3 className="text-[20px] font-inter text-[#043F79] font-bold mb-4">Table Of Content</h3>
                <ul className="text-[16px] sm:text-[18px] font-medium font-poppins border-t border-b border-[#E8E8E8] divide-y divide-[#E8E8E8]">
                  {article.sections?.map((sec, i) => sec.title?.trim() ? <li key={i} className="py-3 last:border-b-0"><a href={`#section-${i}`} className="block hover:text-[#043F79]">{sec.title}</a></li> : null)}
                  {article.faqs?.some(f => f.question?.trim() && f.answer?.trim()) && <li className="py-3"><a href="#faqs" className="block hover:text-[#043F79]">FAQs</a></li>}
                  {article.tools?.some(t => t.title?.trim() && t.content?.trim()) && <li className="py-3"><a href="#tools" className="block hover:text-[#043F79]">Tools</a></li>}
                  {article.related_reads?.some(r => r.title?.trim() && r.content?.trim()) && <li className="py-3"><a href="#related-reads" className="block hover:text-[#043F79]">Related Reads</a></li>}
                </ul>
                <div className="relative w-full rounded mt-6 mb-5">
                  <Image src="/images/blog-listing-right-banner2.png" alt="Banner" width={1200} height={620} sizes="(max-width: 768px) 100vw, 1200px" className="w-full h-auto rounded" />
                </div>
                <MostPopularBlogs />
              </div>
            </aside>

            {/* RIGHT – ARTICLE */}
            <main className="lg:col-span-8 space-y-6">
              {article.sections?.map((sec, i) => sec.content?.trim() && (
                <section id={`section-${i}`} key={i} className="space-y-4">
                  {sec.title && <h2 className="text-[22px] leading-[32px] font-poppins font-semibold">{sec.title}</h2>}
                  <div className="overflow-x-auto sm:overflow-x-hidden">
                    <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(sec.content)} />
                  </div>
                </section>
              ))}

              {/* FAQ, Tools, Related Reads */}
              {article.faqs?.some(f => f.question?.trim() && f.answer?.trim()) && (
                <section id="faqs" className="space-y-4">
                  <h2 className="text-[22px] font-semibold">FAQs</h2>
                  {article.faqs.map((faq, i) => faq.question?.trim() && faq.answer?.trim() && (
                    <div key={i} className="space-y-2">
                      <p className="font-semibold text-[18px]">{faq.question}</p>
                      <div className="overflow-x-auto sm:overflow-x-hidden">
                        <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(faq.answer)} />
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {article.tools?.some(t => t.title?.trim() && t.content?.trim()) && (
                <section id="tools" className="space-y-4">
                  <h2 className="text-[22px] font-semibold">Tools</h2>
                  {article.tools.map((tool, i) => tool.title?.trim() && tool.content?.trim() && (
                    <div key={i} className="space-y-2">
                      <p className="font-semibold text-[18px]">{tool.title}</p>
                      <div className="overflow-x-auto sm:overflow-x-hidden">
                        <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[30px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:text-[18px] [&_li]:leading-[30px] [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(tool.content)} />
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {article.related_reads?.some(r => r.title?.trim() && r.content?.trim()) && (
                <section id="related-reads" className="space-y-4">
                  <h2 className="text-[22px] font-semibold">Related Reads</h2>
                  {article.related_reads.map((read, i) => read.title?.trim() && read.content?.trim() && (
                    <div key={i} className="space-y-2">
                      <p className="font-semibold text-[18px]">{read.title}</p>
                      <div className="overflow-x-auto sm:overflow-x-hidden">
                        <div className="text-gray-700 font-inter [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_table]:w-full [&_table]:table-auto [&_table]:border [&_table]:border-gray-300 [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:text-left [&_th]:align-middle [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td]:align-middle" dangerouslySetInnerHTML={sanitize(read.content)} />
                      </div>
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
