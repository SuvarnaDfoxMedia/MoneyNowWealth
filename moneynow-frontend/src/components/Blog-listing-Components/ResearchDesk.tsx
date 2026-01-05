"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFetchCards, CardData } from "@/hooks/useHomeBlog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

const ResearchDesk = () => {
  const { cards, loading, error } = useFetchCards(
    `${API_BASE}/api/topic/published`,
    10
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);

  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 640) setVisibleCards(1);
      else if (window.innerWidth < 1024) setVisibleCards(2);
      else setVisibleCards(3);
    };

    updateVisibleCards();
    window.addEventListener("resize", updateVisibleCards);
    return () => window.removeEventListener("resize", updateVisibleCards);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [visibleCards]);

  if (loading)
    return <p className="text-center py-10">Loading articles...</p>;

  if (error)
    return <p className="text-center py-10 text-red-500">{error}</p>;

  if (!cards || cards.length === 0)
    return <p className="text-center py-10">No articles found.</p>;

  const maxIndex = Math.max(cards.length - visibleCards, 0);

  return (
    <section className="w-full mt-2 mb-[30px]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <h2 className="text-[30px] font-poppins font-semibold mb-[30px] border-b border-[#F0F0F0] pb-[15px]">
          Research Desk
        </h2>

        {/* ---------------- Slider ---------------- */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
            }}
          >
            {cards.map((item: CardData, idx: number) => {
              const slug = item.slug?.trim();
              if (!slug) return null;

              return (
                <div
                  key={idx}
                  className="flex-shrink-0 px-0 sm:px-3"
                  style={{ width: `${100 / visibleCards}%` }}
                >
                  <Link href={`/blog/${slug}`} className="block group">
                    {item.imageSrc && (
                      <div className="relative w-full h-[250px] mb-[20px] rounded-[10px] overflow-hidden">
                        <Image
                          src={item.imageSrc}
                          alt={item.title || "Blog Image"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    )}

                    <span className="block text-[18px] font-inter font-bold text-[#043F79] mb-2">
                      {item.category || "General"}
                    </span>

                    <div className="text-[15px] font-inter mb-2 flex gap-1 text-gray-600">
                      <span>{item.author || "Team Money Now"}</span>
                      {item.created_at && (
                        <>
                          <span>|</span>
                          <span>
                            {new Date(item.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-[20px] font-poppins font-semibold leading-[30px] mb-2 line-clamp-2 group-hover:text-[#043F79] transition">
                      {item.title}
                    </h3>

                    <p className="text-[15px] leading-[26px] font-poppins line-clamp-2 text-gray-700">
                      {item.description}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------- Controls ---------------- */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, maxIndex))}
            disabled={currentIndex === maxIndex}
            className="w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResearchDesk;
