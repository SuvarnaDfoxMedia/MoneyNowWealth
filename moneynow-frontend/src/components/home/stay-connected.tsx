

"use client";

import Image from "next/image";
import React, { useState } from "react";
import { stayConnectedData } from "@/data/homePageData";
import { useApiPost } from "@/hooks/useApiPost";

const StayConnected = () => {
  const { title, subtitle, description, features } = stayConnectedData;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { postData, loading } = useApiPost<{ name: string; email: string }>();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setNameError("");
    setEmailError("");
    setSuccessMsg("");

    let isValid = true;

    if (!name.trim()) {
      setNameError("Name is required");
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    }

    if (!isValid) return;

    const res = await postData("/api/newsletter", { name, email });

    if (res?.success) {
      setSuccessMsg("Subscribed successfully!");
      setName("");
      setEmail("");
    } else {
      if (res?.errors) {
        setNameError(res.errors.name || "");
        setEmailError(res.errors.email || "");
      } else if (res?.message) {
        if (res.message.toLowerCase().includes("name")) {
          setNameError(res.message);
        } else {
          setEmailError(res.message);
        }
      }
    }
  };

  return (
    <section className="w-full bg-[#053C71] py-[40px] font-inter">
      <div className="container mx-auto px-4 text-center">
        {/* TITLE */}
        <h2 className="text-white font-bold text-[24px] sm:text-[32px] mb-3">
          {title}
        </h2>

        <p className="text-[18px] sm:text-[20px] font-semibold text-white mb-3">
          {subtitle}
        </p>

        <p className="text-white text-[15px] mb-10 mx-auto">
          {description}
        </p>

        {/* ICONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10 gap-4">
          {features.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-white">
              <div className="bg-[#D9D9D9] p-4 rounded-[10px] mb-4">
                <Image src={item.imageSrc} alt={item.text} width={75} height={75} />
              </div>
              <p className="text-[14px]">{item.text}</p>
            </div>
          ))}
        </div>

        {/* FORM */}
<form
  onSubmit={handleSubmit}
  noValidate
  className="bg-white rounded-[12px] flex flex-col lg:flex-row items-end p-7 gap-4 lg:gap-5"
>
  {/* NAME */}
  <div className="flex flex-col w-full lg:w-[470px] ">
    <input
      type="text"
      placeholder="Enter your name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className={`w-full border px-4 py-3 text-[15px] rounded ${
        nameError ? "border-red-500" : "border-[#043F79]"
      }`}
    />
    <span className="text-red-500 text-[13px] h-[18px] leading-[18px]">
      {nameError}
    </span>
  </div>

  {/* EMAIL */}
  <div className="flex flex-col w-full lg:w-[470px] ">
    <input
      type="text"
      placeholder="Enter your email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className={`w-full border px-4 py-3 text-[15px] rounded ${
        emailError ? "border-red-500" : "border-[#043F79]"
      }`}
    />
    <span className="text-red-500 text-[13px] h-[18px] leading-[18px]">
      {emailError}
    </span>
  </div>

  {/* BUTTON */}
  <div className="flex flex-col ">
    <button
      type="submit"
      disabled={loading}
      className="bg-[#043F79] text-white text-[18px] px-[30px] py-3 rounded-[5px] uppercase hover:bg-[#032F59]"
    >
      {loading ? "Submitting..." : "SUBSCRIBE NOW"}
    </button>

    {/* EMPTY SPACE TO MATCH INPUT ERROR HEIGHT */}
    <span className="h-[18px]"></span>
  </div>
</form>


        {/* SUCCESS */}
        {successMsg && <p className="text-green-300 mt-3">{successMsg}</p>}
      </div>
    </section>
  );
};

export default StayConnected;
