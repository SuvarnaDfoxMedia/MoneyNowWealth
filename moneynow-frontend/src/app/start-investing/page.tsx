import { Metadata } from "next";
import { StartInvestingPage } from "@/components/journeys/StartInvestingPage";

export const metadata: Metadata = {
  title: "Start Investing | MoneyNow Wealth",
  description:
    "Share your details and we'll help you take the first step. No pressure. No jargon. Just a clear path forward.",
};

export default function StartInvesting() {
  return (
    <main>
      <StartInvestingPage />
    </main>
  );
}
