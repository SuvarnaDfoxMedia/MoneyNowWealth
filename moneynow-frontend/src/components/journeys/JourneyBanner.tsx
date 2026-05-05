"use client";

import Image from "next/image";

interface JourneyMetric {
  label: string;
  value: string;
}

interface JourneyBannerProps {
  title: string;
  subtitle: string;
  metrics?: JourneyMetric[];
  imageSrc?: string;
  imageAlt?: string;
}

export default function JourneyBanner({
  title,
  subtitle,
  imageSrc = "/images/financial-wellness-banner-bg.png",
  imageAlt = "Journey banner background",
}: JourneyBannerProps) {
  return (
    <section className="mt-[40px] mb-[40px] bg-[#F8F8F8] font-poppins">
      <div className="mx-auto max-w-full px-4">
        <div className="relative overflow-hidden rounded-[14px] bg-[#17384A] text-[#ffffff]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1280px"
          />

          {/* Added only mobile responsive classes */}
          <div className="relative z-10 flex items-center px-[60px] py-[38px] max-md:px-[20px] max-md:py-[28px]">
            <div className="max-w-full">
              <h1 className="font-poppins text-[24px] font-semibold leading-[1.15] text-[#ffffff] sm:text-[30px] md:text-[50px] max-md:text-[28px] max-md:leading-[1.3]">
                {title}
              </h1>

              <p className="mt-5 max-w-[90%] text-[16px] leading-[32px] text-[#ffffff] font-normal md:text-[20px] max-md:mt-4 max-md:max-w-full max-md:text-[14px] max-md:leading-[24px]">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}