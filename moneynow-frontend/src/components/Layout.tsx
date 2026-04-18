"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatbotLayout from "./chatbot/ChatbotLayout";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative z-[9999]">
        <ChatbotLayout />
      </div>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
