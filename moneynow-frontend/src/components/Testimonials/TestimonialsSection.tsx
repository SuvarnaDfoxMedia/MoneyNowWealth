"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { API } from "@/app/api/axios";

type Testimonial = {
  _id: string;
  image?: string;
  name: string;
  designation: string;
  description: string;
  rating: number;
};

type ApiResponse = {
  success: boolean;
  data?: Testimonial[];
};

type Props = {
  mode?: "carousel" | "grid";
  showHeading?: boolean;
  className?: string;
};

function normalizeText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTestimonials(payload: any): Testimonial[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function Stars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <p className="text-[#043F79] text-lg tracking-wide">
      {"\u2605".repeat(safeRating)}
      {"\u2606".repeat(5 - safeRating)}
    </p>
  );
}

function getSlidesPerView(width: number) {
  if (width >= 1280) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
}

export default function TestimonialsSection({
  mode = "carousel",
  showHeading = true,
  className = "",
}: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  const fetchTestimonials = useCallback(async () => {
    try {
      const { data } = await API.get<ApiResponse>("/api/testimonials", {
        params: { _t: Date.now() },
      });

      const result = extractTestimonials(data);
      setItems(result);
      setActiveIndex((prev) =>
        Math.min(prev, Math.max(result.length - slidesPerView, 0)),
      );
    } catch {
      setItems((prev) => prev);
    } finally {
      setLoading(false);
    }
  }, [slidesPerView]);

  useEffect(() => {
    void fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      setSlidesPerView(getSlidesPerView(window.innerWidth));
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const refreshMs = mode === "carousel" ? 10000 : 30000;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchTestimonials();
      }
    }, refreshMs);

    const onFocus = () => {
      void fetchTestimonials();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchTestimonials, mode]);

  const maxIndex = Math.max(items.length - slidesPerView, 0);

  useEffect(() => {
    if (mode !== "carousel") return;
    if (items.length <= slidesPerView) return;

    const autoSlide = window.setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => window.clearInterval(autoSlide);
  }, [items.length, maxIndex, mode, slidesPerView]);

  const slideWidthClass =
    slidesPerView === 4
      ? "w-1/4"
      : slidesPerView === 3
        ? "w-1/3"
        : slidesPerView === 2
          ? "w-1/2"
          : "w-full";

  const translatePercent = activeIndex * (100 / slidesPerView);

  const skeletonCards = useMemo(
    () => Array.from({ length: mode === "carousel" ? 4 : 6 }),
    [mode],
  );

  const nextSlide = () => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <section
      className={`bg-[#F8F8F8] py-[40px] font-poppins mb-[40px] ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {showHeading && (
          <div className="text-center mb-12">
            <h2 className="font-semibold text-[28px] sm:text-[36px] lg:text-[40px] mb-3">
              What Investors Say
            </h2>
            <p className="text-[18px] max-w-3xl mx-auto text-gray-700">
              Real experiences from investors who use MoneyNow to stay
              disciplined, goal-focused, and confident through market cycles.
            </p>
          </div>
        )}

        {loading ? (
          <div
            className={
              mode === "carousel"
                ? "flex gap-6 overflow-hidden"
                : "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            }
          >
            {skeletonCards.map((_, idx) => (
              <div
                key={idx}
                className="min-w-[300px] flex-1 rounded-[20px] border border-gray-200 bg-white p-6 animate-pulse"
              >
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="mt-4 h-4 w-40 bg-gray-200 rounded" />
                <div className="mt-2 h-4 w-28 bg-gray-200 rounded" />
                <div className="mt-4 h-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
            Testimonials will be published here shortly.
          </div>
        ) : mode === "carousel" ? (
          <div id="hs-carousel" className="relative">
            <div className="relative w-full overflow-hidden ">
              <div
                className="flex transition-transform duration-700"
                style={{ transform: `translateX(-${translatePercent}%)` }}
              >
                {items.map((item) => {
                  const cleanText = normalizeText(item.description || "");
                  const isExpanded = Boolean(expanded[item._id]);
                  return (
                    <div
                      key={item._id}
                      className={`${slideWidthClass} shrink-0 px-8`}
                    >
                      <article className="h-full rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white p-6">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[18px] leading-[24px] text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-[14px] text-gray-600">
                              {item.designation}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Stars rating={item.rating} />
                        </div>

                        <p
                          className={`mt-3 text-gray-700 text-[15px] leading-[28px] ${isExpanded ? "" : "line-clamp-3"}`}
                        >
                          {cleanText}
                        </p>

                        {cleanText.length > 150 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((prev) => ({
                                ...prev,
                                [item._id]: !isExpanded,
                              }))
                            }
                            className="mt-2 text-[14px] font-medium text-[#043F79] hover:underline"
                          >
                            {isExpanded ? "Read less" : "Read more"}
                          </button>
                        )}
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={prevSlide}
              className="absolute top-1/2 left-2 inline-flex justify-center items-center h-10 w-10 bg-white text-gray-700 rounded-full shadow-sm hover:bg-gray-100 -translate-y-1/2"
              aria-label="Previous"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="absolute top-1/2 right-2 inline-flex justify-center items-center h-10 w-10 bg-white text-gray-700 rounded-full shadow-sm hover:bg-gray-100 -translate-y-1/2"
              aria-label="Next"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>

            <div className="flex justify-center absolute bottom-3 left-0 right-0 gap-x-2">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`h-3 w-3 rounded-full border cursor-pointer ${
                    idx === activeIndex
                      ? "bg-[#043F79] border-[#043F79]"
                      : "bg-white border-gray-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const cleanText = normalizeText(item.description || "");
              const isExpanded = Boolean(expanded[item._id]);
              return (
                <article
                  key={item._id}
                  className="rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white p-6"
                >
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[18px] leading-[24px] text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-[14px] text-gray-600">
                        {item.designation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Stars rating={item.rating} />
                  </div>

                  <p
                    className={`mt-3 text-gray-700 text-[15px] leading-[28px] ${isExpanded ? "" : "line-clamp-3"}`}
                  >
                    {cleanText}
                  </p>

                  {cleanText.length > 150 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [item._id]: !isExpanded,
                        }))
                      }
                      className="mt-2 text-[14px] font-medium text-[#043F79] hover:underline"
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
