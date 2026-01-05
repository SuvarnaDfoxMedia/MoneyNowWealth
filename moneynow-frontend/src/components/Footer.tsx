


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

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Login", href: "/auth/login" },
    { label: "Sign Up", href: "/auth/register" },
  ];

const mutualFundLinks = [
  { label: "Download The Money Now App", href: "/comingsoon" },
  { label: "Choose Your Journey", href: "/comingsoon" },
  { label: "Explore Portfolios & Fund Picks", href: "/comingsoon" },
];

const insuranceLinks = [
  { label: "Life Insurance", href: "/comingsoon" },
  { label: "Health Insurance", href: "/comingsoon" },
  { label: "Guaranteed Income Plans", href: "/comingsoon" },
  { label: "Personal Accident (PA) Cover", href: "/comingsoon" },
  { label: "Critical Illness Cover", href: "/comingsoon" },
  { label: "Vehicle Insurance", href: "/comingsoon" },
];

const toolsAndResources = [
  { label: "Calculators Hub", href: "/comingsoon" },
  { label: "Blogs", href: "/comingsoon" },
  { label: "FAQs", href: "/comingsoon" },
];


  const policies = [
    { label: "General Disclaimer", href: "/general-disclaimer" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Website Usage Terms and Conditions", href: "/website-usage-terms-and-conditions" },
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
