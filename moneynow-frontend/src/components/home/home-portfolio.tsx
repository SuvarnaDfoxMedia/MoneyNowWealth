"use client";

import React from "react";
import Image from "next/image";

interface CardData {
  imageSrc: string;
  title: string;
}

interface HomePortfolioProps {
  title: string;
  subtitle: string;
  cards: CardData[];
}

const HomePortfolio: React.FC<HomePortfolioProps> = ({ title, subtitle, cards }) => {
  return (
<section className="font-poppins w-full mb-[100px] md:mb-[170px]">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4">

        {/* Section Title */}
      <h2 className="font-bold text-[22px] sm:text-[32px] mb-2 text-center">
  {title}
</h2>


        <p className="text-center text-[15px] text-[#6A6A6A] mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {/* Cards Grid - 3 in one row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg"
            >
              <div className="relative w-full h-60 mb-4">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>

              <h3 className="font-semibold text-[18px]">
                {card.title}
              </h3>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default HomePortfolio;
