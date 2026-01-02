// "use client";

// import { usePathname } from "next/navigation";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";

// export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();

//   // Auth pages where Header/Footer should not appear
//   const authRoutes = [
//     "/auth/login",
//     "/auth/register",
//     "/auth/forgot-password",
//     "/auth/set-new-password",
//     "/blog-listing",
//   ];

//   const hideLayout = authRoutes.includes(pathname);

//   return (
//     <>
//       {!hideLayout && <Header />}
//       <main className="flex-grow">{children}</main>
//       {!hideLayout && <Footer />}
//     </>
//   );
// }


// "use client";

// import { usePathname } from "next/navigation";
// import Header from "@/components/Header";
// import BlogNav from "@/components/BlogNav";
// import Footer from "@/components/Footer";

// export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();

//   const isAuthPage = pathname.startsWith("/auth");
//   const isBlogPage = pathname.startsWith("/blog");

//   return (
//     <>
//       {/* HEADER LOGIC */}
//       {!isAuthPage && (
//         isBlogPage ? <BlogNav /> : <Header />
//       )}

//       <main className="flex-grow">{children}</main>

//       {!isAuthPage && <Footer />}
//     </>
//   );
// }


"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import BlogNav from "@/components/BlogNav";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/auth");
  const isBlogPageOrCluster = pathname.startsWith("/blog") || pathname.startsWith("/cluster");

  return (
    <>
      {/* HEADER LOGIC */}
      {!isAuthPage && (
        isBlogPageOrCluster ? <BlogNav /> : <Header />
      )}

      <main className="flex-grow">{children}</main>

      {!isAuthPage && <Footer />}
    </>
  );
}
