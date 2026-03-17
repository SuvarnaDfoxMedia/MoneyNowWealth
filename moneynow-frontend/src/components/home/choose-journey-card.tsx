"use client";

import React from "react";
import Image from "next/image";

interface CardData {
  category: string;
  title: string;
  description: string;
  imageSrc: string;
  gridClass: string;
}

const journeyCards: CardData[] = [
  {
    category: "Monthly",
    title: "Start Monthly Investing (SIP)",
    description: "Build wealth through consistent contributions over time.",
    imageSrc: "/images/choose-begin-1.png",
    gridClass: "md:col-start-1 md:row-start-1 md:row-end-3",
  },
  {
    category: "Lump",
    title: "Invest a lump sum",
    description: "Plan and track progress toward your long-term wealth goal.",
    imageSrc: "/images/choose-begin-2.png",
    gridClass: "md:col-start-2 md:row-start-1 md:row-end-2",
  },
  {
    category: "Journey",
    title: "Your ₹1 crore journey",
    description: "Deploy capital when you have it ready.",
    imageSrc: "/images/choose-begin-3.png",
    gridClass: "md:col-start-3 md:row-start-1 md:row-end-3",
  },
  {
    category: "Risk",
    title: "Know Your Risk Appetite",
    description: "Deploy capital when you have it ready to go.",
    imageSrc: "/images/choose-begin-4.png",
    gridClass: "md:col-start-1 md:row-start-3 md:row-end-4",
  },
  {
    category: "Investment",
    title: "Explore Investment Options",
    description: "Build wealth through consistent contributions over time.",
    imageSrc: "/images/choose-begin-5.png",
    gridClass: "md:col-start-2 md:row-start-2 md:row-end-4",
  },
  {
    category: "Support",
    title: "Need Assistance",
    description: "Plan and track progress toward your goal.",
    imageSrc: "/images/choose-begin-6.png",
    gridClass: "md:col-start-3 md:row-start-3 md:row-end-4",
  },
];

const ChooseJourneyCard = () => {
  return (
    <section className="w-full py-10 md:py-[40px] mb-[40px] bg-[#F8F8F8]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section (Centered) */}
<div className="text-center mb-8 md:mb-12">
  <h2 className="text-[28px] md:text-[40px] font-semibold  mb-4 md:mb-4 leading-[38px] md:leading-tight">
    Choose How You’d Like to Begin
  </h2>
  <p className="text-[15px] md:text-[18px] font-normal leading-[26px]">
    Different ways to get started, based on your needs.
  </p>
</div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[180px] md:auto-rows-[200px]">
          {journeyCards.map((card, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-[24px] cursor-pointer shadow-sm ${card.gridClass}`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Overlay for text readability */}
                <div className="absolute inset-0 bg-black/10 md:bg-black/10" />
              </div>

              {/* Card Content - All Text forced to #ffffff */}
              <div className="relative z-10 h-full p-6 md:p-8 flex flex-col justify-center items-start text-left">
                
                <span className="text-[12px] md:text-[16px] font-medium mb-1 md:mb-[8px] uppercase tracking-wider text-[#ffffff]">
                  {card.category}
                </span>

                <h3 className="text-[18px] md:text-[23px] font-semibold leading-tight mb-2 md:mb-[16px] text-[#ffffff]">
                  {card.title}
                </h3>

                <p className="text-[13px] md:text-[16px] font-normal text-[#ffffff]">
                  {card.description}
                </p>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChooseJourneyCard;