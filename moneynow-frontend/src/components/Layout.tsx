"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
// Chatbot is temporarily disabled across the project to avoid serving inactive assistant flows.
// import ChatbotLayout from "./chatbot/ChatbotLayout";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Chatbot is temporarily disabled across the project to avoid serving inactive assistant flows. */}
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
