"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

const Footer = () => {
  const socialIcons = [
    { id: "fb", icon: <FaFacebookF size={26} />, href: "https://facebook.com" },
    { id: "ig", icon: <FaInstagram size={26} />, href: "https://instagram.com" },
    { id: "li", icon: <FaLinkedinIn size={26} />, href: "https://linkedin.com" },
    { id: "yt", icon: <FaYoutube size={26} />, href: "https://youtube.com" },
    { id: "wa", icon: <FaWhatsapp size={26} />, href: "https://wa.me/919833559143" },
  ];

  return (
    <>
      <div
        className="relative w-full overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/footer-bg.png')",
          fontFamily: "'Poppins', sans-serif",
        }}
      >

        {/* CONTENT CONTAINER */}
        <div className="relative z-10 text-[#FFFFFF]">
          {/* Top Section */}
          <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
            {/* Brand/Left Column */}
            <div className="lg:col-span-6">
              <div className="flex items-center mb-6">
                <Image
                  src="/images/footer-logo.png"
                  alt="MoneyNow Logo"
                  width={180}
                  height={40}
                  priority
                />
              </div>
              <p className="font-semibold text-[16px] mb-2">
                Moneynow Wealth Management LLP
              </p>
              <p className="text-[15px] mb-6">
                GST Number – <span className="font-bold">27ABWFM0337M1ZN</span>
              </p>
              <p className="text-[15px] leading-relaxed max-w-lg">
                Helping investors make informed, long-term investment decisions through simple tools, practical learning, and transparent processes.
              </p>
            </div>

            {/* Right Links Columns */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <h4 className="font-semibold text-[16px] mb-5 border-b-1 border-[#FFFFFF] w-fit">Explore</h4>
                <ul className="space-y-3 text-[14px]">
                  <li><Link href="/mutual-funds" className="hover:text-[#60e6eb] transition">Mutual Funds</Link></li>
                  <li><Link href="/calculators" className="hover:text-[#60e6eb] transition">Calculators</Link></li>
                  <li><Link href="/blog-listing" className="hover:text-[#60e6eb] transition">Learn</Link></li>
                  <li><Link href="/investments" className="hover:text-[#60e6eb] transition">Investments</Link></li>
                  <li><Link href="/portfolio" className="hover:text-[#60e6eb] transition">My Portfolio</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[16px] mb-5 border-b-1 border-[#FFFFFF] w-fit ">Company</h4>
                <ul className="space-y-3 text-[14px]">
                  <li><Link href="/about" className="hover:text-[#60e6eb] transition">About Us</Link></li>
                  <li><Link href="/partner" className="hover:text-[#60e6eb] transition">Partner with Us</Link></li>
                  <li><Link href="/testimonials" className="hover:text-[#60e6eb] transition">What Investors say</Link></li>
                  <li><Link href="/contact" className="hover:text-[#60e6eb] transition">Contact Us</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[16px] mb-5 border-b-1 border-[#FFFFFF] w-fit text-[#FFFFFF]">Legal & Support</h4>
                <ul className="space-y-3 text-[14px]">
                  <li><Link href="/privacy-policy" className="hover:text-[#60e6eb] transition">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-[#60e6eb] transition">Terms of Use</Link></li>
                  <li><Link href="/risk-disclosure" className="hover:text-[#60e6eb] transition">Risk Disclosure</Link></li>
                  <li><Link href="/grievance" className="hover:text-[#60e6eb] transition">Grievance Redressal</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Detailed Lists */}
          <div className="max-w-7xl mx-auto px-6 py-8 border-t border-[#575757]/40 leading-[26px]">
            {/* Row 1: AMCs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-6">
              <div className="md:col-span-10 font-normal text-[#FFFFFF] text-[15px]">
                <span className="font-semibold text-[16px]">Asset Management Companies (AMCs) –</span> Aditya Birla Sun Life | Axis | Canara Robeco | DSP | Edelweiss | Franklin Templeton | HDFC | HSBC | ICICI Prudential | IDFC | Kotak | LIC | Mirae Asset | Motilal Oswal | Nippon India | PGIM | PPFAS | Quant | SBI | Sundaram | Tata | UTI
              </div>
              <div className="md:col-span-2 text-left">
                <Link href="#" className="flex items-center gap-1 whitespace-nowrap hover:underline font-medium text-[15px]">
                  View all AMCs <HiOutlineArrowNarrowRight size={18} className="mt-0.5" />
                </Link>
              </div>
            </div>
            

            {/* Row 2: Tools */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-6">
              <div className="md:col-span-10 text-[#FFFFFF] text-[15px]">
                <span className="font-semibold text-[16px]">Mutual Fund Tools & Calculators –</span> SIP Calculator | Lumpsum Calculator | Goal Calculator | Retirement Calculator | SWP Calculator | ELSS Calculator | NPS Calculator
              </div>
              <div className="md:col-span-2 text-left">
                <Link href="#" className="flex items-center gap-1 whitespace-nowrap hover:underline font-medium text-[15px]">
                  View all calculators <HiOutlineArrowNarrowRight size={18} className="mt-0.5" />
                </Link>
              </div>
            </div>

            {/* Row 3: Categories */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-10 text-[#FFFFFF] text-[15px]">
                <span className="font-semibold text-[16px]">Popular Mutual Fund Categories –</span> Equity Funds | Debt Funds | Hybrid Funds | Solution Oriented Funds | Index Funds | ETF | Overnight Funds
              </div>
              <div className="md:col-span-2 text-left">
                <Link href="#" className="flex items-center gap-1 whitespace-nowrap hover:underline font-medium text-[15px]">
                  Explore fund categories  <HiOutlineArrowNarrowRight size={18} className="mt-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* LICENSE & DISCLAIMER SECTION */}
          <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 gap-8 text-[15px]">
            <p>
              <span className="font-semibold text-[16px]">License & Registration –</span> AMFI Registered Mutual Fund Distributor (ARN: XXXXX)
            </p>
            <p>
              <span className="font-semibold text-[16px]">Risk Disclaimer –</span> Mutual fund investments are subject to market risks. Read all scheme related documents carefully.
            </p>
          </div>
        </div>
      </div>

      {/* Final Bottom Bar */}
      <div className="max-w-full px-6 lg:px-12 py-5 flex flex-col md:flex-row justify-between items-center text-[#FFFFFF] bg-[#001325] border-t border-[#575757]/40">
        <p className="text-[16px] mb-6 md:mb-0">
          © 2026 <span className="font-bold">Moneynow</span>. All rights reserved.
        </p>

        <div className="flex gap-4 mb-6 md:mb-0">
          {socialIcons.map((social) => (
            <Link
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[50px] h-[50px] flex items-center justify-center border border-white border-dashed rounded-full hover:bg-[#60e6eb] hover:text-[#0B3B6E] transition-all duration-300"
            >
              {social.icon}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[16px]">
          <span>Developed and Managed By</span>
          <Image
            src="/images/dfox-img.png"
            alt="Developer"
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
      </div>
    </>
  );
};

export default Footer;