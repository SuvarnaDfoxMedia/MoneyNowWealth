"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CMSBannerProps {
  title: string;
  bgImage: string;
}

const CMSBanner = ({ title, bgImage }: CMSBannerProps) => {
  return (
    <div
      className="relative w-full py-10 mb-[60px] text-center bg-cover bg-center bg-no-repeat font-poppins"
      style={{
        backgroundImage: `url('${bgImage}')`,
      }}
    >
      {/* 100% Opacity - No overlay */}
      <div className="relative z-10 container mx-auto px-4">
        <h1 className="text-[30px] md:text-[42px] font-semibold text-white capitalize tracking-tight leading-[1.2]">
          {title}
        </h1>

        <div className="flex justify-center items-center gap-2 text-white mt-4 font-medium text-sm md:text-base leading-[28px] capitalize">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <ArrowRight size={18} className="text-white" strokeWidth={2.5} />
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
};

export default CMSBanner;
