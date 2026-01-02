

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiArrowLeft } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import DOMPurify from "dompurify";

// interface Section { title?: string; content?: string; }
// interface Faq { question: string; answer?: string; }
// interface Tool { title: string; content?: string; }
// interface RelatedRead { title: string; content?: string; }

// interface Article {
//   _id: string;
//   title: string;
//   author?: string;
//   hero_image?: string;
//   introduction?: string;
//   sections: Section[];
//   faqs: Faq[];
//   tools: Tool[];
//   related_reads: RelatedRead[];
//   read_time?: number;
//   created_at?: string;
// }

// interface ApiResponse<T> {
//   success: boolean;
//   message?: string;
//   data?: T;
//   total?: number;
// }

// const API_BASE_URL = import.meta.env.VITE_API_BASE;

// export default function ViewArticle() {
//   const { id, role } = useParams<{ id: string; role?: string }>();
//   const navigate = useNavigate();
//   const { getOne } = useCommonCrud<Article>({
//     role: role || "admin",
//     module: "article",
//   });

//   const [article, setArticle] = useState<Article | null>(null);
//   const [loading, setLoading] = useState(true);

//   const getImageUrl = (filename?: string) => {
//     if (!filename) return "/no-image.png";
//     const base = API_BASE_URL.replace("/api", "");
//     return `${base}/uploads/hero/${filename}`;
//   };

//   // ---------------- NORMALIZE RESPONSE ----------------
//   const extractArticle = (res: Article | ApiResponse<Article>): Article | null => {
//     if (!res) return null;
//     if ("data" in res && res.data) return res.data;
//     if ("_id" in res) return res;
//     return null;
//   };

//   useEffect(() => {
//     const fetchArticle = async () => {
//       if (!id) return;
//       try {
//         const res = await getOne(id);
//         const data = extractArticle(res);

//         if (!data) {
//           toast.error("Article not found");
//           return;
//         }

//         setArticle({
//           ...data,
//           sections: data.sections ?? [],
//           faqs: data.faqs ?? [],
//           tools: data.tools ?? [],
//           related_reads: data.related_reads ?? [],
//         });
//       } catch (err: any) {
//         toast.error(err?.message || "Failed to load article");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchArticle();
//   }, [id]);

//   /* ---------------- SANITIZER (TABLE + LINK SAFE) ---------------- */
//   const sanitizeAndNormalizeHtml = (html?: string) => {
//     if (!html) return { __html: "" };

//     const tempDiv = document.createElement("div");
//     tempDiv.innerHTML = html;

//     tempDiv.querySelectorAll("a").forEach((a) => {
//       const href = a.getAttribute("href") || "#";
//       if (
//         !href.startsWith("http://") &&
//         !href.startsWith("https://") &&
//         !href.startsWith("/") &&
//         !href.startsWith("mailto:")
//       ) {
//         a.setAttribute("href", `https://${href}`);
//       }
//       a.setAttribute("target", "_blank");
//       a.setAttribute("rel", "noopener noreferrer");
//     });

//     return {
//       __html: DOMPurify.sanitize(tempDiv.innerHTML, {
//         USE_PROFILES: { html: true },
//         ADD_TAGS: [
//           "table",
//           "thead",
//           "tbody",
//           "tfoot",
//           "tr",
//           "td",
//           "th",
//           "colgroup",
//           "col",
//         ],
//         ADD_ATTR: ["target", "rel", "style", "class"],
//         KEEP_CONTENT: true,
//       }),
//     };
//   };

//   if (loading)
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
//         Loading...
//       </div>
//     );

//   if (!article)
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
//         Article not found.
//       </div>
//     );

//   /* ---------------- FORCE CONTENT STYLES ---------------- */
//   const proseClass =
//     "max-w-none text-gray-700 " +
//     "[&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 " +
//     "[&_table]:w-full [&_table]:border [&_table]:border-collapse [&_table]:my-4 " +
//     "[&_th]:border [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:text-left " +
//     "[&_td]:border [&_td]:p-2";

//   return (
//     <div className="bg-gray-50 min-h-screen py-6">
//       <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
//         {/* Back Button */}
//         <div className="flex justify-end px-6 pt-6 mb-6">
//           <button
//             onClick={() => navigate(`/${role || "admin"}/article`)}
//             className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#064d99]"
//           >
//             <FiArrowLeft /> Back
//           </button>
//         </div>

//         {/* Hero Image */}
//         <img
//           src={getImageUrl(article.hero_image)}
//           alt={article.title}
//           className="w-full max-h-[590px] object-cover border-y"
//           onError={(e) => (e.currentTarget.src = "/no-image.png")}
//         />

//         {/* Content */}
//         <div className="px-6 py-10 md:px-12">
//           <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>

//           <div className="text-sm text-gray-500 mb-8">
//             By {article.author || "Admin"} •{" "}
//             {article.created_at
//               ? new Date(article.created_at).toLocaleDateString()
//               : ""}{" "}
//             • {article.read_time ? `${article.read_time} min read` : "Quick read"}
//           </div>

//           {/* Introduction */}
//           {article.introduction && (
//             <div
//               className={`${proseClass} border-l-4 border-indigo-500 pl-4 italic mb-8`}
//               dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
//                 article.introduction
//               )}
//             />
//           )}

//           {/* Sections */}
//           {article.sections.map((sec, i) => (
//             <div key={i} className="mb-2">
//               {sec.title && (
//                 <h2 className="text-2xl font-semibold mb-3">{sec.title}</h2>
//               )}
//               {sec.content && (
//                 <div
//                   className={proseClass}
//                   dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(sec.content)}
                
//                 />
//               )}
//             </div>
//           ))}

//           {/* FAQs */}
//           {article.faqs.length > 0 && (
//             <div className="mt-12">
//               {article.faqs.map((faq, i) => (
//                 <div key={i} className="border-b pb-4 mb-4">
//                   <h3 className="font-semibold">{faq.question}</h3>
//                   <div
//                     className={proseClass}
//                     dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
//                       faq.answer
//                     )}
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Tools */}
//           {article.tools.length > 0 && (
//             <div className="mt-12">
//               {article.tools.map((tool, i) => (
//                 <div key={i} className="mb-4">
//                   <h3 className="font-semibold">{tool.title}</h3>
//                   <div
//                     className={proseClass}
//                     dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
//                       tool.content
//                     )}
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Related Reads */}
//           {article.related_reads.length > 0 && (
//             <div className="mt-12">
//               {article.related_reads.map((read, i) => (
//                 <div key={i} className="mb-4">
//                   <h3 className="font-semibold">{read.title}</h3>
//                   <div
//                     className={proseClass}
//                     dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(
//                       read.content
//                     )}
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import DOMPurify from "dompurify";

interface Section { title?: string; content?: string; }
interface Faq { question: string; answer?: string; }
interface Tool { title?: string; content?: string; }
interface RelatedRead { title?: string; content?: string; }

interface Article {
  _id: string;
  title: string;
  author?: string;
  hero_image?: string;
  introduction?: string;
  sections: Section[];
  faqs: Faq[];
  tools: Tool[];
  related_reads: RelatedRead[];
  read_time?: number;
  created_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE;

export default function ViewArticle() {
  const { id, role } = useParams<{ id: string; role?: string }>();
  const navigate = useNavigate();
  const { getOne } = useCommonCrud<Article>({
    role: role || "admin",
    module: "article",
  });

  const [article, setArticle] = useState<Article | null>(null);
  const [topicTitle, setTopicTitle] = useState(""); 
  const [loading, setLoading] = useState(true);

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const getImageUrl = (filename?: string) => {
    if (!filename) return "/images/blog-details-page-img.png";
    const base = API_BASE_URL.replace("/api", "");
    return `${base}/uploads/hero/${filename}`;
  };

  const extractArticle = (res: Article | ApiResponse<Article>): Article | null => {
    if (!res) return null;
    if ("data" in res && res.data) return res.data;
    if ("_id" in res) return res;
    return null;
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const res = await getOne(id);
        const data = extractArticle(res);

        if (!data) {
          toast.error("Article not found");
          return;
        }

        setArticle({
          ...data,
          sections: data.sections ?? [],
          faqs: data.faqs ?? [],
          tools: data.tools ?? [],
          related_reads: data.related_reads ?? [],
        });

        setTopicTitle("Topic Name"); 
      } catch (err: any) {
        toast.error(err?.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const sanitizeAndNormalizeHtml = (html?: string) => {
    if (!html) return { __html: "" };
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

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
        ADD_TAGS: ["table","thead","tbody","tfoot","tr","td","th","colgroup","col"],
        ADD_ATTR: ["target","rel","style","class"],
        KEEP_CONTENT: true,
      }),
    };
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );

  if (!article)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Article not found.
      </div>
    );

  const proseClass =
    "max-w-none text-gray-700 " +
    "[&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 " +
    "[&_table]:w-full [&_table]:border [&_table]:border-collapse [&_table]:my-4 " +
    "[&_th]:border [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:text-left " +
    "[&_td]:border [&_td]:p-2";

  return (
    <>
      {/* ================= BACK BUTTON ================= */}
      <div className="px-4 md:px-6 py-6 bg-white border-b border-[#E8E8E8]">
        <button
          onClick={() => navigate(`/${role || "admin"}/article`)}
          className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#064d99]"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      {/* ================= HERO ================= */}
      <section className="w-full bg-white py-10">
        <div className="max-w-full mx-auto px-4 md:px-6 pb-[30px] border-b border-[#E8E8E8]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT */}
            <div>
              <span className="text-[20px] font-inter font-semibold text-[#043F79]">
                {topicTitle}
              </span>

              <h1 className="text-[22px] md:text-[32px] font-poppins font-semibold leading-[44px] mt-[10px] mb-[20px]">
                {article.title}
              </h1>

              {article.introduction && (
                <div
                  className="
                    text-gray-600 mb-6 font-inter
                    [&_p]:!text-[20px]
                    [&_p]:!leading-[32px]
                    [&_p]:mb-4
                  "
                  dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(article.introduction)}
                />
              )}

              {/* SHARE */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[15px] font-inter">Share:</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center border-[#000000] rounded-full border border-dashed"
                >
                  <FaFacebookF />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center border-[#000000] rounded-full border border-dashed"
                >
                  <FaTwitter />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center border-[#000000] rounded-full border border-dashed"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  href={`https://wa.me/?text=${pageUrl}`}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center border-[#000000] rounded-full border border-dashed"
                >
                  <FaWhatsapp />
                </a>
              </div>

              <p className="text-[16px] font-inter font-medium">
                {article.author || "Team Money Now"} |{" "}
                {article.created_at && new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] lg:h-[430px] rounded-lg overflow-hidden">
              <img
                src={getImageUrl(article.hero_image)}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.src = "/images/blog-details-page-img.png")}
              />
            </div>
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
                <h3 className="text-[20px] font-inter text-[#043F79] font-bold mb-4">
                  Table Of Content
                </h3>
                <ul className="text-[16px] sm:text-[18px] font-medium font-poppins border-t border-b border-[#E8E8E8] divide-y divide-[#E8E8E8]">
                  {article.sections.map((sec, i) =>
                    sec.title?.trim() ? (
                      <li key={i} className="py-3 last:border-b-0">
                        <a href={`#section-${i}`} className="block hover:text-[#043F79]">{sec.title}</a>
                      </li>
                    ) : null
                  )}
                  {article.faqs.length > 0 && <li className="py-3"><a href="#faqs" className="block hover:text-[#043F79]">FAQs</a></li>}
                  {article.tools.length > 0 && <li className="py-3"><a href="#tools" className="block hover:text-[#043F79]">Tools</a></li>}
                  {article.related_reads.length > 0 && <li className="py-3"><a href="#related-reads" className="block hover:text-[#043F79]">Related Reads</a></li>}
                </ul>
              </div>
            </aside>

            {/* RIGHT – ARTICLE */}
            <main className="lg:col-span-8 space-y-6">
              {article.sections.map((sec, i) =>
                sec.content?.trim() ? (
                  <section id={`section-${i}`} key={i} className="space-y-4">
                    {sec.title && <h2 className="text-[22px] leading-[32px] font-poppins font-semibold">{sec.title}</h2>}
                    <div className="overflow-x-auto sm:overflow-x-auto">
                      <div className={proseClass} dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(sec.content)} />
                    </div>
                  </section>
                ) : null
              )}

              {/* FAQs */}
              {article.faqs.length > 0 && (
                <section id="faqs" className="space-y-4">
                  <h2 className="text-[22px] font-semibold">FAQs</h2>
                  {article.faqs.map((faq, i) => (
                    <div key={i} className="space-y-2">
                      <p className="font-semibold text-[18px]">{faq.question}</p>
                      {faq.answer?.trim() && (
                        <div className="overflow-x-auto sm:overflow-x-auto">
                          <div className={proseClass} dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(faq.answer)} />
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* Tools */}
              {article.tools.length > 0 && (
                <section id="tools" className="space-y-4">
                  <h2 className="text-[22px] font-semibold">Tools</h2>
                  {article.tools.map((tool, i) => (
                    <div key={i} className="space-y-2">
                      <p className="font-semibold text-[18px]">{tool.title}</p>
                      {tool.content?.trim() && (
                        <div className="overflow-x-auto sm:overflow-x-auto">
                          <div className={proseClass} dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(tool.content)} />
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* Related Reads */}
              {article.related_reads.length > 0 && (
                <section id="related-reads" className="space-y-4">
                  <h2 className="text-[22px] font-semibold">Related Reads</h2>
                  {article.related_reads.map((read, i) => (
                    <div key={i} className="space-y-2">
                      <p className="font-semibold text-[18px]">{read.title}</p>
                      {read.content?.trim() && (
                        <div className="overflow-x-auto sm:overflow-x-auto">
                          <div className={proseClass} dangerouslySetInnerHTML={sanitizeAndNormalizeHtml(read.content)} />
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </main>
          </div>
        </div>
      </section>
    </>
  );
}
