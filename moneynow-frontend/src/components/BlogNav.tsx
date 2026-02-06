// "use client";

// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { HiChevronDown } from "react-icons/hi";
// import { usePathname } from "next/navigation";

// interface Cluster {
//   _id: string;
//   title: string;
//   slug: string; // added slug
// }

// const BlogNav = () => {
//   const pathname = usePathname();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
//   const [clusters, setClusters] = useState<Cluster[]>([]);

//   // Base API URL from .env
//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//   // ---------------- Fetch all clusters dynamically ----------------
//   useEffect(() => {
//     const fetchClusters = async () => {
//       if (!API_BASE) {
//         console.error(
//           "NEXT_PUBLIC_API_BASE is undefined. Check your .env file!",
//         );
//         return;
//       }

//       try {
//         const res = await fetch(`${API_BASE}/api/cluster`); // <-- corrected
//         if (!res.ok) {
//           const text = await res.text();
//           console.error("API returned non-JSON response:", text);
//           return;
//         }

//         const json = await res.json();
//         console.log("Fetched clusters:", json);

//         const clusterList = json?.clusters || json?.data?.clusters || [];
//         if (Array.isArray(clusterList)) {
//           setClusters(
//             clusterList.map((c: any) => ({
//               _id: c._id,
//               title: c.title || `Cluster ${c._id.slice(-5)}`,
//               slug: c.slug, // include slug
//             })),
//           );
//         }
//       } catch (error) {
//         console.error("Failed to fetch clusters", error);
//       }
//     };

//     fetchClusters();
//   }, [API_BASE]);

//   // ---------------- Close mobile menu on route change ----------------
//   useEffect(() => {
//     setMobileMenuOpen(false);
//     setMobileDropdown(null);
//   }, [pathname]);

//   const menuText = "uppercase text-[14px] font-semibold";

//   const blogMenus = [
//     {
//       name: "Trending Blogs",
//       links: [
//         { name: "Tax Saving", href: "#" },
//         { name: "Investment", href: "#" },
//       ],
//     },
//     {
//       name: "Clusters",
//       links: clusters.map((cluster) => ({
//         name: cluster.title,
//         href: `/cluster/${cluster.slug}`, // use slug instead of _id
//       })),
//     },
//     {
//       name: "Fund Types",
//       links: [
//         { name: "Equity", href: "#" },
//         { name: "Debt", href: "#" },
//       ],
//     },
//   ];

//   return (
//     <header className="w-full shadow-sm bg-white sticky top-0 z-50 font-inter">
//       <div className="max-w-full px-4 mx-auto py-2 flex items-center justify-between">
//         {/* Logo */}
//         <Link href="/" className="flex items-center gap-2">
//           <Image
//             src="/images/moneynow-logo.png"
//             alt="MoneyNow Logo"
//             width={268}
//             height={40}
//             sizes="(max-width: 640px) 160px, 268px"
//             className="w-[185px] sm:w-[268px] h-auto"
//           />
//           <span className="hidden sm:block text-[#043F79]">|</span>
//           <span className="hidden sm:block uppercase text-[20px] font-bold text-[#043F79]">
//             Blog
//           </span>
//         </Link>

//         {/* Desktop Menu */}
//         <nav className="hidden md:flex items-center gap-8">
//           {blogMenus.map((menu) => (
//             <div key={menu.name} className="relative group">
//               <span
//                 className={`flex items-center gap-1 cursor-pointer ${menuText}`}
//               >
//                 {menu.name}
//                 <HiChevronDown className="w-4 h-4" />
//               </span>

//               {menu.links.length > 0 && (
//                 <div
//                   className="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-white shadow-lg
//                   min-w-[320px] rounded-md py-2 border-t"
//                   style={{ borderTop: "2px solid #043F79" }}
//                 >
//                   {menu.links.map((link) => (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       className="px-4 py-2 hover:bg-gray-100 text-[14px] font-medium border-b border-[#E8E8E8] last:border-b-0"
//                     >
//                       {link.name}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* Right Side */}
//         <div className="flex items-center gap-5">
//           <Link
//             href="/"
//             className="md:hidden px-[10px] py-[8px] rounded-[5px] bg-[#043F79] text-white text-[10px] font-medium uppercase"
//           >
//             Go To Website
//           </Link>

//           <Link
//             href="/"
//             className="hidden md:inline-flex px-[15px] py-[10px] rounded-[5px] bg-[#043F79] text-white text-[14px] font-medium uppercase"
//           >
//             Go To Website
//           </Link>

//           <button
//             className="md:hidden font-semibold leading-none"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
//           >
//             <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
//           </button>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {mobileMenuOpen && (
//         <nav className="md:hidden w-full flex flex-col gap-1 px-2 py-4 bg-white shadow-sm">
//           {blogMenus.map((menu) => (
//             <div key={menu.name}>
//               <button
//                 onClick={() =>
//                   setMobileDropdown(
//                     mobileDropdown === menu.name ? null : menu.name,
//                   )
//                 }
//                 className="flex justify-between items-center w-full px-4 py-2 uppercase text-[14px] font-semibold"
//               >
//                 {menu.name}
//                 <HiChevronDown
//                   className={`w-4 h-4 transition-transform ${
//                     mobileDropdown === menu.name ? "rotate-180" : ""
//                   }`}
//                 />
//               </button>

//               {mobileDropdown === menu.name && (
//                 <div className="flex flex-col pl-6 pr-4">
//                   {menu.links.map((link) => (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       className="px-4 py-2 hover:bg-gray-100 text-[14px]"
//                     >
//                       {link.name}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </nav>
//       )}
//     </header>
//   );
// };

// export default BlogNav;

// "use client";

// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { HiChevronDown } from "react-icons/hi";
// import { usePathname } from "next/navigation";

// interface Cluster {
//   _id: string;
//   title: string;
//   slug: string;
// }

// const BlogNav = () => {
//   const pathname = usePathname();

//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [activeMobileMenu, setActiveMobileMenu] = useState<string | null>(null);
//   const [clusters, setClusters] = useState<Cluster[]>([]);

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//   /* ---------------- Fetch Clusters ---------------- */
//   useEffect(() => {
//     const fetchClusters = async () => {
//       if (!API_BASE) return;

//       try {
//         const res = await fetch(`${API_BASE}/api/cluster`);
//         const json = await res.json();

//         const clusterList = json?.clusters || json?.data?.clusters || [];
//         if (Array.isArray(clusterList)) {
//           setClusters(
//             clusterList.map((c: any) => ({
//               _id: c._id,
//               title: c.title,
//               slug: c.slug,
//             })),
//           );
//         }
//       } catch (err) {
//         console.error("Cluster fetch error", err);
//       }
//     };

//     fetchClusters();
//   }, [API_BASE]);

//   /* ---------------- Close mobile menu on route change ---------------- */
//   useEffect(() => {
//     setMobileMenuOpen(false);
//     setActiveMobileMenu(null);
//   }, [pathname]);

//   const blogMenus = [
//     {
//       name: "Trending Blogs",
//       links: [
//         { name: "Tax Saving", href: "#" },
//         { name: "Investment", href: "#" },
//       ],
//     },
//     {
//       name: "Clusters",
//       links: clusters.map((cluster) => ({
//         name: cluster.title,
//         href: `/cluster/${cluster.slug}`,
//       })),
//     },
//     {
//       name: "Fund Types",
//       links: [
//         { name: "Equity", href: "#" },
//         { name: "Debt", href: "#" },
//       ],
//     },
//   ];

//   return (
//     <header className="w-full bg-white shadow-sm sticky top-0 z-50 font-inter">
//       {/* ================= HEADER BAR ================= */}
//       <div className="px-4 py-2 flex items-center justify-between">
//         <Link href="/" className="flex items-center gap-2">
//           <Image
//             src="/images/moneynow-logo.png"
//             alt="MoneyNow Logo"
//             width={268}
//             height={40}
//             className="w-[185px] sm:w-[268px] h-auto"
//           />
//           <span className="hidden sm:block text-[#043F79]">|</span>
//           <span className="hidden sm:block uppercase text-[20px] font-bold text-[#043F79]">
//             Blog
//           </span>
//         </Link>

//         {/* Desktop Menu */}
//         <nav className="hidden md:flex gap-8">
//           {blogMenus.map((menu) => (
//             <div key={menu.name} className="relative group">
//               <span className="flex items-center gap-1 uppercase text-[14px] font-semibold cursor-pointer">
//                 {menu.name}
//                 <HiChevronDown className="w-4 h-4" />
//               </span>

//               {menu.links.length > 0 && (
//                 <div
//                   className="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-white shadow-lg min-w-[320px] rounded-md py-2 border-t"
//                   style={{ borderTop: "2px solid #043F79" }}
//                 >
//                   {menu.links.map((link) => (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       className="px-4 py-2 text-[14px] hover:bg-gray-100 border-b last:border-b-0"
//                     >
//                       {link.name}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* Right Buttons */}
//         <div className="flex items-center gap-4">
//           <Link
//             href="/"
//             className=" md:inline-flex px-4 py-2 bg-[#043F79] text-white rounded text-[14px] uppercase"
//           >
//             Go To Website
//           </Link>

//           <button
//             className="md:hidden text-xl font-semibold"
//             onClick={() => setMobileMenuOpen(true)}
//           >
//             ☰
//           </button>
//         </div>
//       </div>

//       {/* ================= MOBILE MENU ================= */}
//       {mobileMenuOpen && (
//         <div className="md:hidden fixed inset-0 z-50 flex">
//           {/* ===== 80% MENU PANEL ===== */}
//           <div className="w-[75%] bg-white h-full flex flex-col ">
//             {/* Header */}
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               {activeMobileMenu ? (
//                 <button
//                   onClick={() => setActiveMobileMenu(null)}
//                   className="text-xl font-semibold"
//                 >
//                   ←
//                 </button>
//               ) : (
//                 <span />
//               )}

//               <span className="font-semibold text-[16px]">
//                 {activeMobileMenu || ""}
//               </span>

//               <button
//                 onClick={() => {
//                   setMobileMenuOpen(false);
//                   setActiveMobileMenu(null);
//                 }}
//                 className="text-xl font-semibold"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Main Menu */}
//             {!activeMobileMenu && (
//               <div className="flex flex-col">
//                 {blogMenus.map((menu) => (
//                   <button
//                     key={menu.name}
//                     onClick={() =>
//                       menu.links.length && setActiveMobileMenu(menu.name)
//                     }
//                     className="flex justify-between items-center px-5 py-4 border-b uppercase text-[14px] font-semibold"
//                   >
//                     {menu.name}
//                     {menu.links.length > 0 && <span>›</span>}
//                   </button>
//                 ))}

//                 <div className="p-4">
//                   <Link
//                     href="/"
//                     className="inline-flex items-center bg-[#043F79] text-white px-6 py-3 rounded-md uppercase text-[14px]"
//                   >
//                     Go To Website
//                   </Link>
//                 </div>
//               </div>
//             )}

//             {/* Sub Menu */}
//             {activeMobileMenu && (
//               <div className="flex flex-col">
//                 {blogMenus
//                   .find((m) => m.name === activeMobileMenu)
//                   ?.links.map((link) => (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       onClick={() => setMobileMenuOpen(false)}
//                       className="px-5 py-4 border-b text-[14px]"
//                     >
//                       {link.name}
//                     </Link>
//                   ))}
//               </div>
//             )}
//           </div>

//           {/* ===== 20% OVERLAY (Hamburger area) ===== */}
//           <div className="w-[25%]" onClick={() => setMobileMenuOpen(false)} />
//         </div>
//       )}
//     </header>
//   );
// };

// export default BlogNav;

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
      {/* ================= HEADER BAR ================= */}
      <div className="px-4 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/moneynow-logo.png"
            alt="MoneyNow Logo"
            width={268}
            height={40}
            className="w-[185px] sm:w-[268px] h-auto"
          />
          <span className="hidden sm:block text-[#043F79]">|</span>
          <span className="hidden sm:block uppercase text-[20px] font-bold text-[#043F79]">
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

      {/* ================= MOBILE MENU ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* ===== 80% MENU PANEL ===== */}
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
