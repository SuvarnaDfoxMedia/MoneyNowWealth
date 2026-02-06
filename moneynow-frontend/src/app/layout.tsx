// import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";
// import "./globals.css";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";

// const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400","500","600","700"] });
// const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400","500","600","700"] });

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <head>
//         {/* Favicon from images folder */}
//         <link rel="icon" type="image/png" href="/images/money-now-favicon.png" />
//       </head>
//       <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} antialiased`}>
//         <div className="flex flex-col w-full min-h-screen">
//           <Header />
//           <main className="flex-grow">{children}</main>
//           <Footer />
//         </div>
//       </body>
//     </html>
//   );
// }

import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/app/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "@/components/ScrollToTop";

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
