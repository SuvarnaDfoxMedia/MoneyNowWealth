


"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Login = () => {
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let validationErrors: { email?: string; password?: string } = {};
    if (!email) validationErrors.email = "Email is required.";
    if (!password) validationErrors.password = "Password is required.";
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Login successful");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setErrors(data.errors || { email: data.message });
      }
    } catch (error) {
      console.error(error);
      setErrors({ email: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`
        w-full min-h-[108dvh] flex flex-col justify-center items-center
        font-poppins
        bg-cover bg-center bg-no-repeat
        md:bg-[url('/images/login-bg2.png')]
        bg-white
      `}
    >
      <Toaster position="top-right" reverseOrder={false} />

      {/* Logo */}
      <div className="mb-2 sm:mb-3">
        <Image
          src="/images/moneynow-logo2.png"
          alt="MoneyNow Logo"
          width={150}
          height={46}
          className="h-12 w-auto mx-auto"
          priority
        />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 sm:mx-6 px-4 sm:px-5 py-5">
        <div className="border-b border-gray-300 pb-2 mb-2">
          <h2 className="text-center text-[24px] font-bold">
            Welcome To MONEYNOW
          </h2>
          <p className="text-center text-[13px] mt-1 px-4">
            Already registered? If you have an account with us, please log in.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label className="block mb-1 text-[15px]">
              Email:<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={`w-full border rounded h-[38px] px-3 text-[15px]
                focus:outline-none focus:ring-2 focus:ring-blue-600
                ${errors.email ? "border-red-500" : "border-gray-300"}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-[13px] mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-[15px]">
              Password:<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full border rounded h-[38px] px-3 pr-10 text-[15px]
                  focus:outline-none focus:ring-2 focus:ring-blue-600
                  ${errors.password ? "border-red-500" : "border-gray-300"}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 cursor-pointer text-gray-500"
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

          {/* Remember / Forgot */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-[14px] text-gray-600">
            <Link
              href="/auth/forgot-password"
              className="text-[#FF0000] underline mb-1 sm:mb-0"
            >
              Forgot your Password?
            </Link>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#043F79] hover:bg-[#002b6d] text-white py-[9px] px-6 rounded text-[15px] font-semibold"
          >
            {loading ? "Logging in..." : "Login Now"}
          </button>

          <p className="text-[14px] text-gray-600">
            Not registered yet?{" "}
            <Link
              href="/auth/register"
              className="text-[#355DEF] underline"
            >
              Sign Up Now
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Login;
