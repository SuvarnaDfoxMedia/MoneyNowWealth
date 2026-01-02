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



"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

const ClusterArticleSlider: React.FC<Props> = ({ articles, cluster, apiBase }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(2);

  const maxIndex = Math.max(articles.length - visibleCards, 0);

  // Responsive
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setVisibleCards(1);
      else setVisibleCards(2);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [visibleCards]);

  const stripHtml = (html?: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  if (articles.length === 0) return <p className="text-gray-500">No articles available</p>;

  return (
    <div>
      <h3 className="text-[22px] font-semibold ">Topics</h3>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
          }}
        >
          {articles.map((article) => (
            <div
              key={article._id}
              className="flex-shrink-0 p-2"
              style={{ width: `${100 / visibleCards}%` }}
            >
              <Link
                href={`/blog/${article.slug}`}
                className="block bg-white rounded-xl"
              >
                {/* Category / Cluster Title */}
                <div className="px-4 pt-4">
                  <span className="text-[#043F79] text-[18px] font-bold font-inter ">
                    {cluster.title}
                  </span>
                </div>

                {/* Article Title */}
                <h3 className="px-4 mt-2 text-[20px] font-semibold line-clamp-2">
                  {article.title}
                </h3>

                {/* Author & Date */}
                <div className="px-4 mt-2 text-[15px] font-inter mb-2 flex gap-1 text-gray-600">
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

                {/* Image */}
                {article.hero_image && (
                  <div className="relative w-full h-[286px] mt-3">
                    <Image
                      src={`${apiBase}/uploads/hero/${article.hero_image
                        .replace(/\\/g, "/")
                        .split("/")
                        .pop()}`}
                      alt={article.title}
                      fill
                      className="object-cover rounded-[10px] group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>

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

        
      </div>
    </div>
  );
};

export default ClusterArticleSlider;
