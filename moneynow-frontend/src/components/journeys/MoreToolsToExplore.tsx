"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TOOL_LINKS = [
  {
    title: "Plan another goal",
    copy: "Estimate how much SIP you may need for a different goal amount, time frame, or return assumption.",
    href: "/free-calculators",
    cta: "Open goal calculator",
    icon: "target",
  },
  {
    title: "See what a lumpsum could do",
    copy: "Check how a one-time investment today could grow alongside your SIPs over the years.",
    href: "/free-calculators",
    cta: "Open lumpsum calculator",
    icon: "chart",
  },
  {
    title: "Understand inflation on your goals",
    copy: "See how inflation changes the real value of your future goals and why starting early matters.",
    href: "/free-calculators",
    cta: "Open inflation calculator",
    icon: "trend",
  },
] as const;

function ToolGlyph({ icon }: { icon: (typeof TOOL_LINKS)[number]["icon"] }) {
  if (icon === "target") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M21 12h-3M12 19v3M6 12H3M17 7l3-3" />
      </svg>
    );
  }

  if (icon === "chart") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15l3-3 3 2 5-6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19h16M6 16l4-4 3 2 5-6" />
      <path d="M17 8h3v3" />
    </svg>
  );
}

export default function MoreToolsToExplore() {
  return (
<section className="bg-gradient-to-b from-[#F8F8F8] to-[#ffffff] py-14 mt-[40px]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-full text-center">
          <h2 className="text-[40px] font-semibold tracking-[-0.03em]">
            More Tools To Explore
          </h2>
          <p className="mt-4 text-[18px] leading-8">
            Use these simple tools to look at your money from a few different
            angles
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TOOL_LINKS.map((card) => (
            <div
              key={card.title}
              className="rounded-[14px] border border-[#E6E6E6] bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[8px] bg-[#E8EEF6] text-[#0E4A89]">
                <ToolGlyph icon={card.icon} />
              </div>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">
                {card.title}
              </h3>
              <p className="mt-4 text-[16px] leading-[28px]">
                {card.copy}
              </p>
              <Link
                href={card.href}
                className="mt-7 inline-flex items-center gap-3 rounded-[6px] bg-[#043F79] px-5 py-3 text-[16px] font-medium text-white transition hover:bg-[#0A3C6F]"
              >
                {card.cta}
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#ffffff]" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
