import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import PartnerWithUsSection from "./PartnerWithUsSection";
import PartnersWhatYouGet from "./PartnersWhatYouGet";
import HowPartnershipWork from "./HowPartnershipWork";

const PartnerWithUs = () => {
  const data = {
    title: "Partner with Us",
  };
  const bgImage = "/images/about-bg.png";

  return (
    <div>
      <div
        className="relative w-full py-10 mb-[0px] text-center bg-cover bg-center bg-no-repeat font-poppins"
        style={{
          backgroundImage: `url('${bgImage}')`,
        }}
      >
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-[30px] md:text-[42px] font-semibold text-white capitalize tracking-tight leading-[1.2]">
            {data.title || "Partner with Us"}
          </h1>

          <div className="flex justify-center items-center gap-2 text-white mt-4 font-medium text-sm md:text-base leading-[28px] capitalize">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <ArrowRight size={18} className="text-white" strokeWidth={2.5} />
            <span>{data.title || "Partner with Us"}</span>
          </div>
        </div>
      </div>

      <PartnerWithUsSection />
      <PartnersWhatYouGet />
      <HowPartnershipWork />
    </div>
  );
};

export default PartnerWithUs;
