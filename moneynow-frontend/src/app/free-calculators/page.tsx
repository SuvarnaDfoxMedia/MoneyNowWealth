import FreeCalculators from "@/components/Dashboard/FreeCalculators";
import React from "react";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/free-calculators", {
    title: "Free Calculators | MoneyNow",
    description:
      "Use our free financial calculators for SIP, Lumpsum, Retirement Planning, Loan EMI, and more.",
  });
}

const FreeCalculatorsPage = () => {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <FreeCalculators />
    </div>
  );
};

export default FreeCalculatorsPage;
