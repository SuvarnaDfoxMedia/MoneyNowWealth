import React from "react";
import Insights from "@/components/Insights/Insights";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata("/user/insights", {
    title: "Insights | MoneyNow Wealth",
    description: "Stay informed with expert insights, market updates, and investment strategies.",
    robots: "noindex,nofollow",
  });
}

export default function InsightsPage() {
  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <Insights />
    </div>
  );
}
