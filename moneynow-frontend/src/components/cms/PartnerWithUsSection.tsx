"use client";

import React from "react";
import Image from "next/image";
import PartnerForm from "./PartnerForm"; //  Import form

const partnerPoints = [
  "Individual mutual fund distributors / IFAs",
  "Small distribution and wealth firms without their own technology platform",
  "New professionals willing to obtain the required NISM certification and AMFI Registration Number (ARN) before starting their mutual fund distribution journey under a structured compliance set-up",
];

const PartnerWithUsSection = () => {
  return (
    <section className="font-poppins bg-[#F8F8F8] pt-[60px]">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mx-auto max-w-5xl text-center text-[16px] md:text-[21px] font-medium leading-[28px] md:leading-[38px]">
          A Digital Mutual Fund Platform With Human Support - Designed For
          Distributors Who Want To Focus More On Clients And Less On Building
          Technology
        </p>

        <div className="py-[60px] grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* LEFT SIDE */}
          <div className="lg:col-span-5">
            <h2 className="mb-[30px] text-center lg:text-left text-[24px] md:text-[32px] font-semibold leading-tight ">
              Who Can Partner With Us
            </h2>

            <div className="rounded-[8px] bg-[#0A2F57] px-5 py-6 text-white shadow-[0_8px_24px_rgba(4,63,121,0.22)] md:px-6">
              <ul className="space-y-5">
                {partnerPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Image
                      src="/images/partner-left-checkmark.png"
                      alt="Checkmark"
                      width={44}
                      height={44}
                      className=" shrink-0 self-start"
                    />
                    <span className="text-[16px] md:text-[18px] mb-0 leading-[26px] md:leading-[32px]">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-[14px] md:text-[15px] leading-[24px] md:leading-[28px] text-white">
                All partnerships are structured within applicable SEBI and AMFI
                regulations for mutual fund distributors.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - FORM COMPONENT */}
          <div className="lg:col-span-7">
            <PartnerForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerWithUsSection;
