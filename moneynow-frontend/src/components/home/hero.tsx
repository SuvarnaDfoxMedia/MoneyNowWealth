
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div
      /* UPDATED: Changed pt-[20px] to pt-0 to remove gap from sticky header */
      className="relative w-full font-sans pt-[0px] lg:pt-0 mb-[40px] lg:mb-[40px]" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="relative mx-auto flex flex-col lg:flex-row">

        {/* ---- LEFT CONTENT ---- */}
        <div
          className="
          flex-1
          bg-[url('/images/left-bg-image.png')]
          bg-cover bg-center
          px-6 lg:pl-[70px]
          py-6 lg:py-12 pt-[50px]
          flex flex-col justify-center
          rounded-lg
        "
        >
          <h1
            className="
            text-[28px] leading-[40px]
            sm:text-[40px] sm:leading-[50px]
            lg:text-[52px] lg:leading-[70px]
            font-semibold text-[#1A1A1A]
          "
          >
            Invest in Mutual Funds <br />
            with <span className="text-[#04407B] font-bold">Clarity</span> and <br />
            <span className="text-[#04407B] font-bold">Confidence</span>
          </h1>

          <p
            className="
            mt-5 lg:mt-8
            text-[15px]
            sm:text-[18px]
            lg:text-[20px]
            max-w-lg leading-relaxed
          "
          >
            Everything you need to start and manage your mutual fund investments, in one place.
          </p>

          <p
            className="
            mt-5 lg:mt-8
            font-semibold
            text-[15px]
            sm:text-[16px]
            lg:text-[18px]
          "
          >
            Not sure where to start? We're here to help.
          </p>

          {/* Buttons */}
          <div className="mt-6 lg:mt-10 flex flex-wrap gap-4">
            <button className="
              group flex items-center gap-3
              bg-[#04407B] hover:bg-[#032F5A]
              text-white
              pl-5 pr-2 py-2 sm:pl-6
              rounded-md font-medium
              text-[14px] sm:text-[15px] lg:text-[16px]
              transition-colors
            ">
              Start a SIP
              <span className="bg-white p-1 rounded-sm text-[#04407B]">
                <ArrowUpRight size={18} />
              </span>
            </button>

            <button className="
              group flex items-center gap-3
              bg-[#04407B] hover:bg-[#032F5A]
              text-white
              pl-5 pr-2 py-2 sm:pl-6
              rounded-md font-medium
              text-[14px] sm:text-[15px] lg:text-[16px]
              transition-colors
            ">
              Invest Lump Sum
              <span className="bg-white p-1 rounded-sm text-[#04407B]">
                <ArrowUpRight size={18} />
              </span>
            </button>

            <button className="
              group flex items-center gap-3
              bg-[#04407B] hover:bg-[#032F5A]
              text-white
              pl-5 pr-2 py-2 sm:pl-6
              rounded-md font-medium
              text-[14px] sm:text-[15px] lg:text-[16px]
              transition-colors
            ">
              Talk to Us
              <span className="bg-white p-1 rounded-sm text-[#04407B]">
                <ArrowUpRight size={18} />
              </span>
            </button>
          </div>
        </div>

        {/* ---- RIGHT IMAGE ---- */}
        <div
          className="
          flex-1 relative
          max-w-full lg:max-w-[600px]
          /* UPDATED: Changed pt-6 to pt-0 and lg:pt-28 to lg:pt-8 to pull image up */
          pt-0 pb-0 lg:pt-8 lg:pb-0 
          px-0 lg:pr-[40px]
        "
        >
          <div className="relative z-10">
            <img
              src="/images/banner-image.png"
              alt="Investment Clarity"
              className="w-full h-auto block rounded-[8px]"
            />
          </div>
        </div>

      </div>
    </div>
  );
}