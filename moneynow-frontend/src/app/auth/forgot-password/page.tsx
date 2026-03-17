"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";

const ForgotPassword = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          result.message || "Password reset link sent to your email",
        );
        setEmail("");
      } else {
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full py-[30px] min-h-screen flex flex-col items-center justify-center px-4 font-poppins bg-[url('/images/log-in-bg.png')] bg-cover bg-center bg-no-repeat bg-fixed">
      {/* Logo */}
      <div className="relative pb-6">
        <div className="relative w-[246px] h-[40px]">
          <Image
            src="/images/register-money-now-logo.png"
            alt="MoneyNow Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-center text-[30px] md:text-[40px] font-semibold leading-[1.3] text-[#080808] mb-8">
        Access Restored In Minutes.
      </h1>

      {/* Main Card */}
      <div className="w-full max-w-[470px] bg-[#FFFFFF] rounded-[14px] shadow-[0px_12px_38px_rgba(0,0,0,0.08)] px-8 py-8">
        <h2 className="text-center text-[24px] md:text-[24px] font-semibold">
          Forget Your Password?
        </h2>

        <p className="text-center text-[14px] md:text-[14px] leading-[1.5]  mt-4 mb-6">
          Enter your registered email address.
          <br />
          We&apos;ll send you a secure link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block mb-2 text-[15px] md:text-[16px]">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-[50px] rounded-[4px] border px-4 text-[14px] outline-none transition-all ${
                error
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-[#D7D7D7] focus:border-[#0A4A86] focus:ring-2 focus:ring-[#DCE9F9]"
              }`}
            />

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="py-[10px] px-[30px] rounded-[4px] bg-[#0A4A86] text-[#ffffff] text-[16px] font-medium hover:bg-[#083c6d] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>

          {/* Back */}
          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-[#0A4A86] text-[14px] font-medium hover:underline"
            >
              <FiArrowLeft className="text-[16px]" />
              Back to Login
            </Link>
          </div>

          {/* Assistance */}
          <p className="text-center text-[13px] text-[#323232]">
            Need assistance?{" "}
            <Link href="/contact-us" className="underline hover:text-black">
              Contact us
            </Link>
          </p>
        </form>
      </div>

      {/* Bottom Card */}
      <div className="mt-10 bg-white/36 backdrop-blur-md border border-[#E5E5E5] rounded-2xl px-6 md:px-8 py-5 flex items-center gap-4 shadow-sm max-w-[430px] w-[92%] sm:w-full mx-4">
        <div className="relative w-[50px] h-[50px] flex-shrink-0">
          <Image
            src="/images/login-bottom-mobile.png"
            alt="Mobile"
            fill
            className="object-contain"
          />
        </div>
        <div>
          <h4 className="font-medium text-[14px] md:text-[16px] mb-1">
            Access MoneyNow on the Go
          </h4>
          <p className="text-[12px] md:text-[14px]">
            Track your investments anytime, anywhere.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
