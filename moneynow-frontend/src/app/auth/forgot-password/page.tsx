
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";

const ForgotPassword = () => {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          result.message || "Password reset link sent to your email"
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
    <section
      className={`
        w-full min-h-[106dvh] flex flex-col justify-center items-center
        font-poppins
        bg-white
        md:bg-[url('/images/forgot-pass-bg2.png')]
        md:bg-no-repeat md:bg-center md:bg-cover
      `}
    >
      <Toaster position="top-right" />

      {/* Logo */}
      <div className="mb-4 sm:mb-6">
        <Image
          src="/images/moneynow-logo2.png"
          alt="MoneyNow Logo"
          width={180}
          height={60}
          className="mx-auto h-14 w-auto"
          priority
        />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 sm:mx-6 px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Header */}
        <div className="border-b border-gray-300 pb-3 mb-4 sm:pb-4 sm:mb-6">
          <h2 className="text-center text-[24px] font-bold">
            Forgot Your Password
          </h2>
          <p className="text-center text-[13px] mt-1">
            Enter your email address below and you will receive a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          
          {/* Email */}
          <div>
            <label className="block mb-1 text-[14px]">
              Email:<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={`w-full border rounded h-[40px] px-3 text-[15px]
                focus:outline-none focus:ring-2 focus:ring-blue-600
                ${error ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p className="text-red-500 text-[13px] mt-1">{error}</p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#043F79] hover:bg-[#002b6d] text-white py-[10px] sm:py-[12px] px-6 sm:px-8 rounded text-[15px] sm:text-[16px] font-semibold transition-colors"
          >
            {loading ? "Sending..." : "Reset Password"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
