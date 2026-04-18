"use client";

import { ReactNode } from "react";

interface JourneyPanelProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function JourneyPanel({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: JourneyPanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5">
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.25em] text-[#0A4A86]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-poppins text-2xl font-bold text-slate-900">
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
