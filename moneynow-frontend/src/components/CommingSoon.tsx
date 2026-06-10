"use client";

import React from "react";
import Image from "next/image";

const ComingSoon: React.FC = () => {
  return (
    <section className="flex flex-col sm:flex-row w-screen min-h-screen bg-white overflow-hidden pt-10 md:pt-0 px-4 md:px-5">
      <div className="flex flex-col justify-center w-full sm:w-1/2 p-10 sm:p-16 lg:p-24 order-2 sm:order-1">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-black tracking-tight uppercase">
          We're
        </h2>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black uppercase mt-2 mb-8 leading-tight">
          Coming Soon
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 leading-relaxed max-w-md">
          A new experience is under development to deliver value, clarity, and
          reliability.
        </p>
      </div>

      <div className="relative w-full h-[50vh] sm:h-screen sm:w-1/2 order-1 sm:order-2 sm:p-10">
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src="/images/Coming-Soon-img.jpeg"
            alt="Coming Soon Visual"
            fill
            className="object-cover rounded-[4px]"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
