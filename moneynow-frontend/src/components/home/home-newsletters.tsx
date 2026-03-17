"use client";

import React, { useState } from "react";
import { useApiPost } from "@/hooks/useApiPost";

const StayConnected = () => {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Note: We are relying on the 'error' and 'success' returned from the hook 
  // which should capture backend validation messages.
  const { postData, loading, error, success } = useApiPost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await postData("/api/newsletter", {
      email: email.trim().toLowerCase(),
      is_terms_accepted: agreed,
    });

    // Reset only if the backend returns success
    if (response?.success) {
      setEmail("");
      setAgreed(false);
    }
  };

  return (
    <section className="w-full mb-[40px] bg-white font-poppins">
      <div className="max-w-7xl px-6 mx-auto">
        
        <h2 className="text-center font-semibold text-[28px] sm:text-[36px] lg:text-[40px] mb-[40px]">
          Stay Informed, Stay Smarter.
        </h2>

        <div 
          className="relative w-full rounded-[14px] overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url('/images/newsletter-bg.png')` }}
        >
          <div className="bg-black/10 w-full h-full py-14 px-8 md:px-12 grid grid-cols-1 lg:grid-cols-12 items-center gap-1 lg:gap-10">
            
            {/* LEFT CONTENT */}
            <div className="text-white lg:col-span-7">
              <h3 className="text-[28px] md:text-[32px] font-bold mb-4 leading-tight">
                Join Our Growing Investor Community
              </h3>
              <p className="text-[16px] leading-[26px] mb-4 max-w-lg">
                Get practical insights, market updates, investment ideas and research highlights delivered to your inbox.
              </p>
              <p className="font-semibold text-[16px]">
                Trusted by investors across India.
              </p>
            </div>

            {/* RIGHT FORM */}
            <div className="w-full lg:col-span-5 mt-[20px] lg:mt-0 flex flex-col items-start lg:items-end">
              
              <div className="w-full lg:max-w-[450px]">
                {/* noValidate prevents the browser popup bubble */}
                <form 
                  onSubmit={handleSubmit}
                  noValidate 
                  className="flex flex-col sm:flex-row w-full gap-3 items-stretch"
                >
                  <input
                    type="text"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full sm:flex-1 h-[52px] border-2 rounded-[4px] px-4 text-white placeholder-white focus:outline-none transition bg-transparent ${
                      error ? "border-red-500" : "border-white focus:border-white"
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-fit h-[52px] bg-white text-[#043F79] font-medium px-10 rounded-[4px] hover:bg-gray-100 transition whitespace-nowrap flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? "..." : "Join"}
                  </button>
                </form>

                {/* Checkbox Section */}
                <div className="flex items-start gap-3 mt-4 w-full">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1.5 h-4 w-4 rounded border-gray-300 text-[#043F79] focus:ring-[#043F79] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-white text-[15px] leading-[26px] font-normal cursor-pointer select-none">
                    By signing up you agree to our Terms and Conditions
                  </label>
                </div>

                {/* Unified Backend Error Messages */}
                <div className="w-full">
                  {error && (
                    <p className="text-red-400 text-xs mt-2">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-green-400 text-xs mt-2">
                      Welcome to the community!
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default StayConnected;