import React from "react";
import Index from "@/components/home/index";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata("/", {
    title: "MoneyNow Wealth",
    description:
      "MoneyNow Wealth helps you make better financial decisions with actionable insights, calculators, and curated research.",
  });
}

export default async function HomePage() {
  const seo = await resolveSeoEntry("/");

  return (
    <div>
      <SeoJsonLd schema={seo?.page_schema} />
      <Index />
    </div>
  );
}
