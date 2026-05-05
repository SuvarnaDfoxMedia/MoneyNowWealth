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
      <h3 className="text-2xl font-bold text-slate-900 mb-4 font-poppins">
        {title}
      </h3>
      <p className="text-slate-600 mb-5">{copy}</p>
      {children}
    </div>
  );
}
