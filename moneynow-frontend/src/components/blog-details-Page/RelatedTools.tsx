"use client";

import React from "react";
import Link from "next/link";
import { Calculator, Target, TrendingUp } from "lucide-react";

const RelatedTools = () => {
  return (
    <div className="mt-10 font-poppins">
      <h3 className="text-[20px] font-bold text-[#07112C] mb-6">Tools Related to Article</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            title: "Lumpsum Calculator",
            description: "Calculate the future value of a one-time investment.",
            href: "/user/dashboard/calculators/lumpsum",
            icon: <TrendingUp className="w-8 h-8 text-[#0A4A87]" />,
          },
          {
            title: "SIP Calculator",
            description: "Estimate returns from regular SIP investments.",
            href: "/user/dashboard/calculators/sip",
            icon: <Calculator className="w-8 h-8 text-[#0A4A87]" />,
          },
          {
            title: "Goal Setting Calculator",
            description: "Plan investments required to achieve your financial goals.",
            href: "/user/dashboard/calculators/goal",
            icon: <Target className="w-8 h-8 text-[#0A4A87]" />,
          },
        ].map((t, idx) => (
          <div key={idx} className="bg-white border border-[#E3E8EF] rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center w-[70px] h-[70px] rounded-xl bg-[#F2F6FD]">
              {t.icon}
            </div>
            <div className="flex flex-col justify-center flex-1 pr-2">
              <h4 className="text-[15px] font-semibold mb-1.5 leading-[22px]">{t.title}</h4>
              <p className="text-[13px] text-[#4A5B83] leading-snug mb-2 line-clamp-2">{t.description}</p>
              <Link href={t.href} className="text-[#0A4A87] hover:text-[#083B6C] text-[13px] font-bold inline-flex items-center gap-1">
                <span>Calculate Now</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedTools;
