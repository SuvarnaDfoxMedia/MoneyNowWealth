"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import StackedBarLineChart from "@/components/all charts/StackedBarLineChart";
import StartSipReportDownload from "@/components/start-sip/charts-sub-components/StartSipReportDownload";
import StartSipChartBlock from "@/components/start-sip/charts-sub-components/StartSipChartBlock";
import { CalculatorTab, useCalculator } from "@/hooks/useCalculator";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";
import { useFetchCards } from "@/hooks/useHomeBlog";
import {
  buildStartSipChartData,
  START_SIP_DEFAULT_VALUES,
} from "@/stores/startSipStore";

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
  user_sip_capacity: 20000,
  years: 20,
  expected_return: 11,
  inflation_rate: 0,
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
  "mt-3 h-[54px] w-full rounded-[6px] border border-[#E2E8F0] bg-white px-4 text-[15px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";

const leadInputClassName =
  "mt-2 h-[52px] w-full rounded-[6px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111111] outline-none transition placeholder:text-[#7A7A7A] focus:border-[#7FAFE5] focus:ring-0";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const ONE_CRORE_RECAPTCHA_ACTION = "one_crore_journey_submit";

const CALCULATOR_DISCLAIMER = [
  "We have gathered all the data, information, statistics from the sources believed to be highly reliable and true. All necessary precautions have been taken to avoid any error, lapse or insufficiency; however, no representations or warranties are made (express or implied) as to the reliability, accuracy or completeness of such information. We cannot be held liable for any loss arising directly or indirectly from the use of, or any action taken in on, any information appearing herein. The user is advised to verify the contents of the report independently. It is not an investment recommendation or personal financial, investment or professional advice and should not be treated as such.",
  "The Risk Level of any of the schemes must always be commensurate with the risk profile, investment objective or financial goals of the investor concerned. Therefore, the Investors should assess their risk profile before making any investment decision and consider the asset allocation accordingly.",
  "Returns less than 1 year are in absolute (%) and greater than 1 year are compounded annualised (CAGR %). SIP returns are shown in XIRR (%).",
  "Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance may or may not be sustained.",
] as const;

const LANDING_DEFAULT_RESULT = {
  sip_amount: 12261,
  invested_amount: 2942640,
  growth_amount: 7057360,
  target_wealth: 10000000,
} as const;

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

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
    <div className="rounded-[8px] border border-[#E7EDF3] bg-[#FAFCFE] p-4">
      <label className="block text-[13px] font-medium text-[#111111]">
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
      <div className="mt-3 px-1">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-[#0B4B88]"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B7280]">
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
      <p className="mt-3 text-[12px] leading-5 text-[#6B7280]">{hint}</p>
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
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);
  const barChartRef = useRef<HTMLDivElement | null>(null);
  const pieChartRef = useRef<HTMLDivElement | null>(null);

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

  const fallbackResult = useMemo(
    () => ({
      ...LANDING_DEFAULT_RESULT,
    }),
    [],
  );

  const activeResult =
    hasCalculated ? typedResult || fallbackResult : fallbackResult;

  const metricItems = useMemo(
    () => [
      {
        label: "Monthly SIP Investment Required",
        value: formatCurrency(activeResult?.sip_amount),
      },
      {
        label: "Total Amount invested through SIP",
        value: formatCurrency(activeResult?.invested_amount),
      },
      {
        label: "Potential Total Growth amount",
        value: formatCurrency(activeResult?.growth_amount),
      },
      {
        label: "Your Target Amount (Inflation Adjusted)",
        value: formatCurrency(activeResult?.target_wealth || form.wealth_amount),
      },
    ],
    [activeResult, form.wealth_amount],
  );

  const chartData = useMemo(
    () =>
      buildStartSipChartData(
        "sip-starter",
        {
          ...START_SIP_DEFAULT_VALUES,
          years: form.years,
          sip_amount: Number(activeResult?.sip_amount || form.user_sip_capacity),
          wealth_amount: form.wealth_amount,
          expected_return: form.expected_return,
          inflation_rate: form.inflation_rate,
        },
        activeResult,
      ),
    [
      form.expected_return,
      form.inflation_rate,
      form.user_sip_capacity,
      form.wealth_amount,
      form.years,
      activeResult,
    ],
  );

  const oneCroreChartData = useMemo(() => {
    if (chartData?.type !== "sip") return [];

    return chartData.barData.map((item, index) => ({
      ...item,
      year: index + 1,
      label: `${index + 1}`,
    }));
  }, [chartData]);

  const allocationData = useMemo(() => {
    if (!activeResult) return [];

    const investedAmount = Number(activeResult.invested_amount || 0);
    const growthAmount = Number(activeResult.growth_amount || 0);
    const total = investedAmount + growthAmount;

    return [
      {
        label: "Invested amount",
        value: investedAmount,
        share: total ? Number(((investedAmount / total) * 100).toFixed(1)) : 0,
        color: "#2F6EF2",
      },
      {
        label: "Growth",
        value: growthAmount,
        share: total ? Number(((growthAmount / total) * 100).toFixed(1)) : 0,
        color: "#56B95B",
      },
    ];
  }, [activeResult]);

  const summarySentence = useMemo(() => {
    if (!activeResult?.sip_amount) return null;

    return `At an assumed return of ${form.expected_return}% over ${form.years} years, you may need to invest about ${formatCurrency(
      activeResult.sip_amount,
    )} per month to work towards your goal of ${formatCurrency(
      form.wealth_amount,
    )}.`;
  }, [
    activeResult?.sip_amount,
    form.expected_return,
    form.wealth_amount,
    form.years,
  ]);

  const detailSentence = useMemo(() => {
    if (!activeResult?.invested_amount) return null;

    return `Total invested over this period: ${formatCurrency(
      activeResult.invested_amount,
    )}. Potential growth over your invested amount: ${formatCurrency(
      activeResult.growth_amount,
    )}, giving a projected future value of around ${formatCurrency(
      activeResult.target_wealth,
    )}.`;
  }, [
    activeResult?.growth_amount,
    activeResult?.invested_amount,
    activeResult?.target_wealth,
  ]);

  const runCalculation = async () => {
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

  const handleCalculate = async () => {
    setHasCalculated(true);
    setShowFullDisclaimer(false);
    await runCalculation();
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
    <div className="bg-[#F6F7F9] font-poppins text-[#111111]">
      <section className="mx-auto max-w-[1380px] px-4 pt-6 md:px-6">
        <div className="relative overflow-hidden rounded-[8px] bg-[#17384A] shadow-[0_14px_28px_rgba(13,37,55,0.12)]">
          <Image
            src="/images/one-cr-journey.png"
            alt="One crore journey hero"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,56,74,0.90)_0%,rgba(23,56,74,0.78)_36%,rgba(23,56,74,0.32)_70%,rgba(23,56,74,0.08)_100%)]" />
          <div className="relative z-10 max-w-[640px] px-5 py-8 md:px-8 md:py-10">
            <h1 className="text-[34px] font-semibold leading-[1.18] tracking-[-0.03em] text-white md:text-[46px]">
              See how your SIP can grow towards &#8377;1 Crore and beyond
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-white/90 md:text-[16px]">
              Start with an amount you&apos;re comfortable investing each month
              and see how disciplined SIPs can grow over time towards your
              milestone without chasing the markets.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-4 py-6 md:px-6 md:py-8">
        <div className="grid items-start gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[8px] border border-[#E5E9EF] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] md:p-5">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">
              Tell us what you&apos;re aiming for
            </h2>

            <div className="mt-4 space-y-4">
              <JourneyField
                label="What amount are you aiming for?"
                hint="You can adjust this to any goal amount - your first Rs 50L, Rs 1 Crore, Rs 2 Crore or more."
                value={form.wealth_amount}
                min={2500000}
                max={100000000}
                step={50000}
                prefix="Rs. "
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, wealth_amount: value }))
                }
              />

              <JourneyField
                label="How much can you invest every month?"
                hint="Pick an amount that feels realistic and comfortable for you."
                value={form.user_sip_capacity}
                min={2000}
                max={1000000}
                step={500}
                prefix="Rs. "
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
                suffix=" Yrs"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, years: value }))
                }
              />

              <div className="rounded-[8px] border border-[#E7EDF3] bg-[#FAFCFE] p-4">
                <label className="block text-[13px] font-medium text-[#111111]">
                  What rate of return would you expect your SIP investment to
                  generate (% per annum)
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
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
                      className={`rounded-[4px] border px-3 py-2 text-[12px] font-medium transition ${
                        form.expected_return === preset.value
                          ? "border-[#0B4B88] bg-[#0B4B88] text-white"
                          : "border-[#D7DFEA] bg-white text-[#0B4B88] hover:bg-[#F6F9FD]"
                      }`}
                    >
                      {preset.label} (@{preset.value}%)
                    </button>
                  ))}
                </div>
                <div className="mt-3 px-1">
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
                    className="h-2 w-full cursor-pointer accent-[#0B4B88]"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>6%</span>
                  <span className="font-semibold text-[#0B4B88]">
                    {form.expected_return}%
                  </span>
                  <span>15%</span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-[#6B7280]">
                  These percentages are long-term return assumptions for
                  illustration, based broadly on historical market data - not
                  predictions or guarantees.
                </p>
              </div>

              <JourneyField
                label="The expected rate of inflation over the years (% per annum)"
                hint="Use 0 if you want to see the base target amount without inflation adjustment."
                value={form.inflation_rate}
                min={0}
                max={10}
                step={0.5}
                suffix="%"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, inflation_rate: value }))
                }
              />

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={loading}
                  className="rounded-[4px] bg-[#0E4A89] px-6 py-3 text-[13px] font-medium text-white transition hover:bg-[#0A3C6F] disabled:opacity-60"
                >
                  {loading ? "Calculating..." : "Calculate My SIP Journey"}
                </button>
              </div>

              {error ? (
                <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[8px] border border-[#E5E9EF] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">
                    Your SIP journey, in simple numbers
                  </h2>
                  {!hasCalculated ? (
                    <p className="mt-1 text-[12px] leading-5 text-[#6B7280]">
                      Enter your assumptions and calculate the journey to see
                      the required SIP, invested amount, growth, and future
                      value.
                    </p>
                  ) : null}
                </div>
                {hasCalculated && typedResult?.sip_amount ? (
                  <StartSipReportDownload
                    activeTab={"Target Amount SIP Calculator"}
                    result={{
                      target_wealth: typedResult.target_wealth,
                      sip_amount: typedResult.sip_amount,
                      invested_amount: typedResult.invested_amount,
                      growth_amount: typedResult.growth_amount,
                    }}
                    values={{
                      ...START_SIP_DEFAULT_VALUES,
                      wealth_amount: form.wealth_amount,
                      years: form.years,
                      expected_return: form.expected_return,
                      inflation_rate: form.inflation_rate,
                      sip_amount: Number(typedResult.sip_amount || 0),
                      current_age: 0,
                      retirement_age: 0,
                      savings_amount: 0,
                      sip_stepup_value: 0,
                    }}
                    barChartRef={barChartRef}
                    pieChartRef={pieChartRef}
                    chartType="sip"
                    className="rounded-[4px] bg-[#0E4A89] px-4 py-2 text-[12px] font-medium hover:bg-[#0A3C6F]"
                  />
                ) : null}
              </div>

              {hasCalculated && loading ? (
                <div className="mt-6 rounded-[8px] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-slate-500">
                  Calculating your SIP journey...
                </div>
              ) : null}

              {activeResult?.sip_amount ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {metricItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[6px] bg-[linear-gradient(90deg,#001D3A_0%,#043F79_100%)] p-4 text-white shadow-[0_8px_18px_rgba(11,75,136,0.12)]"
                      >
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/80">
                          {item.label}
                        </p>
                        <p className="mt-2 text-[19px] font-semibold leading-tight">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3 text-[13px] leading-6 text-[#2D3748]">
                    <p>{summarySentence}</p>
                    {hasCalculated ? <p>{detailSentence}</p> : null}
                  </div>
                </>
              ) : null}
            </section>

            {hasCalculated &&
            typedResult?.sip_amount &&
            chartData?.type === "sip" &&
            oneCroreChartData.length > 0 ? (
              <section className="rounded-[8px] border border-[#E5E9EF] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] md:p-5">
                <div ref={barChartRef}>
                  <StartSipChartBlock
                    title="Your Target Amount Projection"
                    copy="A simple year-by-year view showing the milestone target versus projected accumulation using the required SIP."
                  >
                    <StackedBarLineChart
                      data={oneCroreChartData}
                      height={380}
                      xAxisDataKey="year"
                      xAxisLabel="No. of years"
                      xAxisTickFormatter={(value) => {
                        const year = Number(value);
                        return year === form.years || year % 2 === 1
                          ? `${year}`
                          : "";
                      }}
                      tooltipLabelFormatter={(label) => `Year ${label}`}
                    />
                  </StartSipChartBlock>
                </div>

                <div ref={pieChartRef} className="mt-5">
                  <StartSipChartBlock
                    title="Invested amount vs growth"
                    copy="A simple breakdown of how much comes from your contribution versus potential growth."
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      {allocationData.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[8px] border border-[#E7E7E7] bg-[#FAFBFD] p-4"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <p className="text-[14px] font-medium text-[#111111]">
                              {item.label}
                            </p>
                          </div>
                          <p className="mt-3 text-[22px] font-semibold text-[#111111]">
                            {formatCurrency(item.value)}
                          </p>
                          <p className="mt-1 text-[13px] text-[#4B5563]">
                            {item.share}% of total projected amount
                          </p>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EEF5]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(item.share, 100)}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </StartSipChartBlock>
                </div>

                <div className="mt-5 rounded-[6px] bg-[#F8FAFD] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[14px] font-semibold text-[#111111]">
                      Disclaimer
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setShowFullDisclaimer((previous) => !previous)
                      }
                      className="text-[12px] font-medium text-[#0E4A89]"
                    >
                      {showFullDisclaimer ? "Read less" : "Read more"}
                    </button>
                  </div>
                  <div className="mt-3 space-y-3 text-[11px] leading-5 text-[#4B5563]">
                    {(showFullDisclaimer
                      ? CALCULATOR_DISCLAIMER
                      : [CALCULATOR_DISCLAIMER[0]]
                    ).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[8px] bg-[linear-gradient(135deg,#0E4A89_0%,#072B52_100%)] p-5 text-white shadow-[0_10px_30px_rgba(8,40,80,0.18)]">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                Want this plan in your inbox?
              </h2>
              <p className="mt-3 max-w-[560px] text-[15px] leading-7 text-white/88">
                We&apos;ll send you a simple summary of your SIP journey and an
                option to talk to a Moneynow executive.
              </p>

              <form
                noValidate
                onSubmit={handleLeadSubmit}
                className="mt-7 space-y-4"
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
    </div>
  );
}
