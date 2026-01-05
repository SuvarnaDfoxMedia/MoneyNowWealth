"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import intlTelInput from "intl-tel-input";
import { ChevronRight, MapPin, Phone, Mail } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

type IntlTelInputInstance = ReturnType<typeof intlTelInput>;

const socialIcons = [
  { href: "https://facebook.com", icon: (mobile: boolean) => <FaFacebookF size={mobile ? 16 : 20} /> },
  { href: "https://instagram.com", icon: (mobile: boolean) => <FaInstagram size={mobile ? 16 : 20} /> },
  { href: "https://linkedin.com", icon: (mobile: boolean) => <FaLinkedinIn size={mobile ? 16 : 20} /> },
  { href: "https://youtube.com", icon: (mobile: boolean) => <FaYoutube size={mobile ? 16 : 20} /> },
  { href: "https://wa.me/919833559143", icon: (mobile: boolean) => <FaWhatsapp size={mobile ? 16 : 20} /> },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const ContactForm = () => {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<IntlTelInputInstance | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    subject: "",
    message: "",
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    subject?: string;
    message?: string;
    mobile?: string;
    terms_accepted?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  // Initialize intl-tel-input
  useEffect(() => {
    if (phoneRef.current) {
      const iti = intlTelInput(phoneRef.current, {
        initialCountry: "in",
        separateDialCode: true,
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
      });
      itiRef.current = iti;
      iti.setNumber("");
      return () => iti.destroy();
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};

    if (!form.first_name) newErrors.first_name = "First name is required";
    if (!form.last_name) newErrors.last_name = "Last name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!form.subject) newErrors.subject = "Please select a subject";
    if (!form.message) newErrors.message = "Message is required";
    if (!form.terms_accepted)
      newErrors.terms_accepted = "Please accept Terms and Conditions";

    let mobile = "";
    let country_code = "+91";
    if (itiRef.current && phoneRef.current) {
      const countryData = itiRef.current.getSelectedCountryData();
      country_code = countryData.dialCode ? "+" + countryData.dialCode : "+91";
      mobile = phoneRef.current.value.trim();
    }
    if (!mobile) newErrors.mobile = "Contact number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = { ...form, mobile, country_code };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/contact-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      await fetch(`${API_BASE}/api/contact-thank-you`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, first_name: form.first_name }),
      });

      // Reset form
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        subject: "",
        message: "",
        terms_accepted: false,
      });
      itiRef.current?.setNumber("");
      if (phoneRef.current) phoneRef.current.value = "";

      router.push("/thank-You");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full font-poppins">
      {/* HEADER */}
      <div className="w-full bg-[#D9D9D9] py-12 text-center">
        <h1 className="text-[36px] font-bold mb-2">Contact Us</h1>
        <div className="inline-flex items-center gap-1 bg-black text-white text-[16px] px-3 py-1 rounded">
          <span>Home</span>
          <ChevronRight size={14} />
          <span>Contact Us</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-14">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          {/* LEFT INFO */}
          <div className="lg:col-span-6 space-y-6">

         <div className="flex flex-col gap-4">
  {/* Address */}
  <div className="flex gap-4 border-b border-[#E8E8E8] pb-6">
    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-dashed border-black">
      <MapPin size={16} className="sm:hidden" />
      <MapPin size={18} className="hidden sm:block" />
    </div>
    <p className="text-[14px] sm:text-[16px] leading-[22px] sm:leading-[26px]">
      A1, 108, Sarova Towers Rd, Phase 1, Samata Nagar <br />
      Thakur Village, Kandivali East, Mumbai,<br />
      Maharashtra 400101
    </p>
  </div>

  {/* Phone */}
  <div className="flex gap-4 border-b border-[#E8E8E8] pb-6">
    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-dashed border-black">
      <Phone size={16} className="sm:hidden" />
      <Phone size={18} className="hidden sm:block" />
    </div>
    <div>
      <p className="text-[16px] sm:text-[18px] font-semibold">+91 98335 59143</p>
      <p className="text-[12px] sm:text-[13px]">Any questions? Call us.</p>
    </div>
  </div>

  {/* Email */}
  <div className="flex gap-4 border-b border-[#E8E8E8] pb-6">
    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-dashed border-black">
      <Mail size={16} className="sm:hidden" />
      <Mail size={18} className="hidden sm:block" />
    </div>
    <div>
      <p className="text-[16px] sm:text-[18px] font-semibold">
        support@moneynowwealth.com
      </p>
      <p className="text-[12px] sm:text-[13px]">Any questions? Email us.</p>
    </div>
  </div>
</div>



            <div className="flex flex-wrap gap-3 mt-6">
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

          <div className="lg:col-span-6">
            <form onSubmit={handleSubmit} className="space-y-4 text-[16px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">
                    First Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter first name"
                    className={`w-full h-[42px] border px-3 outline-none ${errors.first_name ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block mb-1">
                    Last Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter last name"
                    className={`w-full h-[42px] border px-3 outline-none ${errors.last_name ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Enter email"
                    className={`w-full h-[42px] border px-3 outline-none ${errors.email ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block mb-1">
                    Contact No.<span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    placeholder="Enter contact number"
                    className={`w-full h-[42px] border px-3 outline-none ${errors.mobile ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  Subject<span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={`w-full h-[42px] border px-3 outline-none ${errors.subject ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select Subject</option>
                  <option value="Support">Support</option>
                  <option value="Partner">Partner</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Others">Others</option>
                </select>
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label className="block mb-1">
                  Message<span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter your message"
                  className={`w-full border px-3 py-2 outline-none ${errors.message ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={form.terms_accepted}
                  onChange={handleChange}
                  className="mt-1"
                />
                <p>I agree to the <span className="text-[#043F79] cursor-pointer">Terms and Conditions</span></p>
              </div>
              {errors.terms_accepted && <p className="text-red-500 text-sm">{errors.terms_accepted}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-[#043F79] text-white px-8 py-3 rounded"
              >
                {loading ? "Submitting..." : "SUBMIT"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
