"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Dashboard/Sidebar";
import { useFetchProfile } from "@/hooks/useProfile";
import { useProfileStore } from "@/stores/profileStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, loading } = useFetchProfile();
  const clearProfile = useProfileStore((state) => state.clearProfile);

  useEffect(() => {
    if (loading || profile) return;

    const redirectToHome = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/user/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Ignore logout cleanup failures and still redirect.
      } finally {
        clearProfile();
        router.replace("/");
        router.refresh();
      }
    };

    redirectToHome();
  }, [clearProfile, loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-6 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen font-inter bg-slate-50 px-6 py-6">
      <div className="flex gap-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
