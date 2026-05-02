"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
// Chatbot integration is temporarily disabled for lead review; keep import commented instead of deleting it.
// import ChatbotLayout from "./chatbot/ChatbotLayout";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Chatbot integration is temporarily disabled for lead review; keep widget mount commented instead of deleting it. */}
      {/* <div className="relative z-[9999]">
        <ChatbotLayout />
      </div> */}
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
