"use client";

import { ReactNode } from "react";

interface StartSipChartBlockProps {
  title: string;
  copy: string;
  children: ReactNode;
}

export default function StartSipChartBlock({
  title,
  copy,
  children,
}: StartSipChartBlockProps) {
  return (
    <div>
      <h3 className="mb-2 font-poppins text-[18px] font-semibold text-[#111111] md:text-[20px]">
        {title}
      </h3>
      <p className="mb-5 text-[12px] leading-5 text-[#4B5563] md:text-[13px]">
        {copy}
      </p>
      {children}
    </div>
  );
}
