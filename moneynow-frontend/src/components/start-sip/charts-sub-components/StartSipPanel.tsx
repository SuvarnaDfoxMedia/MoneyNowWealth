"use client";

import { ReactNode } from "react";

interface StartSipPanelProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function StartSipPanel({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: StartSipPanelProps) {
  return (
    <section
      className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-200 overflow-hidden ${className}`}
    >
      <div className="mb-5">
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.25em] text-[#0A4A86]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-bold text-slate-900 mt-2 font-poppins">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
