"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface CardData {
  category: string;
  title: string;
  description: string;
  imageSrc: string;
  gridClass: string;
  href: string;
}

const journeyCards: CardData[] = [
  {
    category: "Monthly",
    title: "Start Monthly Investing (SIP)",
    description: "Build wealth through consistent contributions over time.",
    imageSrc: "/images/choose-begin-1.png",
    gridClass: "md:col-start-1 md:row-start-1 md:row-end-3",
    href: "/start-sip",
  },
  {
    category: "Lump Sum",
    title: "Invest a lump sum",
    description: "Explore options when you are ready to put capital to work.",
    imageSrc: "/images/choose-begin-2.png",
    gridClass: "md:col-start-2 md:row-start-1 md:row-end-2",
    href: "/mutual-funds",
  },
  {
    category: "Journey",
    title: "Your Rs 1 crore journey",
    description: "Turn a long-term ambition into a clearer investing path.",
    imageSrc: "/images/choose-begin-3.png",
    gridClass: "md:col-start-3 md:row-start-1 md:row-end-3",
    href: "/contact-us",
  },
  {
    category: "Assess",
    title: "Financial Wellness Assessment",
    description: "See how healthy your current money habits look today.",
    imageSrc: "/images/choose-begin-4.png",
    gridClass: "md:col-start-1 md:row-start-3 md:row-end-4",
    href: "/financial-wellness",
  },
  {
    category: "Explore",
    title: "Explore Investment Options",
    description: "Browse public investment content and fund categories.",
    imageSrc: "/images/choose-begin-5.png",
    gridClass: "md:col-start-2 md:row-start-2 md:row-end-4",
    href: "/mutual-funds",
  },
  {
    category: "Support",
    title: "Need Assistance",
    description: "Connect with the team if you want a guided next step.",
    imageSrc: "/images/choose-begin-6.png",
    gridClass: "md:col-start-3 md:row-start-3 md:row-end-4",
    href: "/contact-us",
  },
];

const ChooseJourneyCard = () => {
  return (
    <section
      className="mb-[40px] w-full bg-[#F8F8F8] py-10 md:py-[40px]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-4 text-[28px] font-semibold leading-[38px] md:text-[40px] md:leading-tight">
            Choose How You&apos;d Like to Begin
          </h2>
          <p className="text-[15px] font-normal leading-[26px] md:text-[18px]">
            Different ways to get started, based on your needs.
          </p>
        </div>

        <div className="grid auto-rows-[180px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 md:auto-rows-[200px]">
          {journeyCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative overflow-hidden rounded-[24px] shadow-sm ${card.gridClass}`}
            >
              <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>

              <div className="relative z-10 flex h-full flex-col items-start justify-center p-6 text-left md:p-8">
                <span className="mb-1 text-[12px] font-medium uppercase tracking-wider text-white md:mb-[8px] md:text-[16px]">
                  {card.category}
                </span>

                <h3 className="mb-2 text-[18px] font-semibold leading-tight text-white md:mb-[16px] md:text-[23px]">
                  {card.title}
                </h3>

                <p className="text-[13px] font-normal text-white md:text-[16px]">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChooseJourneyCard;
