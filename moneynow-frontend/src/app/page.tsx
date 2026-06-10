import React from "react";
import Index from "@/components/home/index";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/", {
    title: "MoneyNow Wealth",
    description:
      "MoneyNow Wealth helps you make better financial decisions with actionable insights, calculators, and curated research.",
  });
}

export default function HomePage() {
  return (
    <div>
      <Index />
    </div>
  );
}
