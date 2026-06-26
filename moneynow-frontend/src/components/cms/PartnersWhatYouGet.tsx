import React from "react";
import Image from "next/image";

const cards = [
  {
    title: "Ready Digital Platform",
    description:
      "Offer your clients online access to view and transact in mutual funds without investing in your own tech stack or infrastructure.",
    image: "/images/what-you-get-icon-1.png",
  },
  {
    title: "Operational Support",
    description:
      "Use standardized onboarding, KYC, transaction routing, and service processes so you can spend more time with clients.",
    image: "/images/what-you-get-icon-2.png",
  },
  {
    title: "Goal-Linked Journeys & Tools",
    description:
      "Use simple goal-based journeys, SIP structures, calculators, and portfolio views to help clients understand and stay committed to their plans.",
    image: "/images/what-you-get-icon-3.png",
  },
  {
    title: "Relationship-Friendly Model",
    description:
      "You remain the primary point of contact for your clients. Our systems are designed to support your practice, not replace your relationships.",
    image: "/images/what-you-get-icon-4.png",
  },
];

function PartnersWhatYouGet() {
  return (
    <section className="font-poppins py-[60px]">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center text-[28px] md:text-[42px] font-semibold leading-tight text-[#111111]">
          What You Get
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:mt-14 xl:grid-cols-4">
          {cards.map(({ title, description, image }) => (
            <div
              key={title}
              className="rounded-[18px] border border-[#DCE2E8] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(17,17,17,0.08)] md:min-h-[312px]"
            >
              <div className="mb-5">
                <Image
                  src={image}
                  alt={title}
                  width={50}
                  height={50}
                  className="h-[50px] w-[50px] object-contain"
                />
              </div>

              <h3 className=" text-[18px] md:text-[20px] font-semibold leading-[26px] md:leading-[30px]">
                {title}
              </h3>

              <p className="mt-5 text-[15px] md:text-[16px] leading-[24px] md:leading-[28px] ">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PartnersWhatYouGet;
