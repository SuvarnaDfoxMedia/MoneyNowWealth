// SeniorCitizen.tsx
import React from "react";
import Image from "next/image";

const SeniorCitizen = () => {
  return (
    <section className="relative">
      <div className="w-full">
        {/* Desktop / Tablet Image */}
        <div className="hidden sm:block w-full mb-6">
          <Image
            src="/images/senior-citizen-img.png"
            alt="Senior Citizen"
            width={1200}
            height={200}
            sizes="(min-width: 640px) 1200px"
            className="w-full h-auto rounded"
            priority
          />
        </div>

        {/* Mobile Image */}
        <div className="block sm:hidden w-full mb-6">
          <Image
            src="/images/senior-citizen-img-mb.png"
            alt="Senior Citizen Mobile"
            width={640}
            height={300}
            sizes="100vw"
            className="w-full h-auto rounded"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default SeniorCitizen;
