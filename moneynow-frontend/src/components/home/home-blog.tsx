"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useFetchCards } from "@/hooks/useHomeBlog";
import { ArrowRight } from "lucide-react";

interface HomeBlogProps {
  title: string;
  subtitle: string;
}

const HomeBlog: React.FC<HomeBlogProps> = ({ title, subtitle }) => {
  const { cards, loading, error } = useFetchCards(
    "/api/article/published/latest",
    4,
    {
      withCredentials: false,
      forceFreeOnly: false,
      visibilityField: "show_on_home",
    },
  );

  if (loading) return <p className="text-center py-10">Loading...</p>;

  if (error)
    return (
      <p className="text-center text-red-500 py-10">
        Something went wrong. Please try again.
      </p>
    );

  return (
    <section className="bg-[#F8F8F8] py-[40px] font-poppins mb-[40px]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <h2 className="text-center font-semibold text-[28px] sm:text-[36px] lg:text-[40px] mb-3">
          Learn before you invest
        </h2>

        {/* Subtitle */}
        <p className="text-center text-[18px] mb-12 max-w-3xl mx-auto">
          Clear, practical insights to help you make informed investment
          decisions over time.{" "}
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.slice(0, 4).map((card, index) => (
            <Link
              key={index}
              href={`/blog/${card.slug}`}
              className="group bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Image */}
              <div className="relative w-full h-[200px]">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span
                  className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[12px] font-semibold ${
                    card.is_premium
                      ? "bg-[#FFF1E5] text-[#C2410C]"
                      : "bg-[#ECFDF5] text-[#047857]"
                  }`}
                >
                  {card.is_premium ? "Premium" : "Free"}
                </span>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category */}
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[14px] font-medium">{card.category}</p>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[20px] leading-[26px] mb-3 line-clamp-2">
                  {card.title}
                </h3>
                {/* Read More */}
                <div className="flex items-center gap-2 text-[16px]   mb-4">
                  Read More <ArrowRight size={16} />
                </div>

                {/* Bottom Link */}
                <div className="flex items-center justify-between text-[14px] text-[#043F79] ">
                  <span>Click here to learn more on research</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeBlog;
