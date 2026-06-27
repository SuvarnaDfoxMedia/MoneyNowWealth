"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useProfileStore } from "@/stores/profileStore";

const data = [
  {
    title: "Understanding your goals and priorities",
    desc: "We start with your life, not a product list - children’s education, a home, retirement, or simply feeling more secure about the future.",
    expandedDesc:
      "We begin by understanding what matters most to you - your key goals, time frames, and comfort with market ups and downs. The plan follows from your life, not the other way around.",
    icon: "/images/howwehelpyou-white-1.png",
    hoverIcon: "/images/howwehelpyou-blue-1.png",
  },
  {
    title: "Helping you invest in mutual funds",
    desc: "The right SIP, lump sum, or portfolio structure, aligned to your actual plan - not a generic template.",
    expandedDesc:
      "Mutual funds can be used in different ways depending on your goal and time horizon. We help you organise your investments accordingly, using SIPs, lump sum allocations, and portfolio structures that fit your plan.",
    icon: "/images/howwehelpyou-white-2.png",
    hoverIcon: "/images/howwehelpyou-blue-2.png",
  },
  {
    title: "Tracking your portfolio",
    desc: "Anytime access through web and app, plus regular reviews so your investments evolve with your life and the markets.",
    expandedDesc:
      "You can view your portfolio online through the MoneyNow platform - via website and mobile access - and we encourage periodic reviews so contribution levels, fund choices, and allocations adjust as your life and market conditions change.",
    icon: "/images/howwehelpyou-white-3.png",
    hoverIcon: "/images/howwehelpyou-blue-3.png",
  },
  {
    title: "Protection and risk",
    desc: "Because building and protecting your money are two sides of the same conversation.",
    expandedDesc:
      "Along with investments, we discuss the role of insurance and other protections in safeguarding your family’s finances. Where relevant, we help you think through what kind of cover may be appropriate for your situation.",
    icon: "/images/howwehelpyou-white-4.png",
    hoverIcon: "/images/howwehelpyou-blue-4.png",
  },
  {
    title: "Staying invested when it gets hard",
    desc: "The biggest risk isn’t a market move. It’s reacting the wrong way when it happens - we’re here for that moment.",
    expandedDesc:
      "Markets will be volatile and life will change. We are available when things feel uncertain, so your long-term plan stays on track. This is often where the relationship matters most.",
    icon: "/images/howwehelpyou-white-5.png",
    hoverIcon: "/images/howwehelpyou-blue-5.png",
  },
];

function AboutHowWeHelpYou() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const profile = useProfileStore((state) => state.profile);
  const isLoggedIn = Boolean(profile);
  const firstRow = data.slice(0, 3);
  const secondRow = data.slice(3);

  const toggleCard = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cardsRef.current &&
        !cardsRef.current.contains(event.target as Node)
      ) {
        setExpanded(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderCard = (
    item: (typeof data)[number],
    index: number,
    extraClassName = "",
  ) => {
    const isOpen = expanded === index;

    return (
      <div
        key={index}
        onClick={(e) => e.stopPropagation()}
        className={`
          group relative flex min-h-[320px] flex-col rounded-[14px] p-6
          text-white transition-all duration-300
          ${
            isOpen
              ? "bg-white text-black shadow-lg -translate-y-1"
              : "bg-gradient-to-br from-[#043F79] to-[#001D3A]"
          }
          hover:bg-none hover:bg-white
          hover:text-black hover:shadow-lg hover:-translate-y-1
          ${extraClassName}
        `}
      >
        <span
          className={`
            absolute right-6 top-4 text-[36px] md:text-[48px] font-semibold leading-none transition-colors
            ${isOpen ? "text-[#043F79]" : "text-[rgba(255,255,255,0.12)]"}
            group-hover:text-[#043F79]
          `}
        >
          {index + 1}
        </span>

        <div className="relative mb-5 h-[70px] w-[70px]">
          <Image
            src={item.icon}
            alt=""
            fill
            aria-hidden="true"
            className={`object-contain transition-opacity duration-300 ${
              isOpen ? "opacity-0" : "opacity-100"
            } group-hover:opacity-0`}
          />
          <Image
            src={item.hoverIcon}
            alt=""
            fill
            aria-hidden="true"
            className={`object-contain transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            } group-hover:opacity-100`}
          />
        </div>

        <h3
          className={`
            mb-4 text-[18px] md:text-[20px] font-semibold leading-[26px] md:leading-[28px] group-hover:text-black
            ${isOpen ? "text-black" : ""}
          `}
        >
          {item.title}
        </h3>

        <p
          className={`
            overflow-hidden text-[15px] md:text-[16px] leading-[24px] md:leading-[28px]
            transition-all duration-300 group-hover:text-gray-700
            ${isOpen ? "text-gray-700" : "text-[#ffffff]"}
            ${isOpen ? "mb-4" : "mb-1"}
            ${isOpen ? "max-h-[500px]" : "max-h-[60px]"}
          `}
        >
          {item.desc}
          {isOpen && item.expandedDesc ? ` ${item.expandedDesc}` : ""}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCard(index);
          }}
          className={`
            mt-auto self-start rounded-[6px] px-4 py-2 text-[14px] md:text-[16px] transition
            ${isOpen ? "bg-[#0d3b66] text-white" : "bg-white text-[#043F79]"}
            group-hover:bg-[#0d3b66] group-hover:text-white
          `}
        >
          {isOpen ? "Show Less" : "Learn More"}
        </button>
      </div>
    );
  };

  return (
    <>
      <section
        className="bg-[#F8F8F8] py-[60px]"
        onClick={() => setExpanded(null)}
      >
        <div ref={cardsRef} className="max-w-7xl mx-auto px-4">
          <h2 className="mb-12 text-center text-[28px] font-semibold md:text-[36px]">
            How We Help You
          </h2>

          <div className="grid items-start gap-6 md:grid-cols-3">
            {firstRow.map((item, index) => renderCard(item, index))}
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-center gap-6">
            {secondRow.map((item, index) =>
              renderCard(
                item,
                index + firstRow.length,
                "w-full md:max-w-[calc(33.333%-16px)]",
              ),
            )}
          </div>
        </div>
      </section>

      {!isLoggedIn && (
        <section className="pt-[60px]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-[12px] px-6 py-[46px] text-center shadow-[0_6px_20px_rgba(4,63,121,0.12)] md:px-12 md:py-10">
              <p className="mx-auto max-w-5xl text-[16px] md:text-[20px] leading-[28px] md:leading-[36px] font-medium mb-[40px]">
                Moneynow is built on two decades of working with real families,
                real goals, and real market cycles. We combine that experience
                with a simple idea: make it easier for people to organise their
                money, stay disciplined, and invest with clarity and confidence
                over the long term.
              </p>

              <Link
                href="/auth/register"
                className="inline-flex py-[14px] items-center justify-center rounded-full bg-[#0B4A88] px-[35px] lg:px-[65px] text-[16px] lg:text-[18px] font-medium text-[#ffffff] transition hover:bg-[#043F79]"
              >
                Register for free &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default AboutHowWeHelpYou;
