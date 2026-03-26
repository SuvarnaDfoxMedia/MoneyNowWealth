"use client";
import CMSBanner from "./CmsBanner";
import React, { useEffect, useState } from "react";

const TermsPage = ({ data }: { data: any }) => {
  const [activeId, setActiveId] = useState("");

  // ✅ FIXED FUNCTION NAME
  const getId = (title: string) =>
    title ? title.toLowerCase().replace(/\s+/g, "-") : "";

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries.filter((entry) => entry.isIntersecting);

        if (visibleSections.length > 0) {
          const topSection = visibleSections.reduce((prev, curr) => {
            const prevTop = Math.abs(prev.boundingClientRect.top);
            const currTop = Math.abs(curr.boundingClientRect.top);
            return currTop < prevTop ? curr : prev;
          });

          setActiveId(topSection.target.id);
        }
      },
      {
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0.1,
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [data]);

  if (!data) return null;

  return (
    <div className="font-poppins">
      {/* Banner */}
      <CMSBanner
        title={data.title || "Website Usage Terms and Conditions"}
        bgImage="/images/privacy-bg.png"
      />

      {/* ✅ MOBILE TOC WITH 60px MARGIN */}
      <div className="md:hidden px-4 mt-6 mb-[60px]">
        <div className="bg-[#f0f4f8] rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-[20px] font-semibold mb-4 text-[#001325]">
            Table Of Content
          </h3>

          <nav className="flex flex-col space-y-1">
            {data.sections?.map((section: any, index: number) => {
              const id = getId(section.title);
              const isActive = activeId === id;

              return (
                <a
                  key={index}
                  href={`#${id}`}
                  className={`px-3 py-2 rounded-md text-[14px] transition-all duration-200
                    ${
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

      {/* Main */}
      <div className="max-w-7xl mx-auto  mb-[60px]">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* LEFT CONTENT */}
          <div className="flex-1 space-y-10 md:space-y-12">
            {data.sections?.map((section: any, index: number) => {
              const sectionId = getId(section.title);

              return (
                <section
                  key={index}
                  id={sectionId}
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
              );
            })}

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
                {data.sections?.map((section: any, index: number) => {
                  const id = getId(section.title);
                  const isActive = activeId === id;

                  return (
                    <a
                      key={index}
                      href={`#${id}`}
                      className={`px-4 py-2 rounded-md text-[14px] transition-all duration-200
                        ${
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
