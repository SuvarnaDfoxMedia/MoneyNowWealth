"use client";

import React from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import CMSBanner from "./cms/CmsBanner";

const thankYouIconClassName =
  "h-[18px] w-[18px] shrink-0 fill-current text-[#043F79]";

const ThankYou = () => {
  return (
    <section className="bg-white font-poppins text-[#111827]">
      <CMSBanner title="Thank you" bgImage="/images/contact-bg.png" />

      <div className="mx-auto -mt-6 max-w-[1440px] px-4 pb-6 md:-mt-7 md:px-6 md:pb-10 lg:px-8">
        <div className="flex justify-center bg-white px-0 py-6 sm:px-4 md:py-9">
          <div className="w-full max-w-[800px] rounded-[14px] border border-[#EEF2F7] bg-white px-5 py-7 text-center shadow-[0_16px_48px_rgba(12,35,69,0.08)] sm:px-10 md:px-14 md:py-10">
            <h2 className="text-[24px] font-semibold leading-[1.28] text-[#154C86] sm:text-[27px] md:text-[29px]">
            We Have Received Your Message.
            </h2>

            <p className="mx-auto mt-5 max-w-[470px] text-[14px] leading-[1.85] text-[#3F3F46] md:text-[15px]">
              Our team will review your details and get in touch with you on
              the contact information you have shared.
            </p>

            <p className="mx-auto mt-8 max-w-[470px] text-[14px] font-medium leading-[1.8] text-[#111827] md:text-[15px]">
              If your enquiry is urgent, you can also reach us on:
            </p>

            <div className="mx-auto mt-5 flex w-full max-w-[430px] flex-col items-start gap-4 text-left">
              <div className="flex w-full items-start gap-2.5 text-[14px] text-[#3F3F46] md:text-[15px]">
                <IoMail className={`${thankYouIconClassName} mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[#111827]">Email - </span>
                  <a
                    href="mailto:info@moneynowwealth.com"
                    className="break-all transition hover:text-[#043F79]"
                  >
                    info@moneynowwealth.com
                  </a>
                </div>
              </div>

              <div className="flex w-full items-start gap-2.5 text-[14px] text-[#3F3F46] md:text-[15px]">
                <FaPhoneAlt className={`${thankYouIconClassName} mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[#111827]">
                    Phone / WhatsApp -
                  </span>{" "}
                  <a
                    href="tel:+918976500022"
                    className="transition hover:text-[#043F79]"
                  >
                    +91 89765 000 22
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThankYou;
