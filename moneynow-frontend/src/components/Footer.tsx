// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaLinkedinIn,
//   FaYoutube,
//   FaWhatsapp,
// } from "react-icons/fa";
// import { FiPhone, FiMail } from "react-icons/fi";

// const Footer = () => {
//   const FooterColumn = ({
//     title,
//     links,
//   }: {
//     title: string;
//     links: { label: string; href: string }[];
//   }) => (
//     <div className="w-1/2 sm:w-auto mt-6 md:mt-0">
//       <p className="text-[#ffffff] font-poppins font-semibold text-[18px] mb-4 inline-block">
//         {title}
//       </p>
//       <ul className="space-y-3 text-sm">
//         {links.map((link, index) => (
//           <li key={index}>
//             <Link
//               href={link.href}
//               className="text-[#ffffff] font-inter text-[15px] hover:text-blue-500 transition-colors"
//             >
//               {link.label}
//             </Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );

//   const quickLinks = [
//     { label: "Home", href: "/" },
//     { label: "Contact Us", href: "/contact" },
//     { label: "Login", href: "/login" },
//     { label: "Sign Up", href: "/signup" },
//   ];

//   const mutualFundLinks = [
//     { label: "Download The Money Now App", href: "/app" },
//     { label: "Choose Your Journey", href: "/journey" },
//     { label: "Explore Portfolios & Fund Picks", href: "/portfolios" },
//     { label: "Sign Up", href: "/signup" },
//   ];

//   const insuranceLinks = [
//     { label: "Life Insurance", href: "/insurance/life" },
//     { label: "Health Insurance", href: "/insurance/health" },
//     { label: "Guaranteed Income Plans", href: "/insurance/income-plans" },
//     { label: "Personal Accident (PA) Cover", href: "/insurance/pa-cover" },
//     { label: "Critical Illness Cover", href: "/insurance/critical-illness" },
//     { label: "Vehicle Insurance", href: "/insurance/vehicle" },
//   ];

//   const toolsAndResources = [
//     { label: "Calculators Hub", href: "/calculators" },
//     { label: "Blogs", href: "/blogs" },
//     { label: "FAQs", href: "/faq" },
//   ];

//   const policies = [
//     { label: "General Disclaimer", href: "/disclaimer" },
//     { label: "Privacy Policy", href: "/privacy" },
//     { label: "Website Usage Terms and Conditions", href: "/terms" },
//   ];

//   const iconSize = 25;
//   const iconContainerSize = 50;

//   const socialIcons = [
//     { icon: <FaFacebookF size={iconSize} />, href: "https://facebook.com" },
//     { icon: <FaInstagram size={iconSize} />, href: "https://instagram.com" },
//     { icon: <FaLinkedinIn size={iconSize} />, href: "https://linkedin.com" },
//     { icon: <FaYoutube size={iconSize} />, href: "https://youtube.com" },
//     { icon: <FaWhatsapp size={iconSize} />, href: "https://wa.me/919833559143" },
//   ];

//   return (
//     <footer className="w-full bg-[#010D19] text-[#ffffff]">
//       <div className="max-w-7xl mx-auto py-8">
//         {/* Top Section */}
//         <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#002243] pb-6 mb-6">
//           <div className="flex flex-wrap justify-between w-full">
//             {/* Social Icons */}
//             <div className="flex space-x-3 mb-6 md:mb-0">
//               {socialIcons.map((social, index) => (
//                 <Link
//                   key={index}
//                   href={social.href}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center justify-center border border-[#ffffff] border-dashed rounded-full hover:border-blue-500 hover:text-blue-500 transition-colors"
//                   style={{ width: iconContainerSize, height: iconContainerSize }}
//                 >
//                   {social.icon}
//                 </Link>
//               ))}
//             </div>

//             {/* Contact Info */}
//             <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 text-sm">
//               {/* Phone */}
//               <div className="flex items-center">
//                 <div
//                   className="flex items-center justify-center border border-[#ffffff] border-dashed rounded-full mr-3"
//                   style={{ width: iconContainerSize, height: iconContainerSize }}
//                 >
//                   <FiPhone size={iconSize} color="#ffffff" />
//                 </div>
//                 <div className="font-inter">
//                   <p className="text-[#ffffff] text-[18px] font-semibold">
//                     + 91 98335 59143
//                   </p>
//                   <p className="text-[#ffffff] text-[13px] text-xs">
//                     Any questions? Call us.
//                   </p>
//                 </div>
//               </div>

//               {/* Email */}
//               <div className="flex items-center">
//                 <div
//                   className="flex items-center justify-center border border-[#ffffff] border-dashed rounded-full mr-3"
//                   style={{ width: iconContainerSize, height: iconContainerSize }}
//                 >
//                   <FiMail size={iconSize} color="#ffffff" />
//                 </div>
//                 <div className="font-inter">
//                   <p className="text-[#ffffff] text-[18px] font-semibold">
//                     support@moneynowwealth.com
//                   </p>
//                   <p className="text-[#ffffff] text-[13px] text-xs">
//                     Any questions? Email us.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main Links Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4">
//           <FooterColumn title="Quick Links" links={quickLinks} />
//           <FooterColumn title="Mutual Fund" links={mutualFundLinks} />
//           <FooterColumn title="Insurance" links={insuranceLinks} />
//           <div className="col-span-2 grid grid-cols-2 gap-y-8 gap-x-4">
//             <FooterColumn title="Tools & Resources" links={toolsAndResources} />
//             <FooterColumn title="Policies" links={policies} />
//           </div>
//         </div>
//       </div>

//       {/* Bottom Bar */}
//       <div className="bg-[#010D19] py-4 border-t border-[#002243]">
//         <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-[16px] font-inter">
//           <p className="mb-2 sm:mb-0 text-[#ffffff]">
//             &copy; {new Date().getFullYear()} <strong>MoneyNow Wealth</strong>.
//             Built with trust, clarity, and confidence.
//           </p>
//           <p className="flex items-center gap-2 text-[#ffffff]">
//             Developed and Managed By
//             <Image
//               src="/images/dfox-img.png"
//               alt="Developer"
//               width={20}
//               height={20}
//               className="rounded-full"
//             />
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;



// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaLinkedinIn,
//   FaYoutube,
//   FaWhatsapp,
// } from "react-icons/fa";
// import { FiPhone, FiMail } from "react-icons/fi";

// const Footer = () => {
//   const FooterColumn = ({
//     title,
//     links,
//   }: {
//     title: string;
//     links: { label: string; href: string }[];
//   }) => (
//     <div className="w-full sm:w-auto">
//       <p className="text-[#ffffff] font-poppins font-semibold text-[18px] mb-4 inline-block">
//         {title}
//       </p>
//       <ul className="space-y-3 text-sm">
//         {links.map((link, index) => (
//           <li key={index}>
//             <Link
//               href={link.href}
//               className="text-[#ffffff] font-inter text-[15px] hover:text-blue-500 transition-colors"
//             >
//               {link.label}
//             </Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );

//   // ------------------ LINKS (RESTORED) ------------------

//   const quickLinks = [
//     { label: "Home", href: "/" },
//     { label: "Contact Us", href: "/contact" },
//     { label: "Login", href: "/login" },
//     { label: "Sign Up", href: "/signup" },
//   ];

//   const mutualFundLinks = [
//     { label: "Download The Money Now App", href: "/app" },
//     { label: "Choose Your Journey", href: "/journey" },
//     { label: "Explore Portfolios & Fund Picks", href: "/portfolios" },
//     { label: "Sign Up", href: "/signup" },
//   ];

//   const insuranceLinks = [
//     { label: "Life Insurance", href: "/insurance/life" },
//     { label: "Health Insurance", href: "/insurance/health" },
//     { label: "Guaranteed Income Plans", href: "/insurance/income-plans" },
//     { label: "Personal Accident (PA) Cover", href: "/insurance/pa-cover" },
//     { label: "Critical Illness Cover", href: "/insurance/critical-illness" },
//     { label: "Vehicle Insurance", href: "/insurance/vehicle" },
//   ];

//   const toolsAndResources = [
//     { label: "Calculators Hub", href: "/calculators" },
//     { label: "Blogs", href: "/blogs" },
//     { label: "FAQs", href: "/faq" },
//   ];

//   const policies = [
//     { label: "General Disclaimer", href: "/disclaimer" },
//     { label: "Privacy Policy", href: "/privacy-policy" },
//     { label: "Website Usage Terms and Conditions", href: "/terms" },
//   ];

//   // Icon sizes
//   const iconSize = 25;
//   const iconContainerSize = 50;
//   const mobileIconSize = 18;
//   const mobileIconContainer = 38;

//   const socialIcons = [
//     { icon: (m: boolean) => <FaFacebookF size={m ? mobileIconSize : iconSize} />, href: "https://facebook.com" },
//     { icon: (m: boolean) => <FaInstagram size={m ? mobileIconSize : iconSize} />, href: "https://instagram.com" },
//     { icon: (m: boolean) => <FaLinkedinIn size={m ? mobileIconSize : iconSize} />, href: "https://linkedin.com" },
//     { icon: (m: boolean) => <FaYoutube size={m ? mobileIconSize : iconSize} />, href: "https://youtube.com" },
//     { icon: (m: boolean) => <FaWhatsapp size={m ? mobileIconSize : iconSize} />, href: "https://wa.me/919833559143" },
//   ];

//   return (
//     <footer className="w-full bg-[#010D19] text-[#ffffff]">
//       <div className="max-w-7xl mx-auto py-8 px-6">

//         {/* ---------------- TOP SECTION ---------------- */}
//         <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#002243] pb-6 mb-6">

//           {/* Social Icons */}
//           <div className="flex flex-wrap gap-3 mb-6">
//             {socialIcons.map((social, index) => (
//               <Link
//                 key={index}
//                 href={social.href}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center justify-center border border-[#ffffff] border-dashed rounded-full hover:border-blue-500 hover:text-blue-500 transition-colors
//                 w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]"
//               >
//                 {/* mobile */}
//                 <span className="block sm:hidden">{social.icon(true)}</span>
//                 {/* desktop */}
//                 <span className="hidden sm:block">{social.icon(false)}</span>
//               </Link>
//             ))}
//           </div>

//           {/* Contact Info (Desktop = side-by-side / Mobile = stacked) */}
//           <div className="flex flex-col sm:flex-row sm:space-x-10 space-y-6 sm:space-y-0 w-full sm:w-auto">

//             {/* Phone */}
//             <div className="flex items-center">
//               <div className="
//                 flex items-center justify-center border border-[#ffffff] border-dashed rounded-full mr-3
//                 w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]
//               ">
//                 <span className="block sm:hidden">
//                   <FiPhone size={mobileIconSize} color="#ffffff" />
//                 </span>
//                 <span className="hidden sm:block">
//                   <FiPhone size={iconSize} color="#ffffff" />
//                 </span>
//               </div>
//               <div className="font-inter">
// <p className="text-[14px] sm:text-[18px] font-semibold">
//   + 91 98335 59143
// </p>
//                 <p className="text-[13px]">Any questions? Call us.</p>
//               </div>
//             </div>

//             {/* Email */}
//             <div className="flex items-center">
//               <div className="
//                 flex items-center justify-center border border-[#ffffff] border-dashed rounded-full mr-3
//                 w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]
//               ">
//                 <span className="block sm:hidden">
//                   <FiMail size={mobileIconSize} color="#ffffff" />
//                 </span>
//                 <span className="hidden sm:block">
//                   <FiMail size={iconSize} color="#ffffff" />
//                 </span>
//               </div>
//               <div className="font-inter">
// <p className="text-[14px] sm:text-[18px] font-semibold">
//   support@moneynowwealth.com
// </p>
//                 <p className="text-[13px]">Any questions? Email us.</p>
//               </div>
//             </div>

//           </div>
//         </div>

//         {/* ---------------- MAIN COLUMNS ---------------- */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-y-10 gap-x-6">

//           <FooterColumn title="Quick Links" links={quickLinks} />
//           <FooterColumn title="Mutual Fund" links={mutualFundLinks} />
//           <FooterColumn title="Insurance" links={insuranceLinks} />

//           <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-6">
//             <FooterColumn title="Tools & Resources" links={toolsAndResources} />
//             <FooterColumn title="Policies" links={policies} />
//           </div>

//         </div>
//       </div>

//       {/* ---------------- BOTTOM BAR ---------------- */}
//       <div className="bg-[#010D19] py-4 border-t border-[#002243]">
//         <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-[16px] font-inter">
//           <p className="mb-2 sm:mb-0">
//             &copy; {new Date().getFullYear()} <strong>MoneyNow Wealth</strong>. Built with trust, clarity, and confidence.
//           </p>
//           <p className="flex items-center gap-2">
//             Developed and Managed By
//             <Image
//               src="/images/dfox-img.png"
//               alt="Developer"
//               width={20}
//               height={20}
//               className="rounded-full"
//             />
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;



"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import { FiPhone, FiMail } from "react-icons/fi";

const Footer = () => {
  const FooterColumn = ({
    title,
    links,
  }: {
    title: string;
    links: { label: string; href: string }[];
  }) => (
    <div className="w-full sm:w-auto">
      <p className="text-white font-poppins font-semibold text-[18px] mb-4 inline-block">
        {title}
      </p>
      <ul className="space-y-3 text-sm">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              className="text-white font-inter text-[15px] hover:text-blue-500 transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  // ------------------ LINKS ------------------
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Login", href: "/auth/login" },
    { label: "Sign Up", href: "/auth/register" },
  ];

  const mutualFundLinks = [
    { label: "Download The Money Now App", href: "/app" },
    { label: "Choose Your Journey", href: "/journey" },
    { label: "Explore Portfolios & Fund Picks", href: "/portfolios" },
    { label: "Sign Up", href: "/signup" },
  ];

  const insuranceLinks = [
    { label: "Life Insurance", href: "/insurance/life" },
    { label: "Health Insurance", href: "/insurance/health" },
    { label: "Guaranteed Income Plans", href: "/insurance/income-plans" },
    { label: "Personal Accident (PA) Cover", href: "/insurance/pa-cover" },
    { label: "Critical Illness Cover", href: "/insurance/critical-illness" },
    { label: "Vehicle Insurance", href: "/insurance/vehicle" },
  ];

  const toolsAndResources = [
    { label: "Calculators Hub", href: "/calculators" },
    { label: "Blogs", href: "/blogs" },
    { label: "FAQs", href: "/faq" },
  ];

  const policies = [
    { label: "General Disclaimer", href: "/general-disclaimer" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Website Usage Terms and Conditions", href: "/terms-condition" },
  ];

  // Icon sizes
  const iconSize = 25;
  const mobileIconSize = 18;

  const socialIcons = [
    {
      icon: (m: boolean) => <FaFacebookF size={m ? mobileIconSize : iconSize} />,
      href: "https://facebook.com",
    },
    {
      icon: (m: boolean) => <FaInstagram size={m ? mobileIconSize : iconSize} />,
      href: "https://instagram.com",
    },
    {
      icon: (m: boolean) => <FaLinkedinIn size={m ? mobileIconSize : iconSize} />,
      href: "https://linkedin.com",
    },
    {
      icon: (m: boolean) => <FaYoutube size={m ? mobileIconSize : iconSize} />,
      href: "https://youtube.com",
    },
    {
      icon: (m: boolean) => <FaWhatsapp size={m ? mobileIconSize : iconSize} />,
      href: "https://wa.me/919833559143",
    },
  ];

  return (
    <footer className="w-full bg-[#010D19] text-white">
      <div className="max-w-7xl mx-auto py-8 px-6">

        {/* ---------------- TOP SECTION ---------------- */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#002243] pb-6 mb-6">

          {/* Social Icons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {socialIcons.map((social, index) => (
              <Link
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center border border-white border-dashed rounded-full hover:border-blue-500 hover:text-blue-500 transition-colors w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]"
              >
                <span className="block sm:hidden">{social.icon(true)}</span>
                <span className="hidden sm:block">{social.icon(false)}</span>
              </Link>
            ))}
          </div>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row sm:space-x-10 space-y-6 sm:space-y-0 w-full sm:w-auto">

            {/* Phone */}
            <div className="flex items-center">
              <div className="flex items-center justify-center border border-white border-dashed rounded-full mr-3 w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]">
                <span className="block sm:hidden">
                  <FiPhone size={mobileIconSize} color="#ffffff" />
                </span>
                <span className="hidden sm:block">
                  <FiPhone size={iconSize} color="#ffffff" />
                </span>
              </div>
              <div className="font-inter">
                <p className="text-[14px] sm:text-[18px] font-semibold">+ 91 98335 59143</p>
                <p className="text-[13px]">Any questions? Call us.</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center">
              <div className="flex items-center justify-center border border-white border-dashed rounded-full mr-3 w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]">
                <span className="block sm:hidden">
                  <FiMail size={mobileIconSize} color="#ffffff" />
                </span>
                <span className="hidden sm:block">
                  <FiMail size={iconSize} color="#ffffff" />
                </span>
              </div>
              <div className="font-inter">
                <p className="text-[14px] sm:text-[18px] font-semibold">support@moneynowwealth.com</p>
                <p className="text-[13px]">Any questions? Email us.</p>
              </div>
            </div>

          </div>
        </div>

        {/* ---------------- MAIN COLUMNS ---------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-y-10 gap-x-6">
          <FooterColumn title="Quick Links" links={quickLinks} />
          <FooterColumn title="Mutual Fund" links={mutualFundLinks} />
          <FooterColumn title="Insurance" links={insuranceLinks} />

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-6">
            <FooterColumn title="Tools & Resources" links={toolsAndResources} />
            <FooterColumn title="Policies" links={policies} />
          </div>
        </div>

      </div>

      {/* ---------------- BOTTOM BAR ---------------- */}
      <div className="bg-[#010D19] py-4 border-t border-[#002243]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-[16px] font-inter">
          <p className="mb-2 sm:mb-0">
            &copy; {new Date().getFullYear()} <strong>MoneyNow Wealth</strong>. Built with trust, clarity, and confidence.
          </p>

          <p className="flex items-center gap-2">
            Developed and Managed By
            <Image
              src="/images/dfox-img.png"
              alt="Developer"
              width={20}
              height={20}
              className="rounded-full"
            />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
