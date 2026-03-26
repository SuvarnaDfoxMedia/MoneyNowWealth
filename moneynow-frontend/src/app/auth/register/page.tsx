"use client";

import React, { useEffect, useRef, useState } from "react";
import intlTelInput from "intl-tel-input";
import type { IntlTelInputInstance } from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaCheckSquare } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { executeRecaptcha, mountRecaptcha, unmountRecaptcha } from "@/lib/recaptcha";

const SIGNUP_RECAPTCHA_ACTION = "signup";

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

  useEffect(() => {
    if (!phoneRef.current) return;

    const iti = intlTelInput(phoneRef.current, {
      initialCountry: "in",
      separateDialCode: true,
      autoPlaceholder: "off",
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
    });

    itiInstanceRef.current = iti;

    return () => {
      iti.destroy();
      itiInstanceRef.current = null;
    };
  }, []);

  const getMobileValue = () => phoneRef.current?.value?.trim() || "";

  const getMobileDigits = () => getMobileValue().replace(/\D/g, "");

  const getDialCode = (): string => {
    const iti = itiInstanceRef.current;
    if (!iti) return "+91";

    try {
      const countryData = iti.getSelectedCountryData();
      return `+${countryData.dialCode}`;
    } catch (error) {
      console.error("Error getting dial code:", error);
      return "+91";
    }
  };

  const validateMobileNumber = () => {
    const mobileValue = getMobileValue();
    const mobileDigits = getMobileDigits();
    const selectedCountry =
      itiInstanceRef.current?.getSelectedCountryData()?.iso2 || "in";

    if (!mobileValue) {
      return "Mobile number is required";
    }

    if (/[A-Za-z]/.test(mobileValue)) {
      return "Mobile number must contain digits only";
    }

    if (!/^[\d\s\-().]+$/.test(mobileValue)) {
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

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const mobileError = validateMobileNumber();

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

    if (mobileError) {
      newErrors.mobile = mobileError;
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

    const mobile = getMobileDigits();
    const countryCode = getDialCode();

    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha(SIGNUP_RECAPTCHA_ACTION);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: firstname.trim(),
          email: email.trim(),
          password,
          mobile: mobile, // Send the cleaned number without spaces
          countryCode,
          termsAccepted,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Registration successful!");

        setFirstname("");
        setEmail("");
        setPassword("");
        setTermsAccepted(false);

        if (phoneRef.current) {
          phoneRef.current.value = "";
          const iti = itiInstanceRef.current;
          if (iti) {
            iti.setNumber("");
          }
        }

        router.push("/auth/login");
        return;
      }

      toast.error(data.message || "Registration failed");

      if (data.message?.includes("Email")) {
        setErrors((prev) => ({
          ...prev,
          email: data.message,
        }));
      }

      if (data.message?.includes("phone") || data.message?.includes("mobile")) {
        setErrors((prev) => ({
          ...prev,
          mobile: data.message,
        }));
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (
        error instanceof Error &&
        error.message.includes("RECAPTCHA_SITE_KEY")
      ) {
        toast.error("Captcha is not configured. Please contact support.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = () => {
    if (errors.mobile) {
      setErrors((prev) => ({ ...prev, mobile: undefined }));
    }
  };

  const handleMobileBlur = () => {
    const mobileValue = getMobileValue();

    if (!mobileValue) {
      setErrors((prev) => ({ ...prev, mobile: undefined }));
      return;
    }

    const mobileError = validateMobileNumber();
    setErrors((prev) => ({ ...prev, mobile: mobileError || undefined }));
  };

  return (
    <section className="w-full min-h-screen bg-[url('/images/reg-bg-image.png')] bg-cover bg-center bg-no-repeat font-poppins bg-fixed">
      <div className="min-h-screen max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
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

        <div className="w-full lg:w-5/12 flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] rounded-[14px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 md:p-10 border border-white/50">
            <h2 className="text-center text-[32px] font-semibold">
              Register For <span className="text-[#0A4A86]">Free</span>
            </h2>

            <p className="mt-3 mb-[24px] text-center text-[16px]">
              Create your MoneyNow account and begin investing with confidence.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div>
                <label className="block mb-1 text-[16px]">Contact Number</label>
                <input
                  ref={phoneRef}
                  type="tel"
                  onChange={handleMobileChange}
                  onBlur={handleMobileBlur}
                  className="w-full h-[50px] rounded-[4px] border border-[#D8DEE8] bg-gray-50/30 px-4 text-[14px]"
                />
                {errors.mobile && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {errors.mobile}
                  </p>
                )}
              </div>

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

              <div>
                <label className="flex items-start gap-3 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0A4A86]"
                  />
                  <span>
                    By clicking &quot;Create account&quot; I accept the{" "}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="px-[30px] py-[10px] bg-[#0A4A86] hover:bg-[#083c6d] text-white rounded-[4px] text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
