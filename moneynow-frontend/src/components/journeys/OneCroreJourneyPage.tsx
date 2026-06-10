"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import ComparisonBarChart from "@/components/all charts/ComparisonBarChart";
import DonutChart from "@/components/all charts/DonutChart";
import StartSipChartBlock from "@/components/start-sip/charts-sub-components/StartSipChartBlock";
import { CalculatorTab, useCalculator } from "@/hooks/useCalculator";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";
import { useFetchCards } from "@/hooks/useHomeBlog";

type OneCroreFormState = {
  wealth_amount: number;
  user_sip_capacity: number;
  years: number;
  expected_return: number;
  inflation_rate: number;
};

type LeadState = {
  name: string;
  email: string;
  wants_callback: boolean;
};

type LeadErrors = {
  name?: string;
  email?: string;
  mobile?: string;
  submit?: string;
};

const DEFAULTS: OneCroreFormState = {
  wealth_amount: 10000000,
  user_sip_capacity: 15000,
  years: 20,
  expected_return: 11,
  inflation_rate: 5,
};

const RETURN_PRESETS = [
  { label: "Conservative", value: 8 },
  { label: "Balanced", value: 11 },
  { label: "Growth-Oriented", value: 13 },
] as const;

const TOOL_LINKS = [
  {
    title: "Plan another goal",
    copy: "Estimate how much SIP you may need for a different goal amount, time frame, or return assumption.",
    href: "/free-calculators",
    cta: "Open goal calculator",
    icon: "target",
  },
  {
    title: "See what a lumpsum could do",
    copy: "Check how a one-time investment today could grow alongside your SIPs over the years.",
    href: "/free-calculators",
    cta: "Open lumpsum calculator",
    icon: "chart",
  },
  {
    title: "Understand inflation on your goals",
    copy: "See how inflation changes the real value of your future goals and why starting early matters.",
    href: "/free-calculators",
    cta: "Open inflation calculator",
    icon: "trend",
  },
] as const;

const inputClassName =
  "mt-3 h-[54px] w-full rounded-[10px] border border-[#D8D8D8] bg-white px-4 text-[16px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";

const leadInputClassName =
  "mt-2 h-[52px] w-full rounded-[6px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111111] outline-none transition placeholder:text-[#7A7A7A] focus:border-[#7FAFE5] focus:ring-0";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const ONE_CRORE_RECAPTCHA_ACTION = "one_crore_journey_submit";

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const calculateCorpusAtYear = (
  sipAmount: number,
  annualReturn: number,
  year: number,
) => {
  const monthlyRate = annualReturn / 12 / 100;
  const months = year * 12;

  if (!monthlyRate) return sipAmount * months;

  return (
    sipAmount *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate)
  );
};

function ToolGlyph({ icon }: { icon: (typeof TOOL_LINKS)[number]["icon"] }) {
  if (icon === "target") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M21 12h-3M12 19v3M6 12H3M17 7l3-3" />
      </svg>
    );
  }

  if (icon === "chart") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15l3-3 3 2 5-6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19h16M6 16l4-4 3 2 5-6" />
      <path d="M17 8h3v3" />
    </svg>
  );
}

function JourneyField({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix = "",
  prefix = "",
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#EAEAEA] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] md:p-5">
      <label className="block text-[16px] font-medium text-[#1A1A1A]">
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClassName}
      />
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-[#0B4B88]"
      />
      <div className="mt-2 flex items-center justify-between text-[12px] text-slate-700">
        <span>
          {prefix}
          {Number(min).toLocaleString("en-IN")}
          {suffix}
        </span>
        <span>
          {prefix}
          {Number(max).toLocaleString("en-IN")}
          {suffix}
        </span>
      </div>
      <p className="mt-3 text-[14px] leading-7 text-[#2D2D2D]">{hint}</p>
    </div>
  );
}

export default function OneCroreJourneyPage() {
  const {
    phoneRef,
    getMobileValue,
    getCountryCode,
    clearPhoneValue,
    validateMobileNumber,
  } = useIntlPhoneField();
  const [form, setForm] = useState<OneCroreFormState>(DEFAULTS);
  const [lead, setLead] = useState<LeadState>({
    name: "",
    email: "",
    wants_callback: false,
  });
  const [leadErrors, setLeadErrors] = useState<LeadErrors>({});
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { calculate, result, loading, error } = useCalculator();
  const {
    cards: blogCards,
    loading: blogLoading,
    error: blogError,
  } = useFetchCards("/api/article/published/latest");

  const typedResult = result as {
    target_wealth?: number;
    sip_amount?: number;
    invested_amount?: number;
    growth_amount?: number;
  } | null;

  const metricItems = useMemo(() => {
    if (!typedResult) {
      return [
        { label: "Target amount", value: formatCurrency(form.wealth_amount) },
        {
          label: "Monthly comfort",
          value: formatCurrency(form.user_sip_capacity),
        },
        { label: "Time horizon", value: `${form.years} years` },
        { label: "Expected return", value: `${form.expected_return}%` },
      ];
    }

    return [
      {
        label: "Required SIP",
        value: formatCurrency(typedResult.sip_amount),
      },
      {
        label: "Total invested",
        value: formatCurrency(typedResult.invested_amount),
      },
      {
        label: "Potential growth",
        value: formatCurrency(typedResult.growth_amount),
      },
      {
        label: "Target wealth",
        value: formatCurrency(typedResult.target_wealth || form.wealth_amount),
      },
    ];
  }, [
    form.expected_return,
    form.user_sip_capacity,
    form.wealth_amount,
    form.years,
    typedResult,
  ]);

  const comparisonData = useMemo(() => {
    const sipAmount = Number(typedResult?.sip_amount || 0);
    if (!sipAmount) return [];

    return Array.from({ length: form.years }, (_, index) => {
      const year = index + 1;
      const target = Math.round((form.wealth_amount / form.years) * year);
      const savings = Math.round(
        calculateCorpusAtYear(sipAmount, form.expected_return, year),
      );

      return {
        label: `Y${year}`,
        target,
        savings,
      };
    });
  }, [
    form.expected_return,
    form.wealth_amount,
    form.years,
    typedResult?.sip_amount,
  ]);

  const allocationData = useMemo(() => {
    if (!typedResult) return [];

    return [
      {
        label: "Invested amount",
        value: Number(typedResult.invested_amount || 0),
        color: "#2563EB",
      },
      {
        label: "Potential growth",
        value: Number(typedResult.growth_amount || 0),
        color: "#34A853",
      },
    ];
  }, [typedResult]);

  const summarySentence = useMemo(() => {
    if (!typedResult?.sip_amount) return null;

    return `At an assumed return of ${form.expected_return}% over ${form.years} years, you may need to invest about ${formatCurrency(
      typedResult.sip_amount,
    )} per month to work towards your goal of ${formatCurrency(
      form.wealth_amount,
    )}.`;
  }, [
    form.expected_return,
    form.wealth_amount,
    form.years,
    typedResult?.sip_amount,
  ]);

  const detailSentence = useMemo(() => {
    if (!typedResult?.invested_amount) return null;

    return `Total invested over this period: ${formatCurrency(
      typedResult.invested_amount,
    )}. Potential growth over your invested amount: ${formatCurrency(
      typedResult.growth_amount,
    )}, giving a projected future value of around ${formatCurrency(
      typedResult.target_wealth,
    )}.`;
  }, [
    typedResult?.growth_amount,
    typedResult?.invested_amount,
    typedResult?.target_wealth,
  ]);

  const handleCalculate = async () => {
    setLeadSubmitted(false);
    setLeadErrors({});
    await calculate("Target Amount SIP Calculator" as CalculatorTab, {
      wealth_amount: form.wealth_amount,
      inflation_rate: form.inflation_rate,
      expected_return: form.expected_return,
      years: form.years,
      period: form.years,
    });
  };

  useRecaptchaLifecycle();

  const validateLead = () => {
    const nextErrors: LeadErrors = {};

    if (!typedResult?.sip_amount) {
      nextErrors.submit =
        "Please calculate your SIP journey first so we can save the result with your enquiry.";
    }

    if (!lead.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!lead.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) {
      nextErrors.email = "Please enter a valid email";
    }

    const mobileError = validateMobileNumber();
    if (mobileError) {
      nextErrors.mobile = mobileError;
    }

    setLeadErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateLead() || !typedResult?.sip_amount) {
      return;
    }

    setSubmitLoading(true);
    setLeadErrors({});

    try {
      const recaptchaToken = await executeRecaptcha(ONE_CRORE_RECAPTCHA_ACTION);
      const mobile = getMobileValue();
      const countryCode = getCountryCode();

      const payload = {
        full_name: lead.name.trim(),
        email: lead.email.trim(),
        mobile,
        country_code: countryCode,
        wants_callback: lead.wants_callback,
        wealth_amount: form.wealth_amount,
        user_sip_capacity: form.user_sip_capacity,
        years: form.years,
        expected_return: form.expected_return,
        inflation_rate: form.inflation_rate,
        required_sip: Number(typedResult.sip_amount || 0),
        invested_amount: Number(typedResult.invested_amount || 0),
        growth_amount: Number(typedResult.growth_amount || 0),
        target_wealth: Number(
          typedResult.target_wealth || form.wealth_amount || 0,
        ),
        recaptcha_token: recaptchaToken,
      };

      const response = await fetch(
        `${API_BASE}/api/one-crore-journey-enquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const responseJson = await response.json().catch(() => null);

      if (!response.ok || responseJson?.success === false) {
        throw new Error(responseJson?.message || "Submission failed");
      }

      setLead({
        name: "",
        email: "",
        wants_callback: false,
      });
      clearPhoneValue();
      setLeadSubmitted(true);
    } catch (submitError) {
      setLeadErrors({
        submit:
          submitError instanceof Error &&
          submitError.message.includes("RECAPTCHA_SITE_KEY")
            ? "Captcha is not configured. Please contact support."
            : submitError instanceof Error && submitError.message
              ? submitError.message
              : "Failed to submit. Please try again.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-white font-poppins text-[#111111]">
      <section className="px-3 pt-4 md:px-6 md:pt-6">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[16px] bg-[#0F5F69] text-white shadow-[0_18px_40px_rgba(5,37,66,0.16)]">
          <div className="relative grid items-center gap-8 px-8 py-8 md:px-10 md:py-10 lg:grid-cols-[1fr_1.2fr] lg:px-12 xl:min-h-[300px]">
            <div className="relative z-10 max-w-[640px]">
              <h1 className="text-[34px] font-semibold leading-[1.18] tracking-[-0.03em] md:text-[48px]">
                See how your SIP can grow towards &#8377;1 Crore and beyond
              </h1>
              <p className="mt-4 max-w-[560px] text-[17px] leading-[1.7] text-white/90 md:text-[19px]">
                Start with an amount you&apos;re comfortable investing each
                month and see how disciplined SIPs can grow over time towards
                your milestone without chasing the markets.
              </p>
            </div>

            <div className="absolute inset-0">
              <Image
                src="/images/one-cr-journey.png"
                alt="One crore journey hero"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,36,41,0.80)_0%,rgba(8,36,41,0.58)_32%,rgba(8,36,41,0.20)_64%,rgba(8,36,41,0.03)_100%)]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-4 py-10 md:px-6 md:py-12">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[18px] border border-[#E7E7E7] bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.08)] md:p-7">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111] md:text-[30px]">
              Tell us what you&apos;re aiming for
            </h2>

            <div className="mt-6 space-y-5">
              <JourneyField
                label="What amount are you aiming for?"
                hint="You can adjust this to any goal amount - your first Rs 50L, Rs 1 Crore, Rs 2 Crore or more."
                value={form.wealth_amount}
                min={2500000}
                max={100000000}
                step={50000}
                prefix="Rs "
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, wealth_amount: value }))
                }
              />

              <JourneyField
                label="How much can you invest every month?"
                hint="Pick an amount that feels realistic and comfortable for you."
                value={form.user_sip_capacity}
                min={2000}
                max={100000}
                step={500}
                prefix="Rs "
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, user_sip_capacity: value }))
                }
              />

              <JourneyField
                label="For how many years can you stay invested?"
                hint="Longer periods usually mean more time for compounding to work."
                value={form.years}
                min={10}
                max={30}
                step={1}
                suffix=" years"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, years: value }))
                }
              />

              <div className="rounded-[18px] border border-[#EAEAEA] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] md:p-5">
                <label className="block text-[16px] font-medium text-[#1A1A1A]">
                  What long-term return do you want to assume?
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  {RETURN_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          expected_return: preset.value,
                        }))
                      }
                      className={`rounded-[8px] border px-4 py-2.5 text-[14px] font-medium transition ${
                        form.expected_return === preset.value
                          ? "border-[#0B4B88] bg-[#0B4B88] text-white shadow-[0_8px_18px_rgba(11,75,136,0.22)]"
                          : "border-[#D7DFEA] bg-white text-[#0B4B88] hover:border-[#AFC3DB] hover:bg-[#F6F9FD]"
                      }`}
                    >
                      {preset.label} (@{preset.value}%)
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  value={form.expected_return}
                  min={6}
                  max={15}
                  step={0.5}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      expected_return: Number(event.target.value),
                    }))
                  }
                  className="mt-5 h-2 w-full cursor-pointer accent-[#0B4B88]"
                />
                <div className="mt-3 flex items-center justify-between text-[13px] text-[#1F2937]">
                  <span>6%</span>
                  <span className="text-[14px] font-semibold text-[#0B4B88]">
                    {form.expected_return}%
                  </span>
                  <span>15%</span>
                </div>
                <p className="mt-4 text-[14px] leading-7 text-[#2D2D2D]">
                  These percentages are long-term return assumptions for
                  illustration, based broadly on historical market data - not
                  predictions or guarantees.
                </p>
              </div>

              <JourneyField
                label="Inflation assumption (per year)"
                hint="Pick an amount that feels realistic and comfortable for you."
                value={form.inflation_rate}
                min={3}
                max={7}
                step={0.5}
                suffix="%"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, inflation_rate: value }))
                }
              />

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={loading}
                  className="rounded-[6px] bg-[#0E4A89] px-8 py-4 text-[16px] font-medium text-white transition hover:bg-[#0A3C6F] disabled:opacity-60"
                >
                  {loading ? "Calculating..." : "Calculate My SIP Journey"}
                </button>
              </div>

              {error ? (
                <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </section>

          <div className="space-y-8">
            <section className="rounded-[18px] border border-[#E7E7E7] bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.08)] md:p-6">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[24px]">
                Your SIP journey, in simple numbers
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-[#222222] md:text-[16px]">
                Enter your assumptions and calculate the journey to see the
                required SIP, invested amount, growth, and future value.
              </p>

              {typedResult?.sip_amount ? (
                <div className="mt-6">
                  <p className="text-[18px] leading-8 text-slate-800">
                    {summarySentence}
                  </p>
                  <p className="mt-4 text-[15px] leading-7 text-slate-600">
                    {detailSentence}
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {metricItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[14px] border border-[#E7E7E7] bg-[#FAFBFD] p-4"
                      >
                        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6B7280]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-[22px] font-semibold text-[#111111]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[15px] leading-7 text-slate-600">
                    Enter your assumptions and calculate the journey to see the
                    required SIP, total invested amount, growth, and future
                    value.
                  </p>
                </div>
              )}
            </section>

            {typedResult?.sip_amount && comparisonData.length > 0 ? (
              <section className="rounded-[18px] border border-[#E7E7E7] bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.08)] md:p-6">
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#0E4A89]">
                    Growth view
                  </p>
                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#111111]">
                    How the journey may build over time
                  </h2>
                </div>

                <div className="mt-6 rounded-[16px] border border-[#E6EAF0] bg-[#FBFCFE] p-4 md:p-5">
                  <StartSipChartBlock
                    title="Projected progress vs target"
                    copy="A simple year-by-year view showing the milestone target versus projected accumulation using the required SIP."
                  >
                    <ComparisonBarChart data={comparisonData} height={340} />
                  </StartSipChartBlock>
                </div>

                <div className="mt-6 rounded-[16px] border border-[#E6EAF0] bg-[#FBFCFE] p-4 md:p-5">
                  <StartSipChartBlock
                    title="Invested amount vs growth"
                    copy="A simple breakdown of how much comes from your contribution versus potential growth."
                  >
                    <DonutChart data={allocationData} height={320} />
                  </StartSipChartBlock>
                </div>
              </section>
            ) : null}

            <section className="rounded-[18px] bg-[linear-gradient(135deg,#0E4A89_0%,#072B52_100%)] p-5 text-white shadow-[0_16px_36px_rgba(8,40,80,0.24)] md:p-6">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] md:text-[24px]">
                Want this plan in your inbox?
              </h2>
              <p className="mt-4 max-w-[560px] text-[16px] leading-8 text-white/88">
                We&apos;ll send you a simple summary of your SIP journey and an
                option to talk to a Moneynow executive.
              </p>

              <form
                noValidate
                onSubmit={handleLeadSubmit}
                className="mt-8 space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-[14px] font-medium text-white">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={lead.name}
                      onChange={(event) => {
                        setLead((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }));
                        setLeadErrors((prev) => ({
                          ...prev,
                          name: undefined,
                          submit: undefined,
                        }));
                      }}
                      placeholder="Enter your full name"
                      className={`${leadInputClassName} ${
                        leadErrors.name ? "border-red-500" : ""
                      }`}
                    />
                    {leadErrors.name ? (
                      <p className="mt-2 text-sm text-red-500">
                        {leadErrors.name}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-white">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={lead.email}
                      onChange={(event) => {
                        setLead((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }));
                        setLeadErrors((prev) => ({
                          ...prev,
                          email: undefined,
                          submit: undefined,
                        }));
                      }}
                      type="text"
                      inputMode="email"
                      placeholder="Enter your email"
                      className={`${leadInputClassName} ${
                        leadErrors.email ? "border-red-500" : ""
                      }`}
                    />
                    {leadErrors.email ? (
                      <p className="mt-2 text-sm text-red-500">
                        {leadErrors.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="one-crore-phone-field w-full md:max-w-[calc(50%-0.5rem)]">
                  <label className="block text-[14px] font-medium text-white">
                    Mobile number <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={() =>
                      setLeadErrors((prev) => ({
                        ...prev,
                        mobile: undefined,
                        submit: undefined,
                      }))
                    }
                    onBlur={() => {
                      const mobileError = validateMobileNumber();
                      setLeadErrors((prev) => ({
                        ...prev,
                        mobile: mobileError || undefined,
                      }));
                    }}
                    placeholder="Enter mobile number"
                    className={`${leadInputClassName} !pl-[90px] ${
                      leadErrors.mobile ? "border-red-500" : ""
                    }`}
                  />
                  {leadErrors.mobile ? (
                    <p className="mt-2 text-sm text-red-500">
                      {leadErrors.mobile}
                    </p>
                  ) : null}
                </div>

                <label className="flex items-start gap-3 pt-1 text-[15px] leading-7 text-white/92">
                  <input
                    type="checkbox"
                    checked={lead.wants_callback}
                    onChange={(event) =>
                      setLead((prev) => ({
                        ...prev,
                        wants_callback: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-white/40"
                  />
                  I&apos;d like a Moneynow advisor to walk me through this on a
                  quick call.
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="rounded-[6px] bg-white px-10 py-3 text-[16px] font-medium text-[#0E4A89] transition hover:bg-[#F4F7FB] disabled:opacity-60"
                  >
                    {submitLoading ? "Sending..." : "Send me this plan"}
                  </button>
                </div>

                {leadSubmitted ? (
                  <div className="rounded-[8px] border border-[#C8E6D4] bg-[#F2FBF6] px-4 py-3 text-sm text-[#17663A]">
                    Your SIP journey summary is on its way to your email. You
                    can now book a discovery call or explore other journeys.
                  </div>
                ) : null}
                {leadErrors.submit ? (
                  <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {leadErrors.submit}
                  </div>
                ) : null}
              </form>
            </section>
          </div>
        </div>
      </section>

      <section className="border-t border-b border-[#F0F0F0] bg-[radial-gradient(circle_at_center,rgba(27,85,187,0.10),transparent_62%)] py-14">
        <div className="mx-auto max-w-[1380px] px-4 md:px-6">
          <div className="mx-auto max-w-[820px] text-center">
            <h2 className="text-[40px] font-semibold tracking-[-0.03em] text-[#111111]">
              More Tools To Explore
            </h2>
            <p className="mt-4 text-[18px] leading-8 text-[#222222]">
              Use these simple tools to look at your money from a few different
              angles
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {TOOL_LINKS.map((card) => (
              <div
                key={card.title}
                className="rounded-[18px] border border-[#E6E6E6] bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.10)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#E8EEF6] text-[#0E4A89]">
                  <ToolGlyph icon={card.icon} />
                </div>
                <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em] text-[#111111]">
                  {card.title}
                </h3>
                <p className="mt-4 text-[16px] leading-8 text-[#2D2D2D]">
                  {card.copy}
                </p>
                <Link
                  href={card.href}
                  className="mt-7 inline-flex items-center gap-3 rounded-[6px] bg-[#0E4A89] px-5 py-3 text-[16px] font-medium text-white transition hover:bg-[#0A3C6F]"
                >
                  {card.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-4 py-16 md:px-6">
        <div className="mx-auto max-w-[920px] text-center">
          <h2 className="text-[34px] font-semibold tracking-[-0.03em] text-[#111111] md:text-[40px]">
            Learn More About Long-Term Investing
          </h2>
        </div>

        {blogLoading ? (
          <p className="mt-12 text-center text-[16px] text-slate-600">
            Loading articles...
          </p>
        ) : blogError ? (
          <p className="mt-12 text-center text-[16px] text-red-500">
            Something went wrong. Please try again.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {blogCards.slice(0, 3).map((article) => (
              <article
                key={article.slug}
                className="overflow-hidden rounded-[18px] border border-[#E6E6E6] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]"
              >
                <div className="relative aspect-[1.6/1]">
                  <Image
                    src={article.imageSrc}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#111111]">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-8 text-[#2D2D2D]">
                    {article.description || article.category}
                  </p>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="mt-7 inline-flex items-center gap-3 text-[16px] font-medium text-[#111111]"
                  >
                    Read Article
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1380px] px-4 pb-12 text-center md:px-6">
        <p className="mx-auto max-w-[1260px] text-[16px] leading-[2] text-[#111111]">
          The calculations shown above are for illustration and educational
          purposes only and are based on the assumptions you have selected. They
          do not represent actual returns or guarantees of any kind. Mutual fund
          investments are subject to market risks. Please read all
          scheme-related documents carefully before investing.
        </p>
      </section>
    </div>
  );
}
