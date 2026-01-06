

// "use client";
// import React from "react";
// import Image from "next/image";
// import { useFetchCards } from "@/hooks/useHomeBlog";

// interface HomeBlogProps {
//   title: string;
//   subtitle: string;
// }

// const HomeBlog: React.FC<HomeBlogProps> = ({ title, subtitle }) => {
//   const { cards, loading, error } = useFetchCards("/api/topic/published");

//   if (loading) return <p className="text-center">Loading...</p>;
//   if (error) return <p className="text-center text-red-500">{error}</p>;

//   return (
//     <section className="font-poppins pt-[25px] mb-[25px]">
//       <div className="max-w-7xl mx-auto">
//         <h2 className="font-bold text-[24px] sm:text-[32px] text-center mb-2">
//           {title}
//         </h2>
//         <p className="text-center text-[15px] text-[#6A6A6A] mb-[10px] max-w-2xl mx-auto">
//           {subtitle}
//         </p>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
//           {cards.map((card, index) => (
//             <div key={index} className="bg-white rounded-xl p-4">
//               <div className="relative w-full h-56 rounded-sm overflow-hidden mb-[18px]">
//                 <Image
//                   src={card.imageSrc}
//                   alt={card.title}
//                   fill
//                   className="object-cover"
//                   unoptimized
//                 />
//               </div>

//               <span className="text-[12px] px-3 py-[6px] rounded-[8px] bg-[#F0F0F0] text-[#6A6A6A] font-medium">
//                 {card.category}
//               </span>

//               <h3 className="font-semibold text-[18px] leading-[26px] mt-2 line-clamp-2">
//                 {card.title}
//               </h3>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default HomeBlog;



"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useFetchCards } from "@/hooks/useHomeBlog";

interface HomeBlogProps {
  title: string;
  subtitle: string;
}

const HomeBlog: React.FC<HomeBlogProps> = ({ title, subtitle }) => {
  const { cards, loading, error } = useFetchCards("/api/topic/published");

  if (loading) return <p className="text-center">Loading...</p>;
  if (error)
    return (
      <p className="text-center text-red-500">
        Something went wrong. Please try again.
      </p>
    );

  return (
    <section className="font-poppins pt-[25px] mb-[25px]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-bold text-[24px] sm:text-[32px] text-center mb-2">
          {title}
        </h2>
        <p className="text-center text-[15px] text-[#6A6A6A] mb-[10px] max-w-2xl mx-auto">
          {subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         
{cards.map((card, index) => (
  <Link
    key={index}
    href={`/blog/${card.slug}`}
    className="bg-white rounded-xl p-4 transition-shadow group"
  >
    <div className="relative w-full h-56 rounded-sm overflow-hidden mb-[18px]">
      <Image
        src={card.imageSrc}
        alt={card.title}
        fill
        className="object-cover"
        unoptimized
      />
    </div>

    <span className="text-[12px] px-3 py-[6px] rounded-[8px] bg-[#F0F0F0] text-[#6A6A6A] font-medium">
      {card.category}
    </span>

    <h3 className="font-semibold text-[18px] leading-[26px] mt-2 line-clamp-2 text-gray-800 group-hover:text-[#043F79] transition-colors">
      {card.title}
    </h3>

    {/* ✅ Topic Publish Date */}
    {card.published_at && (
      <time
        dateTime={card.published_at}
        className="block text-[13px] text-[#8A8A8A] mt-1"
      >
        {new Date(card.published_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </time>
    )}
  </Link>
))}


        </div>
      </div>
    </section>
  );
};

export default HomeBlog;
