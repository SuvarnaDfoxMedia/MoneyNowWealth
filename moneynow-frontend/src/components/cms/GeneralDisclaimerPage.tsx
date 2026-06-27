"use client";

import React, { useState } from "react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import CMSBanner from "./CmsBanner";
import { sanitizeHtml } from "@/utils/sanitize";

const GeneralDisclaimerPage = ({ data }: { data: any }) => {
  // First section open by default
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!data) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="font-poppins mb-16 bg-white">
      <CMSBanner
        title={data.title || "General Disclaimer"}
        bgImage="/images/privacy-bg.png"
      />

      <div className="max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-12">
        <div className="lg:col-span-10 lg:col-start-2 space-y-6">
          {data.sections?.map((section: any, index: number) => (
            <div
              key={index}
              className={`rounded-[14px] overflow-hidden transition-all duration-300 ${
                openIndex === index
                  ? "bg-[#043F79]/5 shadow-sm"
                  : "bg-[#043F79]/5"
              }`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-[24px] text-left outline-none"
              >
                <span className="text-[18px] md:text-[20px] font-semibold leading-[28px] capitalize text-black">
                  {index + 1}. {section.title}
                </span>

                <span className="text-black">
                  {openIndex === index ? (
                    <FaChevronUp size={18} />
                  ) : (
                    <FaChevronDown size={18} />
                  )}
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index
                    ? "max-h-[4000px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-8 md:px-8 md:pb-10">
                  <div className="bg-white rounded-xl p-8 md:p-12 border border-gray-100 shadow-sm">
                    {index === 0 && (
                      <div className="mb-8 text-[15px] md:text-[16px] space-y-1 text-black border-b border-gray-100 pb-6 leading-[28px]">
                        <p className="font-bold uppercase tracking-wide">
                          MONEYNOW – {data.title || "General Disclaimer"}
                        </p>
                        <p className="pt-4 font-medium capitalize">
                          {data.title || "General Disclaimer"}
                        </p>
                        <p>Effective date: June 1st, 2026</p>
                        <p>Last updated on: June 1st, 2026</p>
                      </div>
                    )}

                    <div
                      className="
                        text-[15px] md:text-[16px]
                        text-black
                        leading-[28px]
                        prose
                        max-w-none
                        font-poppins
                        prose-p:mb-5
                        prose-strong:font-bold
                        prose-ul:list-disc
                        prose-ul:pl-6
                      "
                      dangerouslySetInnerHTML={sanitizeHtml(section.content)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeneralDisclaimerPage;
