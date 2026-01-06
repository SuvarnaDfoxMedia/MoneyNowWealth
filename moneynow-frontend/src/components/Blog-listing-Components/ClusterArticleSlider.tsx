<<<<<<< Updated upstream
// "use client";

// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// interface Article {
//   _id: string;
//   title: string;
//   slug: string;
//   hero_image?: string;
//   introduction?: string;
// }

// interface Cluster {
//   title: string;
// }

// interface Props {
//   articles: Article[];
//   cluster: Cluster;
//   apiBase: string;
// }

// const ClusterArticleSlider: React.FC<Props> = ({ articles, cluster, apiBase }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [visibleCards, setVisibleCards] = useState(2);

//   const maxIndex = Math.max(articles.length - visibleCards, 0);

//   // Responsive
//   useEffect(() => {
//     const update = () => {
//       if (window.innerWidth < 640) setVisibleCards(1);
//       else setVisibleCards(2);
//     };

//     update();
//     window.addEventListener("resize", update);
//     return () => window.removeEventListener("resize", update);
//   }, []);

//   useEffect(() => {
//     setCurrentIndex(0);
//   }, [visibleCards]);

//   const stripHtml = (html?: string) => {
//     if (!html) return "";
//     return html.replace(/<[^>]*>/g, "").trim();
//   };

//   if (articles.length === 0) return <p className="text-gray-500">No articles available</p>;

//   return (
//     <div>
//       <h3 className="text-[22px] font-semibold mb-4">Articles</h3>

//       <div className="relative overflow-hidden">
//         <div
//           className="flex transition-transform duration-500 ease-in-out"
//           style={{
//             transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
//           }}
//         >
//           {articles.map((article) => (
//             <div
//               key={article._id}
//               className="flex-shrink-0"
//               style={{ width: `${100 / visibleCards}%` }}
//             >
//               <Link
//                 href={`/blog/${article.slug}`}
//                 className="block bg-white rounded-xl p-4 group"
//               >
//                 {article.hero_image && (
//                   <div className="relative w-full h-56 rounded-sm overflow-hidden mb-[18px]">
//                     <Image
//                       src={`${apiBase}/uploads/hero/${article.hero_image
//                         .replace(/\\/g, "/")
//                         .split("/")
//                         .pop()}`}
//                       alt={article.title}
//                       fill
//                       className="object-cover group-hover:scale-105 transition"
//                       unoptimized
//                     />
//                   </div>
//                 )}
//                 <span className="text-[12px] px-3 py-[6px] rounded-[8px] bg-[#F0F0F0] text-[#6A6A6A] font-medium">
//                   {cluster.title}
//                 </span>
//                 <h3 className="font-semibold text-[18px] leading-[26px] mt-2 mb-2 line-clamp-2">
//                   {article.title}
//                 </h3>
//                 <p className="text-[15px] leading-[26px] line-clamp-2 text-gray-700">
//                   {stripHtml(article.introduction)}
//                 </p>
//               </Link>
//             </div>
//           ))}
//         </div>

//         {/* Left Arrow */}
//         <button
//           onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
//           disabled={currentIndex === 0}
//           className="absolute top-1/2 -left-0 transform -translate-y-1/2 w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center bg-white z-10 disabled:opacity-40"
//         >
//           <ChevronLeft />
//         </button>

//         {/* Right Arrow */}
//         <button
//           onClick={() => setCurrentIndex((i) => Math.min(i + 1, maxIndex))}
//           disabled={currentIndex === maxIndex}
//           className="absolute top-1/2 -right-0 transform -translate-y-1/2 w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center bg-white z-10 disabled:opacity-40"
//         >
//           <ChevronRight />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ClusterArticleSlider;



=======
>>>>>>> Stashed changes
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

  if (articles.length === 0) return <p className="text-gray-500">No articles available</p>;

  return (
    <div className="w-full">
      <h3 className="text-[24px] sm:text-[28px] font-poppins font-semibold">Explore Topics</h3>

   <div className="flex flex-col gap-6">
  {visibleArticles.map((article) => (
    <Link
      key={article._id}
      href={`/blog/${article.slug}`}
      className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden transition"
    >
      {/* Left: Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
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
                {new Date(article.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </div>

<<<<<<< Updated upstream
        {/* Arrow */}
        {/* <button
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
          className="absolute top-1/2 -left-0 transform -translate-y-1/2 w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center bg-white z-10 disabled:opacity-40"
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() => setCurrentIndex((i) => Math.min(i + 1, maxIndex))}
          disabled={currentIndex === maxIndex}
          className="absolute top-1/2 -right-0 transform -translate-y-1/2 w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center bg-white z-10 disabled:opacity-40"
        >
          <ChevronRight />
        </button> */}

{/* Left Arrow */}
<button
  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
  disabled={currentIndex === 0}
  className="absolute top-[65%] -left-0 transform -translate-y-1/2 w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center bg-white z-10 disabled:opacity-40"
>
  <ChevronLeft />
</button>

{/* Right Arrow */}
<button
  onClick={() => setCurrentIndex((i) => Math.min(i + 1, maxIndex))}
  disabled={currentIndex === maxIndex}
  className="absolute top-[65%] -right-0 transform -translate-y-1/2 w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center bg-white z-10 disabled:opacity-40"
>
  <ChevronRight />
</button>

        
=======
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
>>>>>>> Stashed changes
      </div>

      {/* Right: Image */}
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
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={`w-9 h-9 text-sm flex items-center justify-center border
        ${
          currentPage === page
            ? "bg-[#043F79] text-white border-[#043F79] font-medium"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }`}
    >
      {page}
    </button>
  ))}

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
