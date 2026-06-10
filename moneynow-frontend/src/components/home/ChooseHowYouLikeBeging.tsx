import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function ChooseHowYouLikeBeging() {
  return (
    <section
      className="w-full mb-[60px]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[14px] bg-[#073967]">
          <Image
            src="/images/how-you-like-to-begin.png"
            alt="Choose how you'd like to begin"
            fill
            className="object-cover object-[72%_center] md:object-center"
            sizes="(max-width: 768px) 100vw, 1280px"
            priority
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,40,77,0.94)_0%,rgba(4,48,91,0.84)_38%,rgba(4,48,91,0.38)_63%,rgba(4,48,91,0.08)_100%)]" />

          <div className="relative z-10 flex items-center px-5 py-8 md:px-[50px] md:py-[50px]">
            <div className="max-w-[620px] text-left">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2.5 text-[12px] leading-none text-[#ffffff] backdrop-blur-sm md:px-5 md:py-3 md:text-[14px]">
                Ready to get started ?
              </span>

              <h2 className="mt-4 text-[28px] font-semibold leading-[120%] tracking-[-0.03em] text-[#ffffff] md:mt-5 md:text-[40px] xl:text-[40px]">
                Choose How You&apos;d Like To Begin
              </h2>

              <p className="mt-3 max-w-[280px] text-[15px] leading-[150%] text-[#ffffff] md:mt-4 md:max-w-none md:text-[18px]">
                Different ways to get started, based on your needs.
              </p>

              <Link
                href="/auth/register"
                className="mt-6 inline-flex items-center gap-3 rounded-[4px] bg-[#ffffff] px-4 py-2.5 text-[16px] font-medium leading-none text-[#043F79] transition-colors duration-300 hover:bg-[#F5F8FC] md:mt-8 md:gap-4 md:px-5 md:py-3 md:text-[18px]"
              >
                <span>Register for free</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#043F79] text-[#ffffff] md:h-8 md:w-8">
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChooseHowYouLikeBeging;
