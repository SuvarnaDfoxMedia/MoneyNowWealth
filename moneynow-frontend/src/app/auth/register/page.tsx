

"use client";

import React, { useEffect, useRef, useState } from "react";
import intlTelInput from "intl-tel-input";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineCheck } from "react-icons/ai";
import Link from "next/link";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import type { IntlTelInputInstance } from "intl-tel-input";

const Register = () => {
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiInstanceRef = useRef<IntlTelInputInstance | null>(null);
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ;

  const [title, setTitle] = useState("Mr");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation error messages
  const [errors, setErrors] = useState<{
    title?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    mobile?: string;
    terms?: string;
  }>({});

  useEffect(() => {
    if (phoneRef.current) {
      const iti = intlTelInput(phoneRef.current, {
        initialCountry: "in",
        separateDialCode: true,
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
      });
      itiInstanceRef.current = iti;
      iti.setNumber("");
      return () => iti.destroy();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let mobile = "";
    let countryCode = "+91";

    if (itiInstanceRef.current && phoneRef.current) {
      const countryData = itiInstanceRef.current.getSelectedCountryData();
      countryCode = countryData.dialCode ? "+" + countryData.dialCode : "+91";
      mobile = phoneRef.current.value.trim();
    }

    // Reset errors
    setErrors({});

    // Frontend validations
    const newErrors: typeof errors = {};
    if (!title || !["Mr", "Mrs"].includes(title)) newErrors.title = "Title must be Mr or Mrs";
    if (!firstname) newErrors.firstname = "First name is required";
    if (!lastname) newErrors.lastname = "Last name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/.test(password))
      newErrors.password = "Password must be 8+ chars, include 1 uppercase, 1 number & 1 special character";
    if (!mobile) newErrors.mobile = "Mobile number is required";
    if (!termsAccepted) newErrors.terms = "Please accept the terms";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
       const res = await fetch(`${API_BASE}/api/auth/register`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          firstname,
          lastname,
          email,
          password,
          mobile,
          countryCode,
          termsAccepted,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Registration successful!");
        // reset form
        setTitle("Mr");
        setFirstname("");
        setLastname("");
        setEmail("");
        setPassword("");
        setTermsAccepted(false);
        itiInstanceRef.current?.setNumber("");
        setErrors({});
      } else {
        // If backend sends validation message
        setErrors({ ...errors, email: data.message.includes("Email") ? data.message : undefined });
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full min-h-[135dvh] my-0 flex items-center md:bg-[url('/images/register-bg-3.png')] bg-no-repeat bg-cover bg-center">
      <Toaster position="top-right" reverseOrder={false} />

<div className="container mx-auto px-4 sm:px-6 md:px-[70px] py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* LEFT SECTION */}
          <div className="md:col-span-7 self-center">
            <Image
              src="/images/moneynow-logo2.png"
              alt="Logo"
              width={260}
              height={80}
              className="mb-4 md:mb-6 w-[250px] md:w-auto"
              priority
            />
            <h1 className="text-[26px] md:text-[32px] font-bold leading-[36px] md:leading-[48px] text-black mb-4 md:mb-6">
              Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit
            </h1>
            <p className="text-[16px] md:text-[18px] font-inter mb-4 md:mb-6 leading-[28px]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <ul className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-sm">
                    <AiOutlineCheck className="w-3 h-3" />
                  </span>
                  <p className="text-[15px] text-gray-700">Sed congue dolor quis mi maximus fermentum</p>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT SECTION */}
          <div className="md:col-span-5 px-0 sm:px-4 md:px-0">
              <div className="bg-white border rounded-[10px] border-gray-200 shadow-sm px-4 md:px-6 py-3 md:py-4">

              {/* Header */}
              <div className="border-b border-[#E8E8E8] text-center pb-4 md:pb-3">
                <h2 className="text-[22px] md:text-[26px] font-bold mb-1">Register User</h2>
                <p className="text-[15px]">Welcome! Please fill the details</p>
              </div>

              {/* Form */}
             <div className="pt-4 md:pt-5">
  <form onSubmit={handleSubmit}>

    {/* Title */}
    <div className="flex items-center gap-3 mb-2 md:mb-3">
      <label className="text-[15px] text-gray-700 whitespace-nowrap">
        Title<span className="text-red-500">*</span>
      </label>

      {["Mr", "Mrs"].map((t) => (
        <label
          key={t}
          className="flex items-center gap-2 text-gray-700 text-[15px]"
        >
          <input
            type="radio"
            name="title"
            checked={title === t}
            onChange={() => setTitle(t)}
            className="h-4 w-4"
          />
          {t}
        </label>
      ))}
    </div>
    {errors.title && (
      <p className="text-red-500 text-[13px] mb-2">{errors.title}</p>
    )}

    {/* First & Last Name */}
    <div className="grid grid-cols-1 gap-3 mb-2 md:mb-3">
      <div>
        <label className="text-[15px] block mb-1">
          First Name<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter first name"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          className="w-full h-[44px] border border-[#E8E8E8] px-3 text-[15px] placeholder:text-[15px] focus:outline-none focus:border-[#355DEF]"
        />
        {errors.firstname && (
          <p className="text-red-500 text-[13px] mt-1">
            {errors.firstname}
          </p>
        )}
      </div>

      <div>
        <label className="text-[15px] block mb-1">
          Last Name<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter last name"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          className="w-full h-[44px] border border-[#E8E8E8] px-3 text-[15px] placeholder:text-[15px] focus:outline-none focus:border-[#355DEF]"
        />
        {errors.lastname && (
          <p className="text-red-500 text-[13px] mt-1">
            {errors.lastname}
          </p>
        )}
      </div>
    </div>

    {/* Email */}
    <div className="mb-2 md:mb-3">
      <label className="text-[15px] block mb-1">
        Email<span className="text-red-500">*</span>
      </label>
      <input
        type="email"
        placeholder="Enter email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full h-[44px] border border-[#E8E8E8] px-3 text-[15px] placeholder:text-[15px] focus:outline-none focus:border-[#355DEF]"
      />
      {errors.email && (
        <p className="text-red-500 text-[13px] mt-1">{errors.email}</p>
      )}
    </div>

    {/* Contact Number */}
    <div className="mb-2 md:mb-3">
      <label className="text-[15px] block mb-1">
        Contact Number<span className="text-red-500">*</span>
      </label>
      <input
        ref={phoneRef}
        type="tel"
        placeholder="Enter contact number"
        className="w-full h-[44px] border border-[#E8E8E8] px-3 text-[15px] placeholder:text-[15px] focus:outline-none focus:border-[#355DEF]"
      />
      {errors.mobile && (
        <p className="text-red-500 text-[13px] mt-1">
          {errors.mobile}
        </p>
      )}
    </div>

    {/* Password */}
    <div className="mb-2 md:mb-3">
      <label className="text-[15px] block mb-1">
        Password<span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-[44px] border border-[#E8E8E8] px-3 pr-10 text-[15px] placeholder:text-[15px] focus:outline-none focus:border-[#355DEF]"
        />
        <span
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[12px] cursor-pointer text-gray-500 text-[18px]"
        >
          {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
        </span>
      </div>
      {errors.password && (
        <p className="text-red-500 text-[13px] mt-1">
          {errors.password}
        </p>
      )}
    </div>

    {/* Terms */}
    <div className="mb-2 md:mb-3">
      <label className="flex items-center gap-2 text-[15px]">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="h-4 w-4"
        />
        I agree to the
        <span className="text-[#355DEF] cursor-pointer">
          Terms and Conditions
        </span>
      </label>
      {errors.terms && (
        <p className="text-red-500 text-[13px] mt-1">{errors.terms}</p>
      )}
    </div>

    {/* Submit */}
    <button
      type="submit"
      disabled={loading}
      className="bg-[#043F79] px-[18px] rounded-[5px] text-white py-[10px] text-[15px] hover:bg-[#002b6d]"
    >
      {loading ? "Registering..." : "REGISTER NOW"}
    </button>

    <p className="text-[15px] mt-3">
      Already have an account?
      <Link
        href="/auth/login"
        className="text-[#355DEF] underline ml-1"
      >
        Log in
      </Link>
    </p>

  </form>
</div>


            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Register;
