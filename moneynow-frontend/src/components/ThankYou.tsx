"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

const socialIcons = [
  { href: "https://facebook.com", icon: (mobile: boolean) => <FaFacebookF size={mobile ? 16 : 20} /> },
  { href: "https://instagram.com", icon: (mobile: boolean) => <FaInstagram size={mobile ? 16 : 20} /> },
  { href: "https://linkedin.com", icon: (mobile: boolean) => <FaLinkedinIn size={mobile ? 16 : 20} /> },
  { href: "https://youtube.com", icon: (mobile: boolean) => <FaYoutube size={mobile ? 16 : 20} /> },
  { href: "https://wa.me/919833559143", icon: (mobile: boolean) => <FaWhatsapp size={mobile ? 16 : 20} /> },
];

const ThankYou = () => {
  return (
<section
  className="max-w-5xl mx-auto flex items-center justify-center bg-cover bg-center my-8 min-h-[70vh]  sm:px-6"
  style={{
    backgroundImage: "url('/images/thank-you.png')",
  }}
>

      {/* Container */}
      <div className="text-center flex flex-col items-center justify-center py-6 w-full">
<Image
  src="/images/thank-you-icon.png"
  alt="Thank You"
  width={280}
  height={280}
  className="mb-3 w-[200px] sm:w-[220px] md:w-[260px] lg:w-[280px] h-auto"
  priority
/>



        <h2 className="font-inter font-semibold leading-none text-[48px] sm:text-[64px] md:text-[80px] lg:text-[88px]">
          Thank You!
        </h2>

        <p className="mt-4 mb-6 max-w-3xl text-[16px] sm:text-[18px] md:text-[22px] lg:text-[28px] leading-[28px] sm:leading-[32px] md:leading-[36px] lg:leading-[40px]">
          We appreciate your interest. Our team will review your inquiry and
          respond at the earliest.
        </p>

        {/* Social Icons */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {socialIcons.map((social, index) => (
            <Link
              key={index}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full bg-black text-white hover:bg-blue-600 transition-colors w-[38px] h-[38px] sm:w-[50px] sm:h-[50px]"
            >
              <span className="block sm:hidden">{social.icon(true)}</span>
              <span className="hidden sm:block">{social.icon(false)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThankYou;
