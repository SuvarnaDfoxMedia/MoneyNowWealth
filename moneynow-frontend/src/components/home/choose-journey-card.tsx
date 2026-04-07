"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface PersonaData {
  badge: string;
  title: string;
  description: string;
  imageSrc: string;
}

const personaCards: PersonaData[] = [
  {
    badge: "Working Professionals Doctors, Architects, Pilots & others",
    title: "See if this feels like you",
    description:
      "Built for people balancing long-term goals, regular income, and the need for a clear investing structure.",
    imageSrc: "/images/second-card-slide-1.png",
  },
  {
    badge: "Salaried employees and busy working couples",
    title: "See if this feels like you",
    description:
      "Designed for households who want to invest steadily, stay organised, and make confident decisions together.",
    imageSrc: "/images/second-card-slide-2.png",
  },
  {
    badge: "Someone starting their investing journey for the first time",
    title: "See if this feels like you",
    description:
      "A simple starting point for anyone who wants to begin goal-based investing with personal guidance.",
    imageSrc: "/images/second-card-slide-3.png",
  },
  {
    badge: "Business owners and self-employed",
    title: "See if this feels like you",
    description:
      "Useful for people with variable income who want a disciplined, long-term investing approach without guesswork.",
    imageSrc: "/images/second-card-slide-4.png",
  },
  {
    badge: "Working Professionals Doctors, Architects, Pilots & others",
    title: "See if this feels like you",
    description:
      "Built for people balancing long-term goals, regular income, and the need for a clear investing structure.",
    imageSrc: "/images/second-card-slide-5.png",
  },
  {
    badge: "Salaried employees and busy working couples",
    title: "See if this feels like you",
    description:
      "Designed for households who want to invest steadily, stay organised, and make confident decisions together.",
    imageSrc: "/images/second-card-slide-6.png",
  },
  {
    badge: "Someone starting their investing journey for the first time",
    title: "See if this feels like you",
    description:
      "A simple starting point for anyone who wants to begin goal-based investing with personal guidance.",
    imageSrc: "/images/second-card-slide-7.png",
  },
];

const ChooseJourneyCard = () => {
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);
  const [isPersonaHovered, setIsPersonaHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPersonaHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setActivePersonaIndex((currentIndex) =>
        currentIndex === personaCards.length - 1 ? 0 : currentIndex + 1,
      );
    }, 2400);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPersonaHovered]);

  const activePersona = personaCards[activePersonaIndex];
  const previousPersonaIndex =
    activePersonaIndex === 0 ? personaCards.length - 1 : activePersonaIndex - 1;

  return (
    <section
      className="mb-[40px] w-full bg-[#F8F8F8] py-10 md:py-[40px]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center md:mb-[42px]">
          <h2 className="mb-3 text-[28px] font-semibold leading-[38px] tracking-[-0.02em] text-black md:text-[40px] md:leading-[1.15]">
            Choose How You&apos;d Like to Begin
          </h2>
          <p className="mx-auto max-w-[560px] text-[15px] font-normal leading-[26px] text-[#1A1A1A] md:text-[18px] md:leading-[31px]">
            Different ways to get started, based on your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[32px] md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/one-crore-journey"
            className="group relative h-[440px] overflow-hidden rounded-[14px] bg-[#d0c3af]"
          >
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/choose-begin-3.png"
                alt="See how your SIP can grow towards Rs 1 Crore and beyond"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/90 group-hover:via-black/60 group-hover:to-transparent" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
              <div className="max-w-[316px] xl:max-w-[332px]">
                <h3 className="text-[23px] font-semibold leading-[140%]  text-[#ffffff] md:text-[24px] xl:text-[24px]">
                  See how your SIP can grow towards ₹1 Crore and beyond
                </h3>
                <p className="mt-3 max-h-0 overflow-hidden text-[16px] leading-[1.5] text-white/92 opacity-0 transition-all duration-700 max-md:max-h-[240px] max-md:opacity-100 group-hover:max-h-[320px] group-hover:opacity-100">
                  Start with an amount you&apos;re comfortable investing each
                  month and see how disciplined SIPs can grow over time towards
                  milestones like ₹25L, ₹50L, and ₹1 Crore without chasing the
                  markets.
                </p>
                <span className="mt-5 inline-flex items-center rounded-[4px] bg-[#ffffff] px-5 py-3 text-[18px] font-medium leading-none text-[#043F79] transition-all duration-300 group-hover:bg-[#F4F8FC] group-hover:text-[#0A3B6C] group-hover:shadow-[0_10px_20px_rgba(255,255,255,0.14)]">
                  See my SIP Journey
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/who-we-work-with"
            className="group relative h-[440px] overflow-hidden rounded-[14px] bg-[#9c9085] transition-all duration-500"
            onMouseEnter={() => setIsPersonaHovered(true)}
            onMouseLeave={() => setIsPersonaHovered(false)}
          >
            <div className="absolute inset-0 z-0">
              {personaCards.map((persona, index) => (
                <div
                  key={`${persona.imageSrc}-${index}`}
                  className={`absolute inset-0 transform-gpu transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    index === activePersonaIndex
                      ? "z-10 translate-x-0"
                      : index === previousPersonaIndex
                        ? "z-0 -translate-x-full"
                        : "z-0 translate-x-full"
                  }`}
                >
                  <Image
                    src={persona.imageSrc}
                    alt={persona.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>
              ))}
              <div className="absolute inset-0 z-20 bg-gradient-to-tr from-black/80 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/90 group-hover:via-black/60 group-hover:to-transparent" />
            </div>

            <div className="absolute left-6 right-6 top-6 z-30 md:left-7 md:right-7 md:top-7">
              <div className="relative mx-auto max-w-[316px] overflow-hidden rounded-[8px] xl:max-w-[332px]">
                <div className="rounded-[8px] bg-[#ffffff]/15 px-[22px] py-[18px] text-left text-[16px] font-medium leading-[150%] text-[#ffffff] transition-all duration-500 ease-in-out group-hover:-translate-y-4 group-hover:opacity-0">
                  {activePersona.badge}
                </div>
              </div>
            </div>

            <div className="relative z-30 flex h-full flex-col justify-end p-6 md:p-7">
              <div className="max-w-[316px] xl:max-w-[332px]">
                <h3 className="text-[23px] font-semibold leading-[140%] text-[#ffffff] md:text-[24px] xl:text-[24px]">
                  See if this feels like you
                </h3>
                <p className="mt-3 max-h-0 overflow-hidden text-[16px] leading-[1.5] text-white/92 opacity-0 transition-all duration-700 max-md:max-h-[240px] max-md:opacity-100 group-hover:max-h-[320px] group-hover:opacity-100">
                  {activePersona.description}
                </p>
                <span className="mt-5 inline-flex items-center rounded-[4px] bg-[#ffffff] px-5 py-3 text-[18px] font-medium leading-none text-[#043F79] transition-all duration-300 group-hover:bg-[#F4F8FC] group-hover:text-[#0A3B6C] group-hover:shadow-[0_10px_20px_rgba(255,255,255,0.14)]">
                  Yes, this is me
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/money-life-check"
            className="group relative h-[440px] overflow-hidden rounded-[14px] bg-[#8d7d3e] transition-all duration-500"
          >
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/choose-begin-3-last.png"
                alt="Get a quick snapshot of your money life"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/90 group-hover:via-black/60 group-hover:to-transparent" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
              <div className="max-w-[316px] xl:max-w-[332px]">
                <h3 className="text-[23px] font-semibold leading-[140%] text-[#ffffff] md:text-[24px] xl:text-[24px]">
                  Get a quick snapshot of your money life
                </h3>
                <p className="mt-3 max-h-0 overflow-hidden text-[16px] leading-[1.5] text-white/92 opacity-0 transition-all duration-500 max-md:max-h-[240px] max-md:opacity-100 group-hover:max-h-[320px] group-hover:opacity-100">
                  Take a simple, 3-minute check to see which parts of your money
                  life may need more attention like habits, protection,
                  investing, goals, and debt.
                </p>
                <p className="mt-3 max-h-0 overflow-hidden text-[16px] font-normal leading-[1.5] text-white/80 opacity-0 transition-all duration-500 max-md:max-h-[140px] max-md:opacity-100 group-hover:max-h-[160px] group-hover:opacity-100">
                  This is for awareness only. It is not a financial plan or
                  investment advice, and it does not rate or compare any mutual
                  fund schemes.
                </p>
                <span className="mt-5 inline-flex items-center rounded-[4px] bg-[#ffffff] px-5 py-3 text-[18px] font-medium leading-none text-[#043F79] transition-all duration-300 group-hover:bg-[#F4F8FC] group-hover:text-[#0A3B6C] group-hover:shadow-[0_10px_20px_rgba(255,255,255,0.14)]">
                  Start my 3-minute check
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ChooseJourneyCard;
