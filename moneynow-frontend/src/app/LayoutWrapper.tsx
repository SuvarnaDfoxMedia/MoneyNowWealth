"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import BlogNav from "@/components/BlogNav";
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
  const isBlogPageOrCluster =
    pathname.startsWith("/blog") || pathname.startsWith("/cluster");

  return (
    <>
      {/* Chatbot is temporarily disabled across the project to avoid serving inactive assistant flows. */}
      {/* {!isAuthPage && <ChatbotLayout />} */}

      {/* HEADER LOGIC */}
      {!isAuthPage && (isBlogPageOrCluster ? <BlogNav /> : <Header />)}

      <main className="flex-grow">{children}</main>

      {!isAuthPage && <Footer />}
    </>
  );
}
