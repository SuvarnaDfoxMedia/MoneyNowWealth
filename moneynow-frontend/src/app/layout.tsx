// app/layout.tsx
import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import LayoutWrapper from "@/app/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "@/components/ScrollToTop";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

/**
 * REQUIRED:
 * .env
 * NEXT_PUBLIC_SITE_URL=https://www.moneynowwealth.com
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL as string;

if (!SITE_URL) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is missing. Please define it in your .env file."
  );
}

/**
 * GLOBAL METADATA
 * ✔ Works for ALL pages
 * ✔ Google self-canonicalizes correctly
 * ✔ No per-page logic needed
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Money Now Wealth",
    template: "%s | Money Now Wealth",
  },

  description: "This is my site",

  icons: {
    icon: "/images/money-now-favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <Toaster position="top-right" />

        <div className="flex flex-col w-full min-h-screen">
          <LayoutWrapper>{children}</LayoutWrapper>
          <ScrollToTop />
        </div>
      </body>
    </html>
  );
}
