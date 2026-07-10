"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import { GraduationCap, Sunset, TrendingUp, Lightbulb } from "lucide-react";
import { JourneyHero } from "./JourneyHero";
import { AccentSelectCard } from "./AccentSelectCard";
import { ConnectedSteps } from "./ConnectedSteps";
import { GoalTestimonial } from "./GoalTestimonial";
import { AnimatedNumber } from "./AnimatedNumber";
import { CalculatorTab, useCalculator, CALCULATOR_ROUTE_MAP } from "../../hooks/useCalculator";
import { executeRecaptcha } from "../../lib/recaptcha";
import useRecaptchaLifecycle from "../../hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "../../hooks/useIntlPhoneField";
import axios from "axios";

const START_INVESTING_RECAPTCHA_ACTION = "start_investing_submit";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type GoalType = "childs_future" | "retirement" | "growing_savings" | "not_sure";

const GOAL_OPTIONS = [
  {
    id: "childs_future",
    title: "My child's future",
    subLabel: "Education, marriage, or head start in life",
    icon: GraduationCap,
  },
  {
    id: "retirement",
    title: "My retirement",
    subLabel: "Building a corpus for later years",
    icon: Sunset,
  },
  {
    id: "growing_savings",
    title: "Growing my savings",
    subLabel: "Making idle money work harder",
    icon: TrendingUp,
  },
  {
    id: "not_sure",
    title: "I'm not sure yet",
    subLabel: "Help me figure it out",
    icon: Lightbulb,
  },
] as const;

const TESTIMONIALS: Record<
  GoalType,
  { quote: string; authorName: string; authorMeta: string }
> = {
  childs_future: {
    quote:
      "I started my daughter's education SIP when she was 3. She's 14 now — and the corpus is right on track. The team checks in every year without me having to ask.",
    authorName: "Priya R.",
    authorMeta: "Investor since 2012 · Pune",
  },
  retirement: {
    quote:
      "I was 42 and hadn't seriously thought about retirement. One conversation with the team changed that. Now I have a clear plan and I'm actually on track.",
    authorName: "Suresh K.",
    authorMeta: "Investor since 2017 · Mumbai",
  },
  growing_savings: {
    quote:
      "I started with just ₹2,000 a month. Three years later my portfolio has grown more than I expected. The best part — it just runs on its own.",
    authorName: "Anjali M.",
    authorMeta: "Investor since 2020 · Mumbai",
  },
  not_sure: {
    quote:
      "I had no idea where to start. The team was patient, never made me feel foolish for not knowing. They helped me begin small and build from there.",
    authorName: "Rohit V.",
    authorMeta: "Investor since 2021 · Mumbai",
  },
};

export const StartInvestingPage = () => {
  const { phoneRef, getMobileValue, getCountryCode, validateMobileNumber } =
    useIntlPhoneField();
  useRecaptchaLifecycle();

  const [form, setForm] = useState({
    name: "",
    email: "",
    goal: "" as GoalType | "",
  });

  const [calcInputs, setCalcInputs] = useState<Record<string, any>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    calculate,
    result: calcResult,
    loading: calcLoading,
  } = useCalculator();

  const getCalculatorType = (goal: GoalType): CalculatorTab | null => {
    switch (goal) {
      case "childs_future":
        return "Children Education Planner";
      case "retirement":
        return "Retirement Planning Calculator";
      case "growing_savings":
        return "Target Amount SIP Calculator";
      default:
        return null;
    }
  };

  const getFormattedCalculatorInputs = (goal: GoalType) => {
    if (goal === "childs_future") {
      return {
        children: [
          {
            name: "Child 1",
            currentAge: Number(calcInputs.currentAge ?? 3),
            educationAge: 18,
            educationAmount: Number(calcInputs.educationAmount ?? 1500000),
          },
        ],
        inflation_rate: 6,
        expected_return: 12,
        savings_amount: 0,
      };
    }
    if (goal === "retirement") {
      return {
        current_age: Number(calcInputs.current_age ?? 30),
        retirement_age: 60,
        wealth_amount: Number(calcInputs.wealth_amount ?? 50000000),
        inflation_rate: 6,
        expected_return: 12,
        savings_amount: 0,
      };
    }
    if (goal === "growing_savings") {
      return {
        wealth_amount: Number(calcInputs.wealth_amount ?? 10000000),
        inflation_rate: 6,
        expected_return: 12,
        period: Number(calcInputs.period ?? 15),
      };
    }
    return null;
  };

  const handleGoalSelect = (goalId: GoalType) => {
    setForm((prev) => ({ ...prev, goal: goalId }));
    if (goalId === "childs_future") {
      setCalcInputs({ currentAge: 3, educationAmount: 1500000 });
    } else if (goalId === "retirement") {
      setCalcInputs({ current_age: 30, wealth_amount: 50000000 });
    } else if (goalId === "growing_savings") {
      setCalcInputs({ wealth_amount: 10000000, period: 15 });
    } else {
      setCalcInputs({});
    }
  };

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

  // Debounced Calculator trigger
  useEffect(() => {
    const calcType = getCalculatorType(form.goal as GoalType);
    if (!calcType) return;

    const formattedInputs = getFormattedCalculatorInputs(form.goal as GoalType);
    if (!formattedInputs) return;

    const timer = setTimeout(() => {
      void calculate(calcType, formattedInputs);
    }, 300);

    return () => clearTimeout(timer);
  }, [calcInputs, form.goal, calculate]);

  const getMonthlySip = () => {
    if (!calcResult) return 0;
    if (form.goal === "childs_future") {
      return calcResult.total_monthly_savings || 0;
    }
    if (form.goal === "retirement") {
      return calcResult.monthly_savings || 0;
    }
    if (form.goal === "growing_savings") {
      return calcResult.sip_amount || 0;
    }
    return 0;
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
    if (!form.goal) nextErrors.goal = "Please select a goal";

    const mobileError = validateMobileNumber();
    if (mobileError) nextErrors.mobile = mobileError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
        START_INVESTING_RECAPTCHA_ACTION,
      );
      if (!recaptcha_token) {
        throw new Error("reCAPTCHA verification failed. Please try again.");
      }

      const calcType = getCalculatorType(form.goal as GoalType);
      const backendCalcType = calcType ? CALCULATOR_ROUTE_MAP[calcType] : null;
      const backendCalcInputs = form.goal ? getFormattedCalculatorInputs(form.goal) : null;

      await axios.post(`${API_BASE}/api/start-investing-enquiries`, {
        full_name: form.name,
        email: form.email,
        mobile: getMobileValue(),
        country_code: getCountryCode(),
        goal: form.goal,
        calculator_type: backendCalcType,
        calculator_inputs: backendCalcInputs,
        calculator_result: calcResult,
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
            You're all set.
          </h2>
          <p className="text-gray-600 mb-8">
            Thank you, {form.name.split(" ")[0]}. Someone from our team will
            call you at {getMobileValue()} within 24 hours. We're looking
            forward to the conversation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/learn"
              className="w-full py-3 px-4 bg-[#0E4A89] text-white rounded-lg font-medium hover:bg-[#0B3A6E] transition-colors"
            >
              Learn how SIPs work
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
          imageSrc="/images/start-investing-hero.jpg"
          imageAlt="Start Investing"
          eyebrow="Backed by 23 years of helping families stay invested"
          titlePlain="Let's get "
          titleAccent="you started."
          subtitle="One conversation. That's all it takes to begin. Fill in your details and someone from our team will reach out within 24 hours."
          trustBadges={[
            "AMFI Registered Distributor",
            "1,000+ families since 2003",
            "Most families stay for 10+ years",
          ]}
        />

        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          {/* LEFT COLUMN: FORM */}
          <div className="rounded-[10px] bg-white border border-[#E2E2E2] p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Tell us a little about yourself
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
                      errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
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
                    <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    This is how our team will reach you
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
                    errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
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
                <div className="flex items-center text-center font-semibold text-[11px] text-gray-400 tracking-[0.5px] uppercase mb-4">
                  <div className="flex-grow border-t border-gray-200 mr-3" />
                  One quick question
                  <div className="flex-grow border-t border-gray-200 ml-3" />
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What matters most to you right now?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {GOAL_OPTIONS.map((opt) => (
                    <AccentSelectCard
                      key={opt.id}
                      title={opt.title}
                      subLabel={opt.subLabel}
                      icon={opt.icon}
                      selected={form.goal === opt.id}
                      onClick={() => handleGoalSelect(opt.id as GoalType)}
                    />
                  ))}
                </div>
                {errors.goal && (
                  <p className="mt-2 text-sm text-red-500">{errors.goal}</p>
                )}
              </div>

              {/* Dynamic Goal Testimonial */}
              {form.goal && TESTIMONIALS[form.goal] && (
                <GoalTestimonial
                  quote={TESTIMONIALS[form.goal].quote}
                  authorName={TESTIMONIALS[form.goal].authorName}
                  authorMeta={TESTIMONIALS[form.goal].authorMeta}
                />
              )}

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
                      Start my journey
                      <span className="ml-1">→</span>
                    </>
                  )}
                </button>
                <p className="mt-3 text-xs text-gray-500 text-center font-normal">
                  No spam. No cold calls. Just one conversation.
                </p>
                <p className="mt-4 text-[11px] text-[#8a8a8a] text-center leading-relaxed max-w-lg mx-auto">
                  By submitting this form, you agree to be contacted by MoneyNow
                  Wealth Management LLP. Mutual fund investments are subject to
                  market risks. Please read all scheme-related documents
                  carefully before investing. MoneyNow Wealth Management LLP is
                  an AMFI Registered Mutual Fund Distributor (ARN: XXXXX
                  {/* // TODO: replace ARN before go-live */}). Past performance
                  is not indicative of future returns.
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <ConnectedSteps
              heading="What happens after you submit"
              steps={[
                {
                  number: 1,
                  title: "We call you",
                  body: "A real person from our team — not a bot — calls within 24 hours on the number you've shared.",
                },
                {
                  number: 2,
                  title: "We understand your goals",
                  body: "A short, friendly conversation about what you want to achieve. No pressure. No pitch. Just clarity.",
                },
                {
                  number: 3,
                  title: "We help you get started",
                  body: "We help you stay organised and invested at a pace that works for you.",
                },
              ]}
            />

            {/* Dynamic Goal Calculator Widget */}
            {form.goal && (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                {form.goal === "not_sure" ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Not sure yet? That's OK.
                    </h4>
                    <p className="text-sm text-gray-600">
                      We'll help you figure out the right goal on the call — no
                      calculator needed today.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-[11px] font-bold text-[#0A4A86] uppercase tracking-wide">
                        Goal-linked calculator
                      </span>
                      <h4
                        className="font-semibold text-gray-900 text-base mt-1"
                        id="calcTitle"
                      >
                        {form.goal === "childs_future" &&
                          "Children's education planner"}
                        {form.goal === "retirement" && "Retirement planner"}
                        {form.goal === "growing_savings" &&
                          "SIP growth calculator"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {form.goal === "childs_future" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Child's Current Age (Years)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={17}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4A89]"
                              value={calcInputs.currentAge ?? ""}
                              onChange={(e) =>
                                setCalcInputs((prev) => ({
                                  ...prev,
                                  currentAge: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Target amount
                            </label>
                            <input
                              type="number"
                              min={10000}
                              step={50000}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4A89]"
                              value={calcInputs.educationAmount ?? ""}
                              onChange={(e) =>
                                setCalcInputs((prev) => ({
                                  ...prev,
                                  educationAmount: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                        </>
                      )}

                      {form.goal === "retirement" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Current Age (Years)
                            </label>
                            <input
                              type="number"
                              min={18}
                              max={59}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4A89]"
                              value={calcInputs.current_age ?? ""}
                              onChange={(e) =>
                                setCalcInputs((prev) => ({
                                  ...prev,
                                  current_age: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Target amount
                            </label>
                            <input
                              type="number"
                              min={100000}
                              step={100000}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4A89]"
                              value={calcInputs.wealth_amount ?? ""}
                              onChange={(e) =>
                                setCalcInputs((prev) => ({
                                  ...prev,
                                  wealth_amount: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                        </>
                      )}

                      {form.goal === "growing_savings" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Target amount
                            </label>
                            <input
                              type="number"
                              min={10000}
                              step={50000}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4A89]"
                              value={calcInputs.wealth_amount ?? ""}
                              onChange={(e) =>
                                setCalcInputs((prev) => ({
                                  ...prev,
                                  wealth_amount: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Years to goal
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={40}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4A89]"
                              value={calcInputs.period ?? ""}
                              onChange={(e) =>
                                setCalcInputs((prev) => ({
                                  ...prev,
                                  period: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Gradient result panel */}
                    {calcLoading ? (
                      <div className="rounded-2xl p-6 text-center bg-[#F2F7FC] border border-[#0E4A89]/10 text-gray-500 text-sm">
                        Calculating...
                      </div>
                    ) : (
                      calcResult && (
                        <div className="rounded-2xl p-6 text-center bg-[linear-gradient(135deg,#0E4A89_0%,#072B52_100%)]">
                          <div className="text-[10px] uppercase tracking-wide text-white/70">
                            Monthly SIP required
                          </div>
                          <div className="mt-1 text-3xl font-semibold text-white">
                            <AnimatedNumber
                              value={getMonthlySip()}
                              prefix="₹"
                              className="text-3xl font-semibold text-white"
                            />
                          </div>
                          <p className="mt-4 text-[10px] text-white/70 leading-relaxed font-medium">
                            The best time to start is now. Our team will help
                            you figure out the right amount for your life.
                          </p>
                          <div className="mt-3 text-[10px] text-white/40 leading-relaxed">
                            Assumes 12% p.a. returns. Actual returns vary. Past
                            performance is not indicative of future results.
                          </div>
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
