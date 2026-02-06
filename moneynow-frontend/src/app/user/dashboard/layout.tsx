"use client";

import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-inter bg-slate-50 px-6 py-6">
      <div className="flex gap-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
