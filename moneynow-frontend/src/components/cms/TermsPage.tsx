"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import CMSBanner from "./CmsBanner";

const TermsPage = ({ data }: { data: any }) => {
  const [activeId, setActiveId] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);

  const getId = (title: string) =>
    title
      ? title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim()
      : "";

  const sections = useMemo(
    () =>
      (data?.sections || []).map((section: any, index: number) => ({
        ...section,
        tocId: `${getId(section.title) || "section"}-${index}`,
      })),
    [data],
  );

  useEffect(() => {
    const handleScroll = () => {
      const sectionNodes = contentRef.current?.querySelectorAll<HTMLElement>(
        "section[id]",
      );

      if (!sectionNodes?.length) return;

      let currentId = sectionNodes[0].id;
      const activationLine = 220;

      sectionNodes.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= activationLine) {
          currentId = section.id;
        }
      });

      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  if (!data) return null;

  return (
    <div className="font-poppins">
      <CMSBanner
        title={data.title || "Website Usage Terms and Conditions"}
        bgImage="/images/privacy-bg.png"
      />

      <div className="md:hidden px-4 mt-6 mb-[60px]">
        <div className="bg-[#f0f4f8] rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-[20px] font-semibold mb-4 text-[#001325]">
            Table Of Content
          </h3>

          <nav className="flex flex-col space-y-1">
            {sections.map((section: any, index: number) => {
              const isActive = activeId === section.tocId;

              return (
                <a
                  key={index}
                  href={`#${section.tocId}`}
                  onClick={() => setActiveId(section.tocId)}
                  className={`px-3 py-2 rounded-md text-[14px] transition-all duration-200 ${
                    isActive
                      ? "bg-[#003d73] text-white font-medium"
                      : "text-black hover:bg-gray-200"
                  }`}
                >
                  {section.title}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mb-[60px]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div ref={contentRef} className="flex-1 space-y-10 md:space-y-12">
            {sections.map((section: any, index: number) => (
              <section
                key={index}
                id={section.tocId}
                className="scroll-mt-28 md:scroll-mt-32"
              >
                {section.title && (
                  <h2 className="text-[18px] md:text-[22px] font-bold mb-4 md:mb-6 text-black uppercase tracking-wide">
                    {section.title}
                  </h2>
                )}

                <div
                  className="
                    prose max-w-none text-black font-poppins
                    [&_p]:text-[16px]
                    [&_p]:leading-[28px]
                    [&_p]:mb-4
                    [&_li]:text-[16px]
                    [&_li]:leading-[28px]
                    [&_ul]:pl-5
                    [&_ul]:list-disc
                  "
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </section>
            ))}

            {!data.sections && data.content && (
              <div
                className="
                  prose max-w-none text-black font-poppins
                  [&_p]:text-[16px]
                  [&_p]:leading-[28px]
                  [&_li]:text-[16px]
                  [&_li]:leading-[28px]
                "
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            )}
          </div>

          <aside className="hidden md:block w-80 sticky top-20 self-start">
            <div className="bg-[#043F79]/8 rounded-xl p-6 shadow-sm border border-gray-100 max-h-[80vh] overflow-y-auto">
              <h3 className="text-[24px] font-semibold mb-6 text-[#001325]">
                Table Of Content
              </h3>

              <nav className="flex flex-col space-y-1">
                {sections.map((section: any, index: number) => {
                  const isActive = activeId === section.tocId;

                  return (
                    <a
                      key={index}
                      href={`#${section.tocId}`}
                      onClick={() => setActiveId(section.tocId)}
                      className={`px-4 py-2 rounded-md text-[14px] transition-all duration-200 ${
                        isActive
                          ? "bg-[#003d73] text-white font-medium shadow-md"
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
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
