"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

interface CardData {
  imageSrc: string;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
}

interface ChooseJourneyCardProps {
  title: string;
  subtitle: string;
  cards: CardData[];
}

const ChooseJourneyCard: React.FC<ChooseJourneyCardProps> = ({
  title,
  subtitle,
  cards,
}) => {
  return (
    <section className="font-poppins w-full mb-[27px]">

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4">

       <h2 className="font-bold text-[24px] sm:text-[32px] mb-2 text-center">
  {title}
</h2>


        <p className="text-center text-[15px] text-[#6A6A6A] mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 border border-[#EBEBEB]"
            >
              <div className="relative w-full h-60 mb-4">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  fill
                  className="rounded-md object-cover"
                />
              </div>

<h3 className="font-bold sm:font-semibold text-[20px] sm:text-[18px] mb-3">
  {card.title}
</h3>

              <p className="text-gray-700 text-[15px] mb-4 leading-[25px]">
                {card.description}
              </p>

              <Link
                href={card.linkHref}
                className="inline-flex font-semibold items-center uppercase text-[16px] text-[#043F79]"
              >
                {card.linkText}
                <FaArrowRight className="ml-2 text-[16px]" />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ChooseJourneyCard;
