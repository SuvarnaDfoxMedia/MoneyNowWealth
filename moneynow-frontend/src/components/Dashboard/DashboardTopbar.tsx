"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Search, Settings, User, X } from "lucide-react";
import { useFetchProfile } from "@/hooks/useProfile";
import { useProfileStore } from "@/stores/profileStore";

export default function DashboardTopbar() {
  const router = useRouter();
  const { profile, profileImageUrl } = useFetchProfile();
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() ?? "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (API_BASE) {
        await fetch(`${API_BASE}/api/auth/user/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } catch {
      // Best-effort cleanup; local logout state still proceeds.
    } finally {
      setMenuOpen(false);
      clearProfile();
      router.replace("/auth/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#E7ECF5] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[62px] max-w-[1440px] items-center gap-5 px-4 md:px-6">
        <div className="hidden items-center gap-7 text-[15px] font-medium text-[#3D4E79] lg:flex">
          <a href="#" className="transition-colors hover:text-[#0A4A87]">Tools</a>
          <a href="#" className="transition-colors hover:text-[#0A4A87]">Resources</a>
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A1BF]" />
          <input
            type="text"
            placeholder="Search tools, calculators, insights..."
            className="h-[40px] w-full rounded-md border border-[#DEE5F1] bg-[#F7F9FD] pl-11 pr-4 text-[14px] text-[#10234A] outline-none placeholder:text-[#9AA7C4] focus:border-[#0A4A87]/50"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="grid h-10 w-10 place-items-center rounded-md text-[#4A5B83] transition-all duration-300 hover:bg-[#F2F6FD]">
            <Bell className="h-5 w-5" />
          </button>
          <button className="h-[38px] rounded-md bg-[#0A4A87] px-5 text-[14px]  font-semibold text-white transition-all duration-300 hover:bg-[#083B6C]">
            + Explore
          </button>
          {profile ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-md border border-[#DEE5F1] px-2 py-1 transition-all duration-300 hover:bg-[#F2F6FD]"
              >
                <div
                  className="h-[34px] w-[34px] overflow-hidden rounded-full border border-[#DEE5F1] bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${profileImageUrl || "/images/dfox-img.png"}')`,
                  }}
                  title={profile.name || profile.email}
                />
                <ChevronDown className={`h-4 w-4 text-[#5E6B85] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[48px] z-50 w-[230px] overflow-hidden rounded-[14px] border border-[#E7ECF5] bg-white shadow-[0_12px_32px_rgba(7,17,44,0.12)]">
                  <div className="flex items-center justify-between border-b border-[#EDF1F7] px-3 py-2">
                    <p className="max-w-[170px] truncate text-[12px] font-semibold text-[#23345A]">
                      {profile.name || profile.email}
                    </p>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md p-1 text-[#7A88A7] hover:bg-[#F3F6FB]"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/user/dashboard/profile"
                      onClick={() => setMenuOpen(false)}
                      className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#2E3D62] hover:bg-[#F2F6FD]"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/user/dashboard/change-password"
                      onClick={() => setMenuOpen(false)}
                      className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#2E3D62] hover:bg-[#F2F6FD]"
                    >
                      <Settings className="h-4 w-4" />
                      Change Password
                    </Link>
                    <Link
                      href="/user/dashboard/settings"
                      onClick={() => setMenuOpen(false)}
                      className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#2E3D62] hover:bg-[#F2F6FD]"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#C0392B] hover:bg-[#FFF3F1]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="h-[38px] rounded-md border border-[#DEE5F1] px-4 text-[13px] font-semibold text-[#3D4E79] transition-all duration-300 hover:bg-[#F2F6FD] inline-flex items-center"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
