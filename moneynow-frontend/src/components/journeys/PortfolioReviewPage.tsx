"use client";

import React, { useState } from "react";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import { Layers, Boxes, PieChart, Target } from "lucide-react";
import { JourneyHero } from "./JourneyHero";
import { AccentSelectCard } from "./AccentSelectCard";
import { ConnectedSteps } from "./ConnectedSteps";
import { CasUploadField } from "./CasUploadField";
import { GoalTestimonial } from "./GoalTestimonial";
import { executeRecaptcha } from "../../lib/recaptcha";
import useRecaptchaLifecycle from "../../hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "../../hooks/useIntlPhoneField";
import axios from "axios";

const PORTFOLIO_REVIEW_RECAPTCHA_ACTION = "portfolio_review_submit";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type MindsetType =
  | "just_getting_started"
  | "investing_not_sure"
  | "second_opinion"
  | "all_over_the_place";

const MINDSET_OPTIONS = [
  {
    id: "just_getting_started",
    title: "Just getting started",
    subLabel: "Some investments but haven't tracked them closely",
  },
  {
    id: "investing_not_sure",
    title: "Investing regularly, not sure it's working",
    subLabel: "SIPs running but want a clearer picture",
  },
  {
    id: "second_opinion",
    title: "Actively investing, want a second opinion",
    subLabel: "Been at this a while, just want fresh eyes",
  },
  {
    id: "all_over_the_place",
    title: "All over the place",
    subLabel: "Multiple platforms, no clear view of the whole",
  },
] as const;

const PAIN_POINTS = [
  {
    title: "Fund overlap",
    body: "Many investors hold 6–8 funds that are 80% identical in holdings. You're paying for diversification you're not actually getting.",
    icon: Layers,
  },
  {
    title: "Too many schemes",
    body: "A portfolio with 12 SIPs running across different platforms isn't diversified — it's scattered. More funds rarely means more safety.",
    icon: Boxes,
  },
  {
    title: "Concentrated asset allocation",
    body: "If one market segment drops and takes most of your portfolio with it, your allocation was never balanced to begin with.",
    icon: PieChart,
  },
  {
    title: "Misaligned to your goals",
    body: "An aggressive equity fund is great — unless you need the money in 3 years. We check whether your investments match your timeline and comfort with risk.",
    icon: Target,
  },
];

export const PortfolioReviewPage = () => {
  const { phoneRef, getMobileValue, getCountryCode, validateMobileNumber } =
    useIntlPhoneField();
  useRecaptchaLifecycle();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mindset: "" as MindsetType | "",
  });

  const [casFile, setCasFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMobileChange = () => {
    if (errors.mobile) {
      setErrors((prev) => ({ ...prev, mobile: "" }));
    }
  };

  const handleMobileBlur = () => {
    const mobileValue = getMobileValue();
    if (!mobileValue) {
      setErrors((prev) => ({ ...prev, mobile: "" }));
      return;
    }
    const mobileError = validateMobileNumber();
    setErrors((prev) => ({ ...prev, mobile: mobileError || "" }));
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      const firstError = document.querySelector(".text-red-500");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email";
    }
    if (!form.mindset) nextErrors.mindset = "Please select an option";

    const mobileError = validateMobileNumber();
    if (mobileError) nextErrors.mobile = mobileError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadCasFile = async (): Promise<{ name: string; url: string } | null> => {
    if (!casFile) return null;

    const formData = new FormData();
    formData.append("cas_file", casFile);

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/upload-cas-statement`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (data.success) {
        return { name: data.filename, url: data.url };
      }
      throw new Error(data.message || "Failed to upload CAS file");
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          "Error uploading CAS file",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      scrollToFirstError();
      return;
    }

    setSubmitLoading(true);
    setErrors({});

    try {
      const recaptcha_token = await executeRecaptcha(
        PORTFOLIO_REVIEW_RECAPTCHA_ACTION,
      );
      if (!recaptcha_token) {
        throw new Error("reCAPTCHA verification failed. Please try again.");
      }

      let casData = null;
      if (casFile) {
        casData = await uploadCasFile();
      }

      await axios.post(`${API_BASE}/api/portfolio-review-enquiries`, {
        full_name: form.name,
        email: form.email,
        mobile: getMobileValue(),
        country_code: getCountryCode(),
        investor_mindset: form.mindset,
        cas_file_name: casData?.name || null,
        cas_file_url: casData?.url || null,
        recaptcha_token,
      });

      setSubmitted(true);
    } catch (err: any) {
      setErrors({
        submit:
          err.response?.data?.message || err.message || "An error occurred.",
      });
      scrollToFirstError();
    } finally {
      setSubmitLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank you, {form.name.split(" ")[0]}.
          </h2>
          <p className="text-gray-600 mb-8">
            Our team will prepare your portfolio review and call you at{" "}
            {getMobileValue()} within 48 hours. This is a prepared conversation
            — not a cold call.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/learn"
              className="w-full py-3 px-4 bg-[#0E4A89] text-white rounded-lg font-medium hover:bg-[#0B3A6E] transition-colors"
            >
              Learn what a good portfolio looks like
            </Link>
            <Link
              href="/"
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 px-4 sm:px-6 lg:px-8 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* HERO SECTION */}
        <JourneyHero
          imageSrc="/images/portfolio-review-hero.jpg"
          imageAlt="Portfolio Review"
          eyebrow="Backed by 23 years of helping families stay invested"
          titlePlain="Is your portfolio really "
          titleAccent="working for you?"
          subtitle="Most investors don't know the answer — and that's not their fault. Share your details and we'll prepare a thorough review before we call. No obligation. No sales pitch. Just clarity."
          trustBadges={[
            "AMFI Registered Distributor",
            "1,000+ families since 2003",
            "Most families stay for 10+ years",
          ]}
        />

        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          {/* LEFT COLUMN: FORM */}
          <div className="rounded-[10px] bg-white border border-[#E2E2E2] p-6 md:p-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Tell us about yourself and your current investments
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your name
                    </label>
                    <input
                      type="text"
                      placeholder="What should we call you?"
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.name
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-[#0E4A89]/20 focus:border-[#0E4A89] outline-none transition-colors`}
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile number
                    </label>
                    <div
                      className={`w-full ${
                        errors.mobile ? "ring-1 ring-red-500 rounded-lg" : ""
                      }`}
                    >
                      <input
                        type="tel"
                        ref={phoneRef}
                        onChange={handleMobileChange}
                        onBlur={handleMobileBlur}
                        className="w-full !px-4 !py-2.5 !pl-[90px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0E4A89]/20 focus:border-[#0E4A89] outline-none"
                      />
                    </div>
                    {errors.mobile && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.mobile}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      Our team will call you on this number once your review is
                      ready
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.email
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-[#0E4A89]/20 focus:border-[#0E4A89] outline-none transition-colors`}
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How would you describe your investing so far?
                  </label>
                  <div className="flex flex-col gap-3">
                    {MINDSET_OPTIONS.map((opt) => (
                      <AccentSelectCard
                        key={opt.id}
                        title={opt.title}
                        subLabel={opt.subLabel}
                        selected={form.mindset === opt.id}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, mindset: opt.id }))
                        }
                      />
                    ))}
                  </div>
                  {errors.mindset && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.mindset}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <CasUploadField
                    label="Share your CAS statement (optional but recommended)"
                    subtext="PDF format • Max 10MB • Your data stays private"
                    file={casFile}
                    onChange={setCasFile}
                  />
                </div>

                {errors.submit && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {errors.submit}
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-3.5 px-4 bg-[#0E4A89] text-white rounded-lg font-medium hover:bg-[#0B3A6E] transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {submitLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Request my portfolio review
                        <span>→</span>
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-xs text-gray-500 text-center font-normal">
                    Our team will prepare your review and call within 48 hours.
                  </p>
                  <p className="mt-4 text-[11px] text-[#8a8a8a] text-center leading-relaxed max-w-lg mx-auto">
                    By submitting this form, you agree to be contacted by
                    MoneyNow Wealth Management LLP. Your CAS statement is used
                    solely to prepare your portfolio review and is kept strictly
                    confidential. Mutual fund investments are subject to market
                    risks. Please read all scheme-related documents carefully
                    before investing. MoneyNow Wealth Management LLP is an AMFI
                    Registered Mutual Fund Distributor (ARN: XXXXX
                    {/* // TODO: replace ARN before go-live */}).
                  </p>
                </div>
              </form>
            </div>

            <GoalTestimonial
              quote="I had SIPs running across three platforms and had no idea if they were working together. MoneyNow reviewed everything, pointed out the overlap, and helped me consolidate. My portfolio finally makes sense."
              authorName="Rajesh K."
              authorMeta="Portfolio consolidated in 2021 · Mumbai"
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[20px] font-semibold text-[#18181B] mb-2">
                What we'll look at in your portfolio
              </h3>
              <p className="text-[14px] text-gray-500 mb-6">
                Four things most investors never check — but should.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PAIN_POINTS.map((point) => (
                  <AccentSelectCard
                    key={point.title}
                    variant="informational"
                    selected={true}
                    icon={point.icon}
                    title={point.title}
                    subLabel={point.body}
                  />
                ))}
              </div>
            </div>

            <ConnectedSteps
              heading="What happens after you submit"
              steps={[
                {
                  number: 1,
                  title: "We prepare your review",
                  body: "Our team analyses your portfolio against your goals, risk, and market benchmarks. This takes us 24–48 hours.",
                },
                {
                  number: 2,
                  title: "We call you — prepared",
                  body: "Not a cold call. A structured conversation where we walk you through exactly what we found.",
                },
                {
                  number: 3,
                  title: "You decide what's next",
                  body: "No pressure to act immediately. The review is yours to keep — whether you invest with us or not.",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
