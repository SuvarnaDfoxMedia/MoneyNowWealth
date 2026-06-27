"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import DashboardIcon from "./DashboardIcon";
import { sidebarMenuItems } from "@/lib/dashboard-data";
import Image from "next/image";

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[250px] flex-col overflow-hidden xl:flex"
      style={{
        background: "linear-gradient(180deg,#0B1E47 0%, #0A1A3E 100%)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
       
<div
  className="flex h-[60px] items-center px-[22px]"
  style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
>
  <Link href="/" aria-label="Go to home page">
    <Image
      src="/images/moneynow-white-logo.png"
      alt="MoneyNow Logo"
      width={180}
      height={40}
      className="object-contain"
      priority
    />
  </Link>
</div>

    

        <nav className="px-3 py-4">
        {sidebarMenuItems.map((item) => {
          const isActive =
            item.href === "/user/dashboard"
              ? pathname === item.href
              : item.id === "insights"
                ? pathname.startsWith(item.href) || pathname.startsWith("/user/blog")
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="mb-[8px] flex h-[42px] items-center rounded-[10px] px-[14px] text-[15px] no-underline transition-colors duration-200"
              style={{
                color: isActive ? "white" : "#ffffff",
                background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <DashboardIcon name={item.icon} className="mr-3 h-[18px] w-[18px] opacity-100" />
              {item.label}
            </Link>
          );
        })}
        </nav>
      </div>

      <div
        className="mx-[14px] mb-[14px] shrink-0 rounded-[12px] p-4"
        style={{ background: "#12316E", border: "1px solid #2E4F8A" }}
      >
        <div className="mb-[10px] flex items-center gap-2 text-[14px] font-semibold text-white">
          <Star className="h-4 w-4" /> EDGE
        </div>
        <p className="text-[13px] leading-[22px]" style={{ color: "#C5D2F0" }}>
          Unlock premium research &amp; advanced tools.
        </p>
        <button
          className="mt-4 h-[40px] w-full rounded-[10px] border-none bg-white text-[13px] font-semibold"
          style={{ color: "#07112C" }}
        >
          Try EDGE Free
        </button>
      </div>
    </aside>
  );
}
