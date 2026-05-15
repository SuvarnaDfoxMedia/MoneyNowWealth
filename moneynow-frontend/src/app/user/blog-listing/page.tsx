import React from "react";
import LatestArticle from "@/components/Blog-listing-Components/LatestArticle";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata("/user/blog-listing", {
    title: "Blog Listing | MoneyNow Wealth",
    description:
      "Browse the latest MoneyNow Wealth articles, insights, and practical guides.",
    robots: "noindex,nofollow",
  });
}

const Page = async () => {
  const seo = await resolveSeoEntry("/blog-listing");

  return (
    <>
      <SeoJsonLd schema={seo?.page_schema} />
      <LatestArticle />
    </>
  );
};

export default Page;
