"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const FAQPage = ({ data }: { data: any }) => {
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");

  const getId = (title: string) =>
    title
      ?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

  const stripHtml = (value?: string) =>
    (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const filteredSections = useMemo(() => {
    if (!search) return data?.sections || [];

    const normalizedSearch = search.toLowerCase().trim();

    return data?.sections?.filter(
      (section: any) =>
        stripHtml(section.title).toLowerCase().includes(normalizedSearch) ||
        stripHtml(section.content).toLowerCase().includes(normalizedSearch),
    );
  }, [search, data]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      let currentId = "";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        // Adjusted to 200 to account for sticky search bar height
        if (rect.top <= 200 && rect.bottom >= 200) {
          currentId = section.id;
        }
      });

      if (currentId) setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredSections]);

  if (!data) return null;

  return (
    <div className="font-poppins">
      <div className="sticky top-[50px] z-10 w-full">
        {/* HERO SECTION */}
        <div
          className="relative w-full py-8 flex flex-col items-center justify-center text-center"
          style={{
            backgroundImage: "url('/images/faq-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Title & Breadcrumbs */}
          <div className="relative z-10 px-4 w-full max-w-2xl mb-3">
            <h1 className="text-white text-[24px] md:text-[42px] font-semibold mb-1">
              {data.title || "Frequently Asked Questions"}
            </h1>

            <div className="flex justify-center items-center gap-2 text-white font-medium text-sm md:text-base capitalize">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <ArrowRight size={18} className="text-white" strokeWidth={2.5} />
              <span>{data.title || "Frequently Asked Questions"}</span>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="w-full px-4 flex justify-center mt-1">
            <div className="w-full max-w-[500px] relative">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]" />

              <input
                type="text"
                placeholder="Search your question..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
            w-full
            pl-12 pr-5
            py-[10px]
            rounded-full
            bg-white
            shadow-xl
            border border-gray-200
            focus:outline-none
            focus:ring-2 focus:ring-[#003d73]
            text-[14px] md:text-[16px]
            placeholder:text-gray-400
            transition-all
            duration-300
          "
              />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 mb-[60px] mt-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* LEFT TOC */}
          <aside className="w-full md:w-80 md:sticky  md:top-75">
            <div className="bg-[#eef2f5] rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-[20px] md:text-[24px] font-semibold mb-5 text-[#001325]">
                Table Of Content
              </h3>

              <nav className="flex flex-col space-y-2">
                {filteredSections?.map((section: any, index: number) => {
                  const id = getId(section.title);
                  const isActive = activeId === id;

                  return (
                    <a
                      key={index}
                      href={`#${id}`}
                      className={`px-4 py-2 rounded-md text-[14px] transition-all duration-200
                        ${
                          isActive
                            ? "bg-[#003d73] text-white font-medium shadow"
                            : "text-black hover:bg-gray-200"
                        }`}
                    >
                      {section.title}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
            {filteredSections?.length === 0 && (
              <p className="text-center text-gray-500 py-10">
                No results found for "{search}".
              </p>
            )}

            {filteredSections?.map((section: any, index: number) => {
              const sectionId = getId(section.title);

              return (
                <section
                  key={index}
                  id={sectionId}
                  className="scroll-mt-48" // ✅ Increased scroll-margin to clear the sticky search bar
                >
                  <h3 className="text-[16px] md:text-[17px] font-semibold text-[#003d73] mb-2">
                    {index + 1}. {section.title}
                  </h3>

                  <div
                    className="
                      text-black font-poppins
                      [&_p]:text-[14px]
                      md:[&_p]:text-[15px]
                      [&_p]:leading-[26px]
                      [&_p]:mb-3
                    "
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
