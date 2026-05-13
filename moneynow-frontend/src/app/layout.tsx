import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";
import LayoutWrapper from "@/app/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "@/components/ScrollToTop";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: {
    default: "MoneyNow Wealth",
    template: "%s | MoneyNow Wealth",
  },
  description:
    "MoneyNow Wealth helps you make better financial decisions with actionable insights, calculators, and curated research.",
  openGraph: {
    type: "website",
    siteName: "MoneyNow Wealth",
    title: "MoneyNow Wealth",
    description:
      "MoneyNow Wealth helps you make better financial decisions with actionable insights, calculators, and curated research.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "MoneyNow Wealth",
    description:
      "MoneyNow Wealth helps you make better financial decisions with actionable insights, calculators, and curated research.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/images/money-now-favicon.png"
        />
      </head>

      <body className="antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <Toaster position="top-right" />
          <div className="flex flex-col w-full min-h-screen">
            <LayoutWrapper>{children}</LayoutWrapper>
            <ScrollToTop />
          </div>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
