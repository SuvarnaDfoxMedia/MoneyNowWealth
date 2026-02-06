// "use client";

// import Image from "next/image";
// import { useState, useEffect, useRef } from "react";
// import { HiChevronDown } from "react-icons/hi";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { useFetchProfile } from "@/hooks/useProfile";

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// const Header = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [publicMobileOpen, setPublicMobileOpen] = useState(false);
//   const [userMobileOpen, setUserMobileOpen] = useState(false);
//   const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
//   const [profileOpen, setProfileOpen] = useState(false);

//   const profileRef = useRef<HTMLDivElement | null>(null);

//   //  Get profile from hook (Zustand store)
//   const { profile, loading } = useFetchProfile();

//   //  logged in if profile exists
//   const isLoggedIn = !!profile;

//   /* ---------- MENU DATA ---------- */
//   const publicMenu = [
//     { name: "Home", href: "/" },
//     { name: "Company", links: [{ name: "About Us", href: "/company/about" }] },
//     {
//       name: "Mutual Fund",
//       links: [
//         { name: "MF List", href: "/mutual-fund/mf-list" },
//         { name: "Tools", href: "/mutual-fund/tools" },
//       ],
//     },
//     {
//       name: "Insurance",
//       links: [{ name: "Health", href: "/insurance/health" }],
//     },
//     {
//       name: "Resources",
//       links: [
//         { name: "Blogs", href: "/blog-listing" },
//         { name: "Calculators", href: "/free-calculators" },
//       ],
//     },
//     { name: "Contact Us", href: "/contact-us" },
//   ];

//   const userMenu = [
//     { name: "Dashboard", href: "/user/dashboard" },
//     { name: "Profile", href: "/user/dashboard/profile" },
//     { name: "Change Password", href: "/user/dashboard/change-password" },
//   ];

//   const userMobileExtraMenu = [
//     { name: "Subscription", href: "/user/subscription" },
//     { name: "Newsletter", href: "/user/newsletter" },
//     {
//       name: "Premium Calculators",
//       children: [
//         { name: "Advanced SIP", href: "/calculators/advanced-sip" },
//         {
//           name: "Advanced Step-Up SIP",
//           href: "/calculators/advanced-stepup-sip",
//         },
//         { name: "Goal Planner", href: "/calculators/goal-planner" },
//         { name: "Retirement Planner", href: "/calculators/retirement-planner" },
//       ],
//     },
//   ];

//   const [userCalcOpen, setUserCalcOpen] = useState(false);

//   //  Get first letter dynamically
//   const getInitial = () => {
//     if (!profile) return "U";

//     const name =
//       `${profile.firstname || ""} ${profile.lastname || ""}`.trim() ||
//       profile.name ||
//       profile.email ||
//       "User";

//     return name.charAt(0).toUpperCase();
//   };

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         profileRef.current &&
//         !profileRef.current.contains(event.target as Node)
//       ) {
//         setProfileOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   /* ---------- RESET MENUS ON ROUTE CHANGE ---------- */
//   useEffect(() => {
//     setPublicMobileOpen(false);
//     setUserMobileOpen(false);
//     setMobileDropdown(null);
//     setProfileOpen(false);
//   }, [pathname]);

//   /* ---------- LOGOUT ---------- */
//   const handleLogout = async () => {
//     try {
//       await fetch(`${API_BASE}/api/auth/logout`, {
//         method: "POST",
//         credentials: "include",
//       });
//     } finally {
//       setUserMobileOpen(false);
//       router.push("/");
//       router.refresh();
//     }
//   };

//   const menuItemStyle = "uppercase text-[14px] font-semibold";

//   return (
//     <header className="w-full sticky top-0 z-50 bg-white shadow-sm font-inter">
//       <div className="px-4 py-2 flex items-center justify-between">
//         {/* LOGO */}
//         <Link href="/" className="block">
//           <Image
//             src="/images/moneynow-logo.png"
//             alt="MoneyNow Logo"
//             width={260}
//             height={48}
//             priority
//             className="w-[200px] sm:w-[220px] md:w-[260px] h-auto"
//           />
//         </Link>

//         {/* DESKTOP MENU */}
//         <nav className="hidden lg:flex items-center gap-8">
//           {publicMenu.map((item) =>
//             item.links ? (
//               <div key={item.name} className="relative group">
//                 <span
//                   className={`flex items-center gap-1 cursor-pointer ${menuItemStyle}`}
//                 >
//                   {item.name} <HiChevronDown />
//                 </span>
//                 <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-md rounded-md py-2 min-w-[180px] border-t-2 border-[#043F79]">
//                   {item.links.map((link) => (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       className="block px-4 py-2 text-sm hover:bg-gray-100"
//                     >
//                       {link.name}
//                     </Link>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <Link key={item.name} href={item.href} className={menuItemStyle}>
//                 {item.name}
//               </Link>
//             ),
//           )}
//         </nav>

//         {/* DESKTOP RIGHT */}
//         <div className="hidden lg:flex items-center gap-3">
//           {isLoggedIn ? (
//             <div className="relative" ref={profileRef}>
//               <button
//                 onClick={() => setProfileOpen(!profileOpen)}
//                 className="w-9 h-9 rounded-full bg-[#043F79] text-white font-semibold"
//                 aria-label="Open profile menu"
//               >
//                 {loading ? "..." : getInitial()}
//               </button>

//               {profileOpen && (
//                 <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-sm border-[#EBEBEB] py-2">
//                   {userMenu.map((item) => (
//                     <Link
//                       key={item.name}
//                       href={item.href}
//                       className="block px-4 py-2 hover:bg-gray-100"
//                     >
//                       {item.name}
//                     </Link>
//                   ))}
//                   <button
//                     onClick={handleLogout}
//                     className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <>
//               <Link
//                 href="/auth/login"
//                 className="px-4 py-2 bg-[#043F79] text-white rounded-md uppercase"
//               >
//                 Sign In
//               </Link>
//               <Link
//                 href="/auth/register"
//                 className="px-4 py-2 border border-[#043F79] text-[#043F79] rounded-md uppercase"
//               >
//                 Register
//               </Link>
//             </>
//           )}
//         </div>

//         {/* MOBILE BUTTONS */}
//         <div className="lg:hidden flex items-center gap-4">
//           {/* PUBLIC MENU BUTTON */}
//           <button
//             className="text-2xl"
//             onClick={() => {
//               setPublicMobileOpen(!publicMobileOpen);
//               setUserMobileOpen(false);
//             }}
//             aria-label="Toggle menu"
//           >
//             {publicMobileOpen ? "✕" : "☰"}
//           </button>

//           {/* USER PROFILE BUTTON (ONLY WHEN LOGGED IN) */}
//           {isLoggedIn && (
//             <button
//               className="w-8 h-8 rounded-full bg-[#043F79] text-white font-semibold"
//               onClick={() => {
//                 setUserMobileOpen(!userMobileOpen);
//                 setPublicMobileOpen(false);
//               }}
//               aria-label="Open user menu"
//             >
//               {loading ? "..." : getInitial()}
//             </button>
//           )}
//         </div>
//       </div>

//       {/* PUBLIC MOBILE MENU */}
//       {publicMobileOpen && (
//         <nav className="lg:hidden bg-white border-t px-4 py-4">
//           {publicMenu.map((item) =>
//             item.links ? (
//               <div key={item.name}>
//                 <button
//                   onClick={() =>
//                     setMobileDropdown(
//                       mobileDropdown === item.name ? null : item.name,
//                     )
//                   }
//                   className="flex justify-between w-full py-2 uppercase font-semibold"
//                 >
//                   {item.name}
//                   <HiChevronDown />
//                 </button>
//                 {mobileDropdown === item.name && (
//                   <div className="pl-4">
//                     {item.links.map((link) => (
//                       <Link
//                         key={link.name}
//                         href={link.href}
//                         className="block py-2"
//                       >
//                         {link.name}
//                       </Link>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 className="block py-2 uppercase font-semibold"
//               >
//                 {item.name}
//               </Link>
//             ),
//           )}

//           {!isLoggedIn && (
//             <div className="mt-4 flex flex-col gap-2">
//               <Link
//                 href="/auth/login"
//                 className="bg-[#043F79] text-white px-4 py-2 rounded"
//               >
//                 Sign In
//               </Link>
//               <Link href="/auth/register" className="border px-4 py-2 rounded">
//                 Register
//               </Link>
//             </div>
//           )}
//         </nav>
//       )}

//       {/* USER MOBILE MENU */}
//       {userMobileOpen && isLoggedIn && (
//         <nav className="lg:hidden bg-white border-t px-4 py-4">
//           <Link
//             href="/user/dashboard"
//             className="block py-2 uppercase font-semibold"
//           >
//             Dashboard
//           </Link>

//           {userMobileExtraMenu.map((item) =>
//             item.children ? (
//               <div key={item.name}>
//                 <button
//                   onClick={() => setUserCalcOpen(!userCalcOpen)}
//                   className="flex justify-between w-full py-2 pl-3 text-sm font-semibold"
//                 >
//                   {item.name}
//                   <HiChevronDown
//                     className={`transition-transform ${
//                       userCalcOpen ? "rotate-180" : ""
//                     }`}
//                   />
//                 </button>

//                 {userCalcOpen && (
//                   <div className="pl-6">
//                     {item.children.map((child) => (
//                       <Link
//                         key={child.name}
//                         href={child.href}
//                         className="block py-2 text-sm"
//                       >
//                         {child.name}
//                       </Link>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 className="block py-2 pl-3 text-sm"
//               >
//                 {item.name}
//               </Link>
//             ),
//           )}

//           <Link
//             href="/user/profile"
//             className="block py-2 uppercase font-semibold"
//           >
//             Profile
//           </Link>

//           <Link
//             href="/change-password"
//             className="block py-2 uppercase font-semibold"
//           >
//             Change Password
//           </Link>

//           <button
//             onClick={handleLogout}
//             className="block py-2 text-red-600 uppercase font-semibold"
//           >
//             Logout
//           </button>
//         </nav>
//       )}
//     </header>
//   );
// };

// export default Header;

"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { HiChevronDown } from "react-icons/hi";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFetchProfile } from "@/hooks/useProfile";
import { useProfileStore } from "@/stores/profileStore";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [publicMobileOpen, setPublicMobileOpen] = useState(false);
  const [userMobileOpen, setUserMobileOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);

  //  Get profile from hook (Zustand store)
  const { profile, loading } = useFetchProfile();

  //  Clear profile from store on logout
  const clearProfile = useProfileStore((state) => state.clearProfile);

  //  logged in if profile exists
  const isLoggedIn = !!profile;

  /* ---------- MENU DATA ---------- */
  const publicMenu = [
    { name: "Home", href: "/" },
    { name: "Company", links: [{ name: "About Us", href: "/company/about" }] },
    {
      name: "Mutual Fund",
      links: [
        { name: "MF List", href: "/mutual-fund/mf-list" },
        { name: "Tools", href: "/mutual-fund/tools" },
      ],
    },
    {
      name: "Insurance",
      links: [{ name: "Health", href: "/insurance/health" }],
    },
    {
      name: "Resources",
      links: [
        { name: "Blogs", href: "/blog-listing" },
        { name: "Calculators", href: "/free-calculators" },
      ],
    },
    { name: "Contact Us", href: "/contact-us" },
  ];

  const userMenu = [
    { name: "Dashboard", href: "/user/dashboard" },
    { name: "Profile", href: "/user/dashboard/profile" },
    { name: "Change Password", href: "/user/dashboard/change-password" },
  ];

  const userMobileExtraMenu = [
    { name: "Subscription", href: "/user/subscription" },
    { name: "Newsletter", href: "/user/newsletter" },
    {
      name: "Premium Calculators",
      children: [
        { name: "Advanced SIP", href: "/calculators/advanced-sip" },
        {
          name: "Advanced Step-Up SIP",
          href: "/calculators/advanced-stepup-sip",
        },
        { name: "Goal Planner", href: "/calculators/goal-planner" },
        { name: "Retirement Planner", href: "/calculators/retirement-planner" },
      ],
    },
  ];

  const [userCalcOpen, setUserCalcOpen] = useState(false);

  //  Get first letter dynamically
  const getInitial = () => {
    if (!profile) return "U";

    const name =
      `${profile.firstname || ""} ${profile.lastname || ""}`.trim() ||
      profile.name ||
      profile.email ||
      "User";

    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------- RESET MENUS ON ROUTE CHANGE ---------- */
  useEffect(() => {
    setPublicMobileOpen(false);
    setUserMobileOpen(false);
    setMobileDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      //  IMPORTANT: clear Zustand + persisted profile data
      clearProfile();

      setUserMobileOpen(false);
      setPublicMobileOpen(false);
      setMobileDropdown(null);
      setProfileOpen(false);

      router.push("/");
      router.refresh();
    }
  };

  const menuItemStyle = "uppercase text-[14px] font-semibold";

  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-sm font-inter">
      <div className="px-4 py-2 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="block">
          <Image
            src="/images/moneynow-logo.png"
            alt="MoneyNow Logo"
            width={260}
            height={48}
            priority
            className="w-[200px] sm:w-[220px] md:w-[260px] h-auto"
          />
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden lg:flex items-center gap-8">
          {publicMenu.map((item) =>
            item.links ? (
              <div key={item.name} className="relative group">
                <span
                  className={`flex items-center gap-1 cursor-pointer ${menuItemStyle}`}
                >
                  {item.name} <HiChevronDown />
                </span>
                <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-md rounded-md py-2 min-w-[180px] border-t-2 border-[#043F79]">
                  {item.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.name} href={item.href} className={menuItemStyle}>
                {item.name}
              </Link>
            ),
          )}
        </nav>

        {/* DESKTOP RIGHT */}
        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-[#043F79] text-white font-semibold"
                aria-label="Open profile menu"
              >
                {loading ? "..." : getInitial()}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-sm border-[#EBEBEB] py-2">
                  {userMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-[#043F79] text-white rounded-md uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 border border-[#043F79] text-[#043F79] rounded-md uppercase"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* MOBILE BUTTONS */}
        <div className="lg:hidden flex items-center gap-4">
          {/* PUBLIC MENU BUTTON */}
          <button
            className="text-2xl"
            onClick={() => {
              setPublicMobileOpen(!publicMobileOpen);
              setUserMobileOpen(false);
            }}
            aria-label="Toggle menu"
          >
            {publicMobileOpen ? "✕" : "☰"}
          </button>

          {/* USER PROFILE BUTTON (ONLY WHEN LOGGED IN) */}
          {isLoggedIn && (
            <button
              className="w-8 h-8 rounded-full bg-[#043F79] text-white font-semibold"
              onClick={() => {
                setUserMobileOpen(!userMobileOpen);
                setPublicMobileOpen(false);
              }}
              aria-label="Open user menu"
            >
              {loading ? "..." : getInitial()}
            </button>
          )}
        </div>
      </div>

      {/* PUBLIC MOBILE MENU */}
      {publicMobileOpen && (
        <nav className="lg:hidden bg-white border-t px-4 py-4">
          {publicMenu.map((item) =>
            item.links ? (
              <div key={item.name}>
                <button
                  onClick={() =>
                    setMobileDropdown(
                      mobileDropdown === item.name ? null : item.name,
                    )
                  }
                  className="flex justify-between w-full py-2 uppercase font-semibold"
                >
                  {item.name}
                  <HiChevronDown />
                </button>
                {mobileDropdown === item.name && (
                  <div className="pl-4">
                    {item.links.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="block py-2"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 uppercase font-semibold"
              >
                {item.name}
              </Link>
            ),
          )}

          {!isLoggedIn && (
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="bg-[#043F79] text-white px-4 py-2 rounded"
              >
                Sign In
              </Link>
              <Link href="/auth/register" className="border px-4 py-2 rounded">
                Register
              </Link>
            </div>
          )}
        </nav>
      )}

      {/* USER MOBILE MENU */}
      {userMobileOpen && isLoggedIn && (
        <nav className="lg:hidden bg-white border-t px-4 py-4">
          <Link
            href="/user/dashboard"
            className="block py-2 uppercase font-semibold"
          >
            Dashboard
          </Link>

          {userMobileExtraMenu.map((item) =>
            item.children ? (
              <div key={item.name}>
                <button
                  onClick={() => setUserCalcOpen(!userCalcOpen)}
                  className="flex justify-between w-full py-2 pl-3 text-sm font-semibold"
                >
                  {item.name}
                  <HiChevronDown
                    className={`transition-transform ${
                      userCalcOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userCalcOpen && (
                  <div className="pl-6">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block py-2 text-sm"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 pl-3 text-sm"
              >
                {item.name}
              </Link>
            ),
          )}

          <Link
            href="/user/profile"
            className="block py-2 uppercase font-semibold"
          >
            Profile
          </Link>

          <Link
            href="/change-password"
            className="block py-2 uppercase font-semibold"
          >
            Change Password
          </Link>

          <button
            onClick={handleLogout}
            className="block py-2 text-red-600 uppercase font-semibold"
          >
            Logout
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;
