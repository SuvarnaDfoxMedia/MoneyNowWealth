"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { executeRecaptcha, mountRecaptcha, unmountRecaptcha } from "@/lib/recaptcha";

const LOGIN_RECAPTCHA_ACTION = "login";

const Login = () => {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors: { email?: string; password?: string } = {};
    if (!email) validationErrors.email = "Email is required.";
    if (!password) validationErrors.password = "Password is required.";
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha(LOGIN_RECAPTCHA_ACTION);
      const res = await fetch(`${API_BASE}/api/auth/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Login successful");
        router.push("/user/dashboard");
      } else {
        setErrors(data.errors || { email: data.message });
      }
    } catch (error) {
      setErrors({
        email:
          error instanceof Error &&
          error.message.includes("RECAPTCHA_SITE_KEY")
            ? "Captcha is not configured. Please contact support."
            : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Google Login Failed");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful");
        router.push("/user/dashboard");
      } else {
        toast.error(data.message || "Google Login Failed");
      }
    } catch {
      toast.error("Google Login Failed");
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-col items-center py-8 md:py-12 font-poppins bg-[url('/images/log-in-bg.png')] bg-cover bg-center bg-no-repeat bg-fixed">
      {/* Header */}
      <div className="text-center mb-6 px-6">
        <p className="uppercase text-[16px] md:text-[20px] tracking-[4px] font-bold mb-4">
          Welcome Back To
        </p>

        <div className="relative w-[200px] md:w-[300px] h-[40px] md:h-[58px] mx-auto mb-4">
          <Image
            src="/images/login-page-logo.png"
            alt="MoneyNow Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <p className="text-[14px] md:text-[18px] leading-[22px] md:leading-[28px] max-w-[90%] md:max-w-full mx-auto">
          Access your mutual fund investments securely and continue your journey
          toward long-term goals.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[18px] shadow-[0px_10px_40px_rgba(0,0,0,0.06)] max-w-[430px] w-[92%] sm:w-full mx-4 p-6 md:p-8">
        <h2 className="text-center text-[20px] md:text-[24px] font-semibold mb-6">
          Log In To Your Account
        </h2>

        {/* GOOGLE LOGIN */}
        <div className="w-full mb-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => toast.error("Google Login Failed")}
          />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="w-[20px] border-t border-[#E5E5E5]"></div>
          <span className="mx-3 text-[14px]">or</span>
          <div className="w-[20px] border-t border-[#E5E5E5]"></div>
        </div>

        {/* FORM */}
        <form
          className="space-y-4 md:space-y-5"
          onSubmit={handleLogin}
          noValidate
        >
          {/* Email */}
          <div>
            <label className="block mb-1.5 text-[14px] md:text-[16px]">
              Email
            </label>
            <input
              type="email"
              className={`w-full border border-[#E5E5E5] rounded-[4px] h-[40px] md:h-[44px] px-4 text-[14px] md:text-[15px] focus:outline-none focus:ring-1 focus:ring-[#E5E5E5] ${
                errors.email ? "border-red-500" : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-500 text-[11px] md:text-[12px] mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1.5 text-[14px] md:text-[16px]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full border border-[#E5E5E5] rounded-[4px] h-[40px] md:h-[44px] px-4 pr-12 text-[14px] md:text-[15px] focus:outline-none focus:ring-1 focus:ring-[#E5E5E5] ${
                  errors.password ? "border-red-500" : ""
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showPassword ? (
                  <AiOutlineEye size={18} />
                ) : (
                  <AiOutlineEyeInvisible size={18} />
                )}
              </span>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[11px] md:text-[12px] mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex flex-col gap-4">
            <Link
              href="/auth/forgot-password"
              className="text-[#006AD3] text-[12px] md:text-[13px] hover:underline w-fit"
            >
              Forgot password?
            </Link>

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                className="w-4 h-4 border border-[#E5E5E5]"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span className="text-[12px] md:text-[13px]">
                Keep me logged in
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className=" bg-[#043F79] hover:bg-[#032f5a] text-white py-[10px] px-[30px] rounded-md text-[15px] md:text-[16px] font-medium transition-all disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>
      </div>

      {/* Register */}
      <div className="mt-8 text-center px-4">
        <p className="text-[14px] md:text-[15px]">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="font-bold border-b-[2px] border-black pb-0.5 ml-1 inline-block"
          >
            Register Now
          </Link>
        </p>
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

export default Login;
