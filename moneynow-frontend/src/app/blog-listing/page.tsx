import React from "react";
import LatestArticle from "@/components/Blog-listing-Components/LatestArticle";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/blog-listing", {
    title: "Blog Listing | MoneyNow Wealth",
    description:
      "Browse the latest MoneyNow Wealth articles, insights, and practical guides.",
  });
}

const Page = () => {
  return (
    <>
      <LatestArticle />
    </>
  );
};

export default Page;
