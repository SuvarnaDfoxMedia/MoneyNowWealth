import { Metadata } from "next";
import { PortfolioReviewPage } from "@/components/journeys/PortfolioReviewPage";

export const metadata: Metadata = {
  title: "Review Your Portfolio | MoneyNow Wealth",
  description:
    "Share your details and we'll prepare a thorough review before we call. No obligation. No sales pitch. Just clarity.",
};

export default function ReviewYourPortfolio() {
  return (
    <main>
      <PortfolioReviewPage />
    </main>
  );
}
