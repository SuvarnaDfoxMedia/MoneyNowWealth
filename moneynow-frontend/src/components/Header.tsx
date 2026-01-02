// "use client";

// import Image from "next/image";
// import { useState, useEffect } from "react";
// import { HiChevronDown } from "react-icons/hi";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// const Header = () => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
//   const pathname = usePathname();

//   const menuItems = [
//     {
//       name: "Company",
//       links: [
//         { name: "About Us", href: "/company/about" },
//       ],
//     },
//     {
//       name: "Mutual Fund",
//       links: [
//         { name: "MF List", href: "/mutual-fund/mf-list" },
//         { name: "Tools", href: "/mutual-fund/tools" },
//       ],
//     },
//     {
//       name: "Insurance",
//       links: [
//         { name: "Health", href: "/insurance/health" },
//       ],
//     },
//     {
//   name: "Resources",
//   links: [
//     { name: "Blogs", href: "/blog-listing" },
//   ]
// }
// ,
//   ];

//   useEffect(() => {
//     setMobileMenuOpen(false);
//     setMobileDropdown(null);
//   }, [pathname]);

//   const menuItemStyle = "uppercase text-[14px] font-semibold";

//   return (
//     <header className="w-full shadow-sm bg-white sticky top-0 z-50 font-inter">
//       <div className="max-w-full px-4 mx-auto py-2 flex items-center justify-between">

//         {/* Logo */}
//         <Link href="/" className="cursor-pointer">
//           <Image
//             src="/images/moneynow-logo.png"
//             alt="MoneyNow Logo"
//             width={268}
//             height={48}
//           />
//         </Link>

//         {/* Desktop Menu */}
//         <nav className="hidden md:flex items-center gap-8">

//           <Link href="/" className={menuItemStyle}>
//             Home
//           </Link>

//           {menuItems.map((item) => (
//             <div key={item.name} className="relative group">
//               <Link
//                 href={`/${item.name.toLowerCase().replace(" ", "-")}`}
//                 className={`flex items-center gap-1 ${menuItemStyle}`}
//               >
//                 {item.name} <HiChevronDown className="w-4 h-4" />
//               </Link>

//               {/* Dropdown */}
//               <div
//                 className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white shadow-lg 
//                 mt-0 min-w-[160px]  rounded-md py-2 border-t"
//                 style={{
//                   borderTopColor: "#043F79",
//                   borderTopWidth: "2px",
//                 }}
//               >
//                 {item.links.map((link) => (
//                   <Link
//                     key={link.name}
//                     href={link.href}
//                     className="px-4 py-2 hover:bg-gray-100 text-[14px] font-medium border-b 
//                     border-gray-100 last:border-b-0"
//                   >
//                     {link.name}
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           ))}

//           <Link href="/contact-us" className={menuItemStyle}>
//             Contact Us
//           </Link>
//         </nav>

//         {/* Desktop Sign In / Register */}
//       <div className="hidden md:flex items-center gap-3">
//   <Link
//     href="/auth/login"
//     className="px-[15px] py-[10px] rounded-[5px] border text-white bg-[#043F79] 
//     hover:bg-[#032f5a] text-[15px] font-medium uppercase"
//   >
//     Sign In
//   </Link>

//   <Link
//     href="/auth/register"
//     className="px-[15px] py-[10px] rounded-[5px] border border-[#043F79] 
//     text-[#043F79] text-[15px] font-medium uppercase"
//   >
//     Register
//   </Link>
// </div>

//         {/* Mobile Menu Icon */}
//         {/* <button
//           className="md:hidden text-2xl font-semibold"
//           onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//         >
//           ☰
//         </button> */}

//         <button
//   className="md:hidden font-semibold leading-none"
//   onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//   aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
// >
//   <span className={mobileMenuOpen ? "text-xl" : "text-2xl"}>
//     {mobileMenuOpen ? "✕" : "☰"}
//   </span>
// </button>

//       </div>

//       {/* Mobile Menu */}
//       {mobileMenuOpen && (
//         <nav className="md:hidden w-full flex flex-col gap-1 px-2 py-4 bg-white border-t font-medium">

//           <Link
//             href="/"
//             className="uppercase text-[14px] font-semibold px-4 py-2"
//           >
//             Home
//           </Link>

//           {menuItems.map((item) => (
//             <div key={item.name} className="flex flex-col w-full">
//               <button
//                 onClick={() =>
//                   setMobileDropdown(
//                     mobileDropdown === item.name ? null : item.name
//                   )
//                 }
//                 className="flex justify-between items-center w-full px-4 py-2 text-left uppercase text-[14px] font-semibold"
//               >
//                 {item.name}
//                 <HiChevronDown
//                   className={`w-4 h-4 transition-transform duration-200 ${
//                     mobileDropdown === item.name ? "rotate-180" : ""
//                   }`}
//                 />
//               </button>

//               {mobileDropdown === item.name && (
//                 <div className="flex flex-col pl-6 pr-4">
//                   {item.links.map((link) => (
//                     <Link
//                       key={link.name}
//                       href={link.href}
//                       className="px-4 py-2 hover:bg-gray-100 text-[14px] font-medium"
//                     >
//                       {link.name}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}

//           <Link
//             href="/contact-us"
//             className="uppercase text-[14px] font-semibold px-4 py-2"
//           >
//             Contact Us
//           </Link>

//           {/* Mobile Sign In / Register */}
//           <div className="flex flex-col gap-2 mt-2 px-4">
//             <Link
//               href="/login"
//               className="px-4 py-2 rounded-[5px] border text-white bg-[#043F79] 
//               hover:bg-[#032f5a] text-[14px] font-medium uppercase text-center"
//             >
//               Sign In
//             </Link>

//             <Link
//               href="/register"
//               className="px-4 py-2 rounded-[5px] border border-[#043F79] 
//               text-[#043F79] text-[14px] font-medium uppercase text-center"
//             >
//               Register
//             </Link>
//           </div>
//         </nav>
//       )}
//     </header>
//   );
// };

// export default Header;


"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Company",
      links: [{ name: "About Us", href: "/company/about" }],
    },
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
      links: [{ name: "Blogs", href: "/blog-listing" }],
    },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileDropdown(null);
  }, [pathname]);

  const menuItemStyle = "uppercase text-[14px] font-semibold";

  return (
    <header className="w-full shadow-sm bg-white sticky top-0 z-50 font-inter">
      <div className="max-w-full px-4 mx-auto py-2 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="cursor-pointer">
          <Image
            src="/images/moneynow-logo.png"
            alt="MoneyNow Logo"
            width={268}
            height={48}
            priority
          />
        </Link>

        {/* Desktop Menu (LG+) */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/" className={menuItemStyle}>
            Home
          </Link>

          {menuItems.map((item) => (
            <div key={item.name} className="relative group">
              <Link
                href={`/${item.name.toLowerCase().replace(" ", "-")}`}
                className={`flex items-center gap-1 ${menuItemStyle}`}
              >
                {item.name}
                <HiChevronDown className="w-4 h-4" />
              </Link>

              {/* Dropdown */}
              <div
                className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white shadow-lg 
                min-w-[160px] rounded-md py-2 border-t"
                style={{ borderTop: "2px solid #043F79" }}
              >
                {item.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="px-4 py-2 text-[14px] font-medium hover:bg-gray-100 border-b 
                    border-gray-100 last:border-b-0"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <Link href="/contact-us" className={menuItemStyle}>
            Contact Us
          </Link>
        </nav>

        {/* Desktop Auth Buttons (LG+) */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-[15px] py-[10px] rounded-[5px] bg-[#043F79] 
            hover:bg-[#032f5a] text-white text-[15px] font-medium uppercase"
          >
            Sign In
          </Link>

          <Link
            href="/auth/register"
            className="px-[15px] py-[10px] rounded-[5px] border border-[#043F79] 
            text-[#043F79] text-[15px] font-medium uppercase"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button (SM + MD) */}
        <button
          className="lg:hidden font-semibold leading-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <span className={mobileMenuOpen ? "text-xl" : "text-2xl"}>
            {mobileMenuOpen ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {/* Mobile Menu (SM + MD) */}
      {mobileMenuOpen && (
        <nav className="lg:hidden w-full flex flex-col gap-1 px-2 py-4 bg-white border-t font-medium">
          <Link href="/" className="uppercase text-[14px] font-semibold px-4 py-2">
            Home
          </Link>

          {menuItems.map((item) => (
            <div key={item.name} className="flex flex-col">
              <button
                onClick={() =>
                  setMobileDropdown(
                    mobileDropdown === item.name ? null : item.name
                  )
                }
                className="flex justify-between items-center w-full px-4 py-2 
                uppercase text-[14px] font-semibold"
              >
                {item.name}
                <HiChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileDropdown === item.name ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileDropdown === item.name && (
                <div className="flex flex-col pl-6 pr-4">
                  {item.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="px-4 py-2 text-[14px] font-medium hover:bg-gray-100"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link
            href="/contact-us"
            className="uppercase text-[14px] font-semibold px-4 py-2"
          >
            Contact Us
          </Link>

          {/* Mobile Auth */}
         <div className="flex flex-col gap-2 mt-2 px-4 items-start">
  <Link
    href="/login"
    className="w-auto px-4 py-2 rounded-[5px] bg-[#043F79] 
    hover:bg-[#032f5a] text-white text-[14px] font-medium uppercase"
  >
    Sign In
  </Link>

  <Link
    href="/register"
    className="w-auto px-4 py-2 rounded-[5px] border border-[#043F79] 
    text-[#043F79] text-[14px] font-medium uppercase"
  >
    Register
  </Link>
</div>

        </nav>
      )}
    </header>
  );
};

export default Header;
