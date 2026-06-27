"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BlogNav from "@/components/BlogNav";
import ErrorBoundary from "@/components/ErrorBoundary";
// Chatbot is temporarily disabled across the project to avoid serving inactive assistant flows.
// import ChatbotLayout from "@/components/chatbot/ChatbotLayout";

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
});

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/auth");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isUserDashboard = pathname.startsWith("/user/dashboard");
  const isUserInsights = pathname.startsWith("/user/insights");
  const isUserBlog = pathname.startsWith("/user/blog");
  const isBlogPageOrCluster =
    pathname.startsWith("/blog") ||
    pathname.startsWith("/cluster") ||
    pathname.startsWith("/user/cluster");
  const shouldHideGlobalChrome =
    isAuthPage ||
    isUserDashboard ||
    isDashboardRoute ||
    isUserInsights ||
    isUserBlog;

  return (
    <>
      {/* Chatbot is temporarily disabled across the project to avoid serving inactive assistant flows. */}
      {/* {!shouldHideGlobalChrome && <ChatbotLayout />} */}

      {/* HEADER LOGIC */}
      {!shouldHideGlobalChrome &&
        (isBlogPageOrCluster ? <BlogNav /> : <Header />)}

      <main className="flex-grow">
        <ErrorBoundary
          fallback={
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <h2>Something went wrong</h2>
              <p>Please refresh the page or try again later.</p>
              <Link href="/">Go to homepage</Link>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      </main>

      {!shouldHideGlobalChrome && <Footer />}
    </>
  );
}
