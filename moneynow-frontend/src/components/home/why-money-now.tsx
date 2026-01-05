"use client";

import React from "react";
import Image from "next/image";

interface WhyCard {
  iconSrc: string;
  title: string;
}

interface WhyMoneyNowProps {
  sectionTitle: string;
  sectionSubtitle: string;
  cards: WhyCard[];
}

const WhyMoneyNow: React.FC<WhyMoneyNowProps> = ({
  sectionTitle,
  sectionSubtitle,
  cards,
}) => {
  return (
    <section className="font-poppins w-full pt-[20px] pb-[30px] mb-[27px] text-center bg-[#EBEBEB]">
      
      {/* Container (Bootstrap style) */}
      <div className="max-w-7xl mx-auto px-4">

<h2 className="font-bold text-[24px] leading-[30px] sm:text-[32px] sm:leading-[40px] mb-2">
  {sectionTitle}
</h2>



        <p className="text-[15px] text-[#6A6A6A] mb-[25px] max-w-2xl mx-auto">
          {sectionSubtitle}
        </p>

        {/* 3 cards in one row - Bootstrap col-4 style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-white p-4 h-[101px] "
            >
              <div className="flex-shrink-0 w-[70px] h-[70px] rounded-full flex items-center justify-center bg-gradient-to-br from-[#0774DE] to-[#043F79]">
                <Image
                  src={card.iconSrc}
                  alt={card.title}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>

              <p className="font-medium text-[18px]">{card.title}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyMoneyNow;
