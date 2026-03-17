
"use client";

import React, { useEffect, useRef, useState } from "react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaCheckSquare } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type IntlTelInputInstance = ReturnType<typeof intlTelInput>;

const Register = () => {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiInstanceRef = useRef<IntlTelInputInstance | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    firstname?: string;
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
        autoPlaceholder: "polite",
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
      });

      itiInstanceRef.current = iti;

      return () => {
        iti.destroy();
      };
    }
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!firstname.trim()) {
      newErrors.firstname = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/.test(password)
    ) {
      newErrors.password =
        "Password must be 8+ chars, include uppercase, number & special character";
    }

    const mobile = phoneRef.current?.value.trim();

    if (!mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!itiInstanceRef.current?.isValidNumber()) {
      newErrors.mobile = "Invalid mobile number";
    }

    if (!termsAccepted) {
      newErrors.terms = "Please accept the terms";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const countryData = itiInstanceRef.current?.getSelectedCountryData();

    const countryCode = "+" + (countryData?.dialCode || "91");

    const mobile = phoneRef.current?.value.trim();

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: firstname,
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

        setFirstname("");
        setEmail("");
        setPassword("");
        setTermsAccepted(false);

        if (phoneRef.current) phoneRef.current.value = "";

        router.push("/auth/login");
      } else {
        toast.error(data.message || "Registration failed");

        if (data.message?.includes("Email")) {
          setErrors((prev) => ({
            ...prev,
            email: data.message,
          }));
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full min-h-screen bg-[url('/images/reg-bg-image.png')] bg-cover bg-center bg-no-repeat font-poppins bg-fixed">
      <div className="min-h-screen max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-7/12 flex-col justify-center p-8">
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[32px] font-bold text-[#0B172A] leading-tight">
            <span>Join</span>

            <Image
              src="/images/register-money-now-logo.png"
              alt="MoneyNow Logo"
              width={257}
              height={50}
              className="object-contain"
              priority
            />

            <span>& Unlock:</span>
          </div>

          <div className="mt-8 mb-10 border-b-2 border-dashed border-[#000000] w-3/4" />

          <ul className="space-y-6">
            {[
              "Financial Calculators",
              "Investment Blogs",
              "Learning Topics",
              "Portfolio Tracking",
              "Smart Investment Insights",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-4">
                <FaCheckSquare className="text-[#0A4A86] text-[28px] shrink-0" />
                <span className="text-[18px] text-[#000]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-5/12 flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] rounded-[14px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 md:p-10 border border-white/50">
            <h2 className="text-center text-[32px] font-semibold">
              Register For <span className="text-[#0A4A86]">Free</span>
            </h2>

            <p className="mt-3 mb-[24px] text-center text-[16px]">
              Create your MoneyNow account and begin investing with confidence.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NAME */}
              <div>
                <label className="block mb-1 text-[16px]">Full Name</label>
                <input
                  type="text"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full h-[50px] rounded-[4px] border border-[#D8DEE8] bg-gray-50/30 px-4 text-[14px]"
                />
                {errors.firstname && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {errors.firstname}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block mb-1 text-[16px]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[50px] rounded-[4px] border border-[#D8DEE8] bg-gray-50/30 px-4 text-[14px]"
                />
                {errors.email && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* MOBILE */}
              <div>
                <label className="block mb-1 text-[16px]">Contact Number</label>
                <input
                  ref={phoneRef}
                  type="tel"
                  className="w-full h-[50px] rounded-[4px] border border-[#D8DEE8] bg-gray-50/30 px-4 text-[14px]"
                />
                {errors.mobile && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {errors.mobile}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block mb-1 text-[16px]">Password</label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[50px] rounded-[4px] border border-[#D8DEE8] bg-gray-50/30 px-4 pr-12 text-[14px]"
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
                  >
                    {showPassword ? (
                      <AiOutlineEye size={22} />
                    ) : (
                      <AiOutlineEyeInvisible size={22} />
                    )}
                  </span>
                </div>

                {errors.password && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* TERMS */}
              <div>
                <label className="flex items-start gap-3 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0A4A86]"
                  />
                  <span>
                    By clicking “Create account” I accept the{" "}
                    <span className="text-[#0A4A86] underline font-medium">
                      Terms of Service
                    </span>
                  </span>
                </label>

                {errors.terms && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {errors.terms}
                  </p>
                )}
              </div>

           <div className="text-center">
               {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="px-[30px] py-[10px] bg-[#0A4A86] hover:bg-[#083c6d] text-white rounded-[4px] text-[16px] font-medium"
              >
                {loading ? "Registering..." : "Register for free"}
              </button>
           </div>

              <p className="text-center text-[14px] mt-2">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#0A4A86] font-bold hover:underline"
                >
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
