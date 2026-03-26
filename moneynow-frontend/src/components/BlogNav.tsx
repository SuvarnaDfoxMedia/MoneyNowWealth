

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiChevronDown, HiMenu, HiX, HiChevronLeft } from "react-icons/hi";
import { FiChevronRight } from "react-icons/fi";
import { usePathname } from "next/navigation";

interface Cluster {
  _id: string;
  title: string;
  slug: string;
}

const BlogNav = () => {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileMenu, setActiveMobileMenu] = useState<string | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  /* ---------------- Fetch Clusters ---------------- */
  useEffect(() => {
    const fetchClusters = async () => {
      if (!API_BASE) return;

      try {
        const res = await fetch(`${API_BASE}/api/cluster`);
        const json = await res.json();

        const clusterList = json?.clusters || json?.data?.clusters || [];
        if (Array.isArray(clusterList)) {
          setClusters(
            clusterList.map((c: any) => ({
              _id: c._id,
              title: c.title,
              slug: c.slug,
            })),
          );
        }
      } catch (err) {
        console.error("Cluster fetch error", err);
      }
    };

    fetchClusters();
  }, [API_BASE]);

  /* ---------------- Close mobile menu on route change ---------------- */
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveMobileMenu(null);
  }, [pathname]);

  const blogMenus = [
    {
      name: "Trending Blogs",
      links: [
        { name: "Tax Saving", href: "#" },
        { name: "Investment", href: "#" },
      ],
    },
    {
      name: "Clusters",
      links: clusters.map((cluster) => ({
        name: cluster.title,
        href: `/cluster/${cluster.slug}`,
      })),
    },
    {
      name: "Fund Types",
      links: [
        { name: "Equity", href: "#" },
        { name: "Debt", href: "#" },
      ],
    },
  ];

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50 font-inter">
      <div className="px-4 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/login-page-logo.png"
            alt="MoneyNow Logo"
            width={268}
            height={40}
            className="w-[185px] sm:w-[268px] h-auto"
          />
          <span className="hidden sm:block ">|</span>
          <span className="hidden sm:block uppercase text-[20px] font-bold ">
            Blog
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-8">
          {blogMenus.map((menu) => (
            <div key={menu.name} className="relative group">
              <span className="flex items-center gap-1 uppercase text-[14px] font-semibold cursor-pointer">
                {menu.name}
                <HiChevronDown className="w-4 h-4" />
              </span>

              {menu.links.length > 0 && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-white shadow-lg min-w-[320px] rounded-md py-2 border-t"
                  style={{ borderTop: "2px solid #043F79" }}
                >
                  {menu.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="px-4 py-2 text-[14px] hover:bg-gray-100 border-b last:border-b-0"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className=" md:inline-flex px-4 py-2 bg-[#043F79] text-white rounded text-[14px] uppercase"
          >
            Go To Website
          </Link>

          <button
            className="md:hidden text-xl font-semibold"
            onClick={() => setMobileMenuOpen(true)}
          >
            <HiMenu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[75%] bg-white h-full flex flex-col ">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              {activeMobileMenu ? (
                <button
                  onClick={() => setActiveMobileMenu(null)}
                  className="text-xl font-semibold"
                >
                  <HiChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <span />
              )}

              <span className="font-semibold text-[16px]">
                {activeMobileMenu || ""}
              </span>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveMobileMenu(null);
                }}
                className="text-xl font-semibold"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Main Menu */}
            {!activeMobileMenu && (
              <div className="flex flex-col">
                {blogMenus.map((menu) => (
                  <button
                    key={menu.name}
                    onClick={() =>
                      menu.links.length && setActiveMobileMenu(menu.name)
                    }
                    className="flex justify-between items-center px-5 py-4 border-b uppercase text-[14px] font-semibold"
                  >
                    {menu.name}
                    {menu.links.length > 0 && (
                      <FiChevronRight className="w-5 h-5" />
                    )}
                  </button>
                ))}

                <div className="p-4">
                  <Link
                    href="/"
                    className="inline-flex items-center bg-[#043F79] text-white px-6 py-3 rounded-md uppercase text-[14px]"
                  >
                    Go To Website
                  </Link>
                </div>
              </div>
            )}

            {/* Sub Menu */}
            {activeMobileMenu && (
              <div className="flex flex-col">
                {blogMenus
                  .find((m) => m.name === activeMobileMenu)
                  ?.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-5 py-4 border-b text-[14px]"
                    >
                      {link.name}
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* ===== 20% OVERLAY (Hamburger area) ===== */}
          <div className="w-[25%]" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};

export default BlogNav;
