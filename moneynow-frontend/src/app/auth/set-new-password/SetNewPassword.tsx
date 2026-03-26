"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

const SetNewPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
    server?: string;
  }>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "Email is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 10) {
      newErrors.newPassword = "Password must be at least 10 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!token) {
      newErrors.server = "Invalid or expired reset link";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: newPassword,
            confirmPassword,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrors({
          server: result.message || "Failed to reset password",
        });
        return;
      }

      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch {
      setErrors({ server: "Server error. Try again later." });
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

      {/* Card */}
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 px-6 py-8">
        <h2 className="text-center text-[24px] font-semibold mb-[24px]">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block mb-1 text-[15px] md:text-[16px]">
              Email <span className="text-red-500">*</span>
            </label>

            <input
              type="email"
              className={`w-full h-[50px] rounded-[4px] border px-4 text-[14px] bg-gray-50/30
      focus:ring-2 focus:ring-[#0A4A86]/20 focus:border-[#0A4A86] outline-none
      ${errors.email ? "border-red-500" : "border-[#D8DEE8]"}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-[15px] md:text-[16px]">
              New Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className={`w-full h-[50px] rounded-[4px] border px-4 pr-12 text-[14px] bg-gray-50/30
        focus:ring-2 focus:ring-[#0A4A86]/20 focus:border-[#0A4A86] outline-none
        ${errors.newPassword ? "border-red-500" : "border-[#D8DEE8]"}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNewPassword ? (
                  <AiOutlineEye size={22} />
                ) : (
                  <AiOutlineEyeInvisible size={22} />
                )}
              </button>
            </div>

            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 text-[15px] md:text-[16px]">
              Confirm Password <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full h-[50px] rounded-[4px] border px-4 pr-12 text-[14px] bg-gray-50/30
        focus:ring-2 focus:ring-[#0A4A86]/20 focus:border-[#0A4A86] outline-none
        ${errors.confirmPassword ? "border-red-500" : "border-[#D8DEE8]"}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? (
                  <AiOutlineEye size={22} />
                ) : (
                  <AiOutlineEyeInvisible size={22} />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}

            <p className="text-gray-500 text-center text-[13px] leading-[22px] mt-6 ">
              Your password must be at least 10 characters. Include multiple
              words and phrases to make it more secure.
            </p>
          </div>

          {/* Server Error */}
          {errors.server && (
            <p className="text-red-600 text-sm text-center">{errors.server}</p>
          )}

          {/* Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="px-[30px] py-[10px] bg-[#0A4A86] hover:bg-[#083c6d] text-white rounded-[4px] text-[16px] font-medium transition-all shadow-lg active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-[#0A4A86] text-[14px] font-medium hover:underline"
            >
              <FiArrowLeft className="text-[16px]" />
              Back to Login
            </Link>
          </div>

          {/* Redirect Info */}
          <p className="text-center text-[13px] text-gray-500">
            You’ll be redirected to login after updating your password.
          </p>
        </form>
      </div>
    </section>
  );
};

export default SetNewPassword;
