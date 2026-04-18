

"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";
import { useFetchProfile } from "@/hooks/useProfile";
import { useProfileStore } from "@/stores/profileStore";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false); // Main Nav Toggle
  const [userMenuOpen, setUserMenuOpen] = useState(false); // Profile Dropdown Toggle
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useFetchProfile();
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const isLoggedIn = !!profile;

  const userInitial = profile?.name?.charAt(0).toUpperCase() || "U";

  // Handle Outside Click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure menus close on navigation
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearProfile();
      setMenuOpen(false);
      setUserMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-[#0B3B6E] shadow-md shadow-black/20 font-sans">
      <div className="flex items-center h-[58px] relative pr-4">
        {/* Logo */}
        <div className="w-[285px] sm:w-[343px] h-[62px] flex items-center">
          <Link href="/" className="relative block w-full h-full">
            <Image
              src="/images/money-now-logo-2.png"
              alt="MoneyNow Logo"
              width={343}
              height={75}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="relative text-white text-[16px] font-medium transition-colors duration-300 hover:text-[#60e6eb]"
          >
            Home
          </Link>
          <Link
            href="/mutual-funds"
            className="relative text-white text-[16px] font-medium transition-colors duration-300 hover:text-[#60e6eb]"
          >
            Mutual Funds
          </Link>
          <Link
            href="#"
            className="relative text-white text-[16px] font-medium transition-colors duration-300 hover:text-[#60e6eb]"
          >
            Investors Edge
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex ml-auto items-center gap-3 sm:gap-5">
          {/* Get in Touch - Desktop Only */}
          <Link
            href="/contact-us"
            className="hidden md:flex relative text-white text-[17px] font-bold items-center gap-2"
          >
            <span className="hover:text-[#60e6eb] transition-colors">
              Get in touch
            </span>
            <FiArrowUpRight className="text-white text-base" />
          </Link>

          {!isLoggedIn ? (
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/auth/login"
                className="border border-white text-white text-base px-[16px] py-[6px] rounded-[4px] font-semibold hover:bg-white hover:text-black transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="bg-white text-[#0B3B6E] text-base px-[16px] py-[6px] rounded-[4px] font-semibold hover:bg-transparent hover:border-white hover:text-white transition-colors"
              >
                Register for Free
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setUserMenuOpen(false);
                }}
                className="md:hidden text-white text-2xl"
              >
                {menuOpen ? <FiX /> : <FiMenu />}
              </button>

              {/* Profile Icon - Visible on Mobile and Desktop */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setMenuOpen(false);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[#004a99] border-2 border-white text-white font-bold text-lg hover:scale-105 transition-transform"
                >
                  {userInitial}
                </button>

                {/* Dropdown Menu - Positioned according to ref image */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-44 bg-white rounded-lg shadow-2xl py-2 z-[100] border border-gray-100 animate-in fade-in zoom-in duration-200">
                    <Link
                      href="/user/dashboard"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-[15px]"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/user/dashboard/profile"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-[15px]"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/user/dashboard/change-password"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-[15px]"
                    >
                      Change Password
                    </Link>
                    <div className="border-t border-gray-100 my-1 mx-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2.5 text-[#ef4444] hover:bg-red-50 text-[15px] font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show Login/Register in Hamburger for non-logged users on mobile */}
          {!isLoggedIn && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white text-2xl"
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Hamburger Sidebar (Site Navigation Only) */}
      {menuOpen && (
        <div className="md:hidden bg-[#0B3B6E] px-6 pb-6 pt-4 space-y-4 text-white shadow-lg border-t border-white/10">
          <Link href="/" className="block text-base font-medium">
            Home
          </Link>
          <Link href="#" className="block text-base font-medium">
            Mutual Funds
          </Link>
          <Link href="#" className="block text-base font-medium">
            Investors Edge
          </Link>

          {!isLoggedIn && (
            <div className="border-t border-white/20 pt-4 flex flex-col gap-4">
              <Link
                href="/auth/login"
                className="border border-white text-center py-2 rounded"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="bg-white text-[#0B3B6E] text-center py-2 rounded"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
