"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFetchProfile } from "@/hooks/useProfile";
import { useProfileStore } from "@/stores/profileStore";
import DashboardLayoutShell from "@/components/Dashboard/DashboardLayout";

export default function UserBlogLayout({
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
        router.replace("/auth/login");
        router.refresh();
      }
    };

    redirectToHome();
  }, [clearProfile, loading, profile, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-6">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
