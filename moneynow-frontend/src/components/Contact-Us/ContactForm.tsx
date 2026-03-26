"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { ChevronRight } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaYoutube,
} from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import { RiWhatsappFill } from "react-icons/ri";
import CMSBanner from "../../components/cms/CmsBanner";
import {
  executeRecaptcha,
  mountRecaptcha,
  unmountRecaptcha,
} from "@/lib/recaptcha";

type IntlTelInputInstance = ReturnType<typeof intlTelInput>;

interface FormState {
  full_name: string;
  email: string;
  city: string;
  subject: string;
  message: string;
  terms_accepted: boolean;
}

interface ErrorsState {
  full_name?: string;
  email?: string;
  mobile?: string;
  city?: string;
  subject?: string;
  message?: string;
  terms_accepted?: string;
  submit?: string;
}

const socialIcons = [
  { href: "https://facebook.com", Icon: FaFacebookF },
  { href: "https://instagram.com", Icon: FaInstagram },
  { href: "https://linkedin.com", Icon: FaLinkedinIn },
  { href: "https://youtube.com", Icon: FaYoutube },
  { href: "https://wa.me/918976500022", Icon: RiWhatsappFill },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const inputClassName =
  "h-[50px] w-full rounded-[4px] border border-[#E5E5E5] bg-white px-4 text-[15px] text-[#111827] outline-none transition focus:border-[#154C86] focus:ring-2 focus:ring-[#154C86]/10";
const labelClassName = "mb-1 block text-[15px] font-medium text-[#374151]";
const contactIconClassName =
  "h-[20px] w-[20px] shrink-0 fill-current text-[#FFFFFF]";
const CONTACT_RECAPTCHA_ACTION = "contact_submit";

const splitFullName = (fullName: string) => {
  const trimmedName = fullName.trim().replace(/\s+/g, " ");
  if (!trimmedName) return { first_name: "", last_name: "" };
  const nameParts = trimmedName.split(" ");
  return {
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" "),
  };
};

const hasAlphabet = (value: string) => /[A-Za-z]/.test(value);

const ContactForm = () => {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<IntlTelInputInstance | null>(null);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    city: "",
    subject: "",
    message: "",
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<ErrorsState>({});
  const [loading, setLoading] = useState(false);
  const [, setMobileTouched] = useState(false);

  useEffect(() => {
    if (phoneRef.current && !itiRef.current) {
      try {
        itiRef.current = intlTelInput(phoneRef.current, {
          initialCountry: "in",
          separateDialCode: true,
          utilsScript:
            "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
        });
        // Ensure the iti container takes full width
        const container = phoneRef.current.closest(".iti");
        if (container) container.classList.add("w-full");
      } catch (error) {
        console.error("Error initializing intl-tel-input:", error);
      }
    }

    return () => {
      if (itiRef.current) {
        try {
          itiRef.current.destroy();
        } catch (error) {
          console.error("Error destroying intl-tel-input:", error);
        }
        itiRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    mountRecaptcha().catch((error) => {
      if (!isMounted) return;
      console.error("Failed to initialize reCAPTCHA:", error);
    });

    return () => {
      isMounted = false;
      unmountRecaptcha();
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof ErrorsState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateMobileNumber = () => {
    const mobileValue = phoneRef.current?.value?.trim() || "";
    const normalizedMobile = mobileValue.replace(/[\s\-().]/g, "");
    const mobileDigits = normalizedMobile.replace(/\D/g, "");
    const selectedCountry =
      itiRef.current?.getSelectedCountryData()?.iso2 || "in";

    if (!mobileValue) return "Mobile number is required";

    if (hasAlphabet(normalizedMobile)) {
      return "Mobile number must contain digits only";
    }

    if (!/^\+?\d+$/.test(normalizedMobile)) {
      return "Please enter a valid mobile number";
    }

    if (selectedCountry === "in") {
      if (mobileDigits.length !== 10) {
        return "Mobile number must be exactly 10 digits";
      }

      if (!/^[6-9]/.test(mobileDigits)) {
        return "Indian mobile number must start with 6, 7, 8, or 9";
      }

      return "";
    }

    if (mobileDigits.length < 6) return "Mobile number is too short";
    if (mobileDigits.length > 15) return "Mobile number is too long";

    return "";
  };

  const handleMobileChange = () => {
    if (errors.mobile || errors.submit) {
      setErrors((prev) => ({ ...prev, mobile: undefined, submit: undefined }));
    }
  };

  const handleMobileBlur = () => {
    const mobileValue = phoneRef.current?.value?.trim() || "";

    if (!mobileValue) {
      setMobileTouched(false);
      setErrors((prev) => ({ ...prev, mobile: undefined }));
      return;
    }

    const mobileError = validateMobileNumber();
    setMobileTouched(true);
    setErrors((prev) => ({ ...prev, mobile: mobileError || undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: ErrorsState = {};
    const mobileError = validateMobileNumber();
    setMobileTouched(true);
    if (!form.full_name.trim()) newErrors.full_name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Please enter a valid email";
    if (mobileError) newErrors.mobile = mobileError;
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.subject) newErrors.subject = "Please select a subject";
    if (!form.message.trim()) newErrors.message = "Message is required";
    if (!form.terms_accepted)
      newErrors.terms_accepted = "You must agree to the terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setErrors((prev) => ({ ...prev, submit: undefined }));
    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha(CONTACT_RECAPTCHA_ACTION);
      const { first_name, last_name } = splitFullName(form.full_name);
      const mobile = phoneRef.current?.value?.trim() || "";
      let countryCode = "+91";

      if (itiRef.current) {
        const countryData = itiRef.current.getSelectedCountryData();
        countryCode = countryData.dialCode ? `+${countryData.dialCode}` : "+91";
      }

      const payload = {
        first_name,
        last_name,
        email: form.email,
        mobile,
        city: form.city,
        subject: form.subject,
        message: form.message,
        terms_accepted: form.terms_accepted,
        country_code: countryCode,
        recaptcha_token: recaptchaToken,
      };

      const response = await fetch(`${API_BASE}/api/contact-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Submission failed");

      setForm({
        full_name: "",
        email: "",
        city: "",
        subject: "",
        message: "",
        terms_accepted: false,
      });
      if (phoneRef.current) phoneRef.current.value = "";
      setMobileTouched(false);
      router.push("/thank-You");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error && error.message.includes("RECAPTCHA_SITE_KEY")
            ? "Captcha is not configured. Please contact support."
            : "Failed to submit. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="font-poppins relative">
      <CMSBanner title="Contact Us" bgImage="/images/contact-bg.png" />

      <div className="relative max-w-7xl mx-auto  mb-[60px]">
        <div
          className="mx-auto grid w-full overflow-hidden rounded-[14px] bg-white 
  shadow-[0px_-4px_20px_rgba(0,0,0,0.03),0px_10px_30px_rgba(0,0,0,0.05)] 
  lg:grid-cols-[5fr_7fr]"
        >
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#062444] via-[#0C3766] to-[#154C86] p-8 md:p-12 text-white">
            <div>
              <h2 className="text-[24px] md:text-[30px] font-semibold">
                Contact Us
              </h2>
              <p className="mt-4 max-w-[420px] text-[15px] md:text-[16px] leading-[26px] text-[#ffffff]">
                If you&apos;d like to talk about your investments or have a
                question about our platform, reach us using any of the options
                below.
              </p>

              <div className="lg:py-[60px] py-[40px] space-y-[30px]">
                <div className="flex items-center gap-4">
                  <IoMail className={contactIconClassName} />
                  <p className="text-[15px] md:text-[16px] break-all">
                    info@moneynowwealth.com
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <FaPhoneAlt className={contactIconClassName} />
                  <p className="text-[15px] md:text-[16px]">+91 89765 000 22</p>
                </div>
                <div className="flex items-center gap-4">
                  <RiWhatsappFill className={contactIconClassName} />
                  <p className="text-[15px] md:text-[16px]">+91 89765 000 22</p>
                </div>
                <div className="flex items-start gap-4">
                  <FaMapMarkerAlt className={`${contactIconClassName} mt-1`} />
                  <p className="text-[15px] md:text-[16px] leading-[28px]">
                    A1, 108, Sarova Complex, <br></br> Thakur Village, Kandivali
                    East, <br></br> Mumbai - 400101
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-0 flex flex-wrap gap-3">
              {socialIcons.map(({ href, Icon }, index) => (
                <Link
                  key={index}
                  href={href}
                  target="_blank"
                  className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <Icon size={20} />
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6 p-10 ">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="w-full">
                  <label htmlFor="full_name" className={labelClassName}>
                    Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={form.full_name}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.full_name ? "border-red-500" : ""}`}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.full_name}
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <label htmlFor="email" className={labelClassName}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="w-full">
                  <label htmlFor="contact_mobile" className={labelClassName}>
                    Mobile number
                  </label>
                  <input
                    id="contact_mobile"
                    ref={phoneRef}
                    type="tel"
                    onChange={handleMobileChange}
                    onBlur={handleMobileBlur}
                    className={`${inputClassName} ${errors.mobile ? "border-red-500" : ""}`}
                  />
                  {errors.mobile && (
                    <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>
                  )}
                </div>
                <div className="w-full">
                  <label htmlFor="city" className={labelClassName}>
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Your City"
                    value={form.city}
                    onChange={handleChange}
                    className={`${inputClassName} ${errors.city ? "border-red-500" : ""}`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className={labelClassName}>
                  I am contacting about
                </label>
                <div className="relative">
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`${inputClassName} appearance-none pr-10 cursor-pointer ${errors.subject ? "border-red-500" : ""}`}
                  >
                    <option value="">Select a subject</option>
                    <option value="Investment Inquiry">
                      Investment Inquiry
                    </option>
                    <option value="Support">Support</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Others">Others</option>
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-400" />
                </div>
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className={labelClassName}>
                  Your message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={handleChange}
                  className={`w-full rounded-[4px] border border-[#E5E5E5] p-4 text-[15px] outline-none transition focus:border-[#154C86] min-h-[120px] ${errors.message ? "border-red-500" : ""}`}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                )}
              </div>

              <div className="flex items-start gap-3 pt-1">
                <input
                  id="terms_accepted"
                  name="terms_accepted"
                  type="checkbox"
                  checked={form.terms_accepted}
                  onChange={handleChange}
                  /* Removed mt-1 to prevent it from pushing too far down */
                  className="h-4 w-4 leading-[1.4] shrink-0 rounded border-gray-300 text-[#154C86] focus:ring-[#154C86] mt-[0px]"
                />
                <label
                  htmlFor="terms_accepted"
                  className="text-[13px] mb-0 leading-[1.4] select-none"
                >
                  By submitting this form, you agree to be contacted by the
                  Moneynow team on the details shared by you.
                </label>
              </div>
              {errors.terms_accepted && (
                <p className="text-xs text-red-500">{errors.terms_accepted}</p>
              )}

              <div className="pt-4 text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer sm:w-auto rounded-[4px] bg-[#154C86] px-10 py-3.5 text-[16px] font-semibold text-white transition hover:bg-[#0F3A67] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>

              {errors.submit && (
                <p className="text-center text-sm text-red-500 mt-4">
                  {errors.submit}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
