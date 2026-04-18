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
  metrics = [],
  imageSrc = "/images/financial-wellness-banner-bg.png",
  imageAlt = "Journey banner background",
}: JourneyBannerProps) {
  return (
    <section className="mt-[50px] mb-[40px] bg-[#F8F8F8]">
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

          <div className="relative z-10 flex items-center px-[70px] py-[70px]">
            <div className="max-w-full">
              <h1 className="font-poppins text-[24px] font-semibold leading-[1.15] text-[#ffffff] sm:text-[30px] md:text-[50px]">
                {title}
              </h1>
              <p className="mt-5 max-w-[680px] text-[16px] leading-[32px] text-[#ffffff] md:text-[20px]">
                {subtitle}
              </p>

              {metrics.length > 0 ? (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-[14px] border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm"
                    >
                      <p className="text-[12px] uppercase tracking-[0.18em] text-white/72">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-[18px] font-semibold text-white">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
