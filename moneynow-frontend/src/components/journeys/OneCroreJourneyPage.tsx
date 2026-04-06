"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import ComparisonBarChart from "@/components/all charts/ComparisonBarChart";
import DonutChart from "@/components/all charts/DonutChart";
import StartSipChartBlock from "@/components/start-sip/charts-sub-components/StartSipChartBlock";
import StartSipHero from "@/components/start-sip/charts-sub-components/StartSipHero";
import StartSipMetricsGrid from "@/components/start-sip/charts-sub-components/StartSipMetricsGrid";
import StartSipPanel from "@/components/start-sip/charts-sub-components/StartSipPanel";
import { CalculatorTab, useCalculator } from "@/hooks/useCalculator";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";

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
  { label: "Growth-oriented", value: 13 },
];

const TOOL_LINKS = [
  {
    title: "Plan another goal",
    copy: "Estimate how much SIP you may need for a different goal amount, time frame, or return assumption.",
    href: "/free-calculators",
  },
  {
    title: "See what a lumpsum could do",
    copy: "Check how a one-time investment today could grow alongside your SIPs over the years.",
    href: "/free-calculators",
  },
  {
    title: "Understand inflation on your goals",
    copy: "See how inflation changes the real value of your future goals and why starting early matters.",
    href: "/free-calculators",
  },
];

const ARTICLE_LINKS = [
  {
    title: "Why staying invested matters more than timing the market",
    copy: "A short read on how discipline and time can work for your money.",
  },
  {
    title: "How to choose a comfortable SIP amount",
    copy: "Practical ways to decide what you can invest each month without over-stretching yourself.",
  },
  {
    title: "How to choose the right asset allocation",
    copy: "A simple way to think about growth, stability, and fit for your long-term goals.",
  },
];

const inputClassName =
  "mt-3 h-[54px] w-full rounded-[10px] border border-[#D8D8D8] bg-white px-4 text-[16px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";

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
    <div className="rounded-[18px] border border-[#E2E2E2] bg-white p-4">
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
        className="mt-4 h-2 w-full cursor-pointer accent-[#0B3B6E]"
      />
      <div className="mt-2 flex items-center justify-between text-[12px] text-slate-500">
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
      <p className="mt-3 text-[13px] leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

export default function OneCroreJourneyPage() {
  const { phoneRef, getMobileValue, getCountryCode, clearPhoneValue, validateMobileNumber } =
    useIntlPhoneField();
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

  const typedResult = result as {
    target_wealth?: number;
    sip_amount?: number;
    invested_amount?: number;
    growth_amount?: number;
  } | null;

  const heroMetrics = useMemo(
    () => [
      {
        label: "Target amount",
        value: formatCurrency(form.wealth_amount),
      },
      {
        label: "User SIP comfort",
        value: formatCurrency(form.user_sip_capacity),
      },
      {
        label: "Time horizon",
        value: `${form.years} years`,
      },
      {
        label: "Expected return",
        value: `${form.expected_return}%`,
      },
    ],
    [form],
  );

  const metricItems = useMemo(() => {
    if (!typedResult) return heroMetrics;

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
  }, [form.wealth_amount, heroMetrics, typedResult]);

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
    <div className="bg-[#F5F7FB] text-[#111111]">
      <StartSipHero
        title="See how your SIP can grow towards Rs 1 Crore and beyond"
        subtitle="Start with an amount you are comfortable investing each month and see how disciplined SIPs can grow over time towards milestones like Rs 25L, Rs 50L, and Rs 1 Crore, without chasing the markets."
        metrics={heroMetrics}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <StartSipPanel
            eyebrow="Tell us what you are aiming for"
            title="Build your SIP journey"
            subtitle="Start with a few simple assumptions and see what kind of monthly SIP may help you work towards your goal."
          >
            <div className="space-y-5">
              <JourneyField
                label="What amount are you aiming for?"
                hint="You can adjust this to any goal amount - your first Rs 50L, Rs 1 Crore, Rs 2 Crore, or more."
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

              <div className="rounded-[18px] border border-[#E2E2E2] bg-white p-4">
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
                      className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                        form.expected_return === preset.value
                          ? "bg-[#0B3B6E] text-white"
                          : "border border-[#D8D8D8] bg-white text-[#1A1A1A]"
                      }`}
                    >
                      {preset.label} @{preset.value}%
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
                  className="mt-5 h-2 w-full cursor-pointer accent-[#0B3B6E]"
                />
                <div className="mt-3 flex items-center justify-between text-[13px] text-slate-500">
                  <span>6%</span>
                  <span className="font-semibold text-[#0B3B6E]">
                    {form.expected_return}%
                  </span>
                  <span>15%</span>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">
                  These percentages are long-term return assumptions for
                  illustration, based broadly on historical market data - not
                  predictions or guarantees.
                </p>
              </div>

              <JourneyField
                label="Inflation assumption (per year)"
                hint="We use this to estimate the future value of your goal in today's terms."
                value={form.inflation_rate}
                min={3}
                max={7}
                step={0.5}
                suffix="%"
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, inflation_rate: value }))
                }
              />

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={loading}
                  className="rounded-md bg-[#0B3B6E] px-6 py-3 text-[15px] font-medium text-white transition hover:bg-[#082D54] disabled:opacity-60"
                >
                  {loading ? "Calculating..." : "Calculate my SIP journey"}
                </button>
                {/* {typedResult?.sip_amount ? (
                  <p className="text-[14px] text-slate-600">
                    Your comfort SIP:{" "}
                    <span className="font-semibold text-[#0B3B6E]">
                      {formatCurrency(form.user_sip_capacity)}
                    </span>
                  </p>
                ) : null} */}
              </div>

              {error ? (
                <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </StartSipPanel>

          <div className="space-y-8">
            <StartSipPanel
              eyebrow="Your SIP journey, in simple numbers"
              title="Result summary"
              subtitle="A simple summary of what your selected assumptions may mean over time."
            >
              {typedResult?.sip_amount ? (
                <>
                  <p className="text-[18px] leading-8 text-slate-800">
                    {summarySentence}
                  </p>
                  <p className="mt-4 text-[15px] leading-7 text-slate-600">
                    {detailSentence}
                  </p>
                  <div className="mt-6">
                    <StartSipMetricsGrid items={metricItems} />
                  </div>
                </>
              ) : (
                <p className="text-[15px] leading-7 text-slate-600">
                  Enter your assumptions and calculate the journey to see the
                  required SIP, total invested amount, potential growth, and
                  target wealth.
                </p>
              )}
            </StartSipPanel>

            {typedResult?.sip_amount && comparisonData.length > 0 ? (
              <StartSipPanel
                eyebrow="Growth view"
                title="How the journey may build over time"
              >
                <StartSipChartBlock
                  title="Projected progress vs target"
                  copy="A simple year-by-year view showing the milestone target versus projected accumulation using the required SIP."
                >
                  <ComparisonBarChart data={comparisonData} height={360} />
                </StartSipChartBlock>

                <div className="mt-8">
                  <StartSipChartBlock
                    title="Invested amount vs growth"
                    copy="A simple breakdown of how much comes from your contribution versus potential growth."
                  >
                    <DonutChart data={allocationData} height={360} />
                  </StartSipChartBlock>
                </div>
              </StartSipPanel>
            ) : null}

            <StartSipPanel
              eyebrow="Want this plan in your inbox?"
              title="We'll send a simple summary of your SIP journey"
              subtitle="Share your details and we'll send you this plan, along with an option to talk to a MoneyNow executive."
            >
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <input
                      value={lead.name}
                      onChange={(event) =>
                        setLead((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Full name"
                      className={`${inputClassName} ${leadErrors.name ? "border-red-500" : ""}`}
                    />
                    {leadErrors.name ? (
                      <p className="mt-2 text-sm text-red-600">
                        {leadErrors.name}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      value={lead.email}
                      onChange={(event) =>
                        setLead((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="Email"
                      className={`${inputClassName} ${leadErrors.email ? "border-red-500" : ""}`}
                    />
                    {leadErrors.email ? (
                      <p className="mt-2 text-sm text-red-600">
                        {leadErrors.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
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
                      placeholder="Mobile number"
                      className={`${inputClassName} ${leadErrors.mobile ? "border-red-500" : ""}`}
                    />
                    {leadErrors.mobile ? (
                      <p className="mt-2 text-sm text-red-600">
                        {leadErrors.mobile}
                      </p>
                    ) : null}
                  </div>
                </div>
                <label className="flex h-[54px] items-center gap-3 rounded-[10px] border border-[#D8D8D8] bg-white px-4 text-[15px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={lead.wants_callback}
                    onChange={(event) =>
                      setLead((prev) => ({
                        ...prev,
                        wants_callback: event.target.checked,
                      }))
                    }
                  />
                  I&apos;d like a MoneyNow advisor to walk me through this on a
                  quick call
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="rounded-md bg-[#0B3B6E] px-6 py-3 text-[15px] font-medium text-white transition hover:bg-[#082D54] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitLoading ? "Sending..." : "Send me this plan"}
                  </button>
                  <Link
                    href="/contact-us"
                    className="rounded-md border border-[#0B3B6E] px-6 py-3 text-[15px] font-medium text-[#0B3B6E]"
                  >
                    Book a discovery call
                  </Link>
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
            </StartSipPanel>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-10">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <StartSipPanel
            eyebrow="More tools to explore"
            title="Use these simple tools to look at your money from a few different angles."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {TOOL_LINKS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[16px] border border-slate-200 bg-[#FAFAFA] p-5"
                >
                  <h3 className="text-[18px] font-semibold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-7 text-slate-600">
                    {card.copy}
                  </p>
                  <Link
                    href={card.href}
                    className="mt-4 inline-flex text-sm font-medium text-[#0B3B6E]"
                  >
                    Open calculator
                  </Link>
                </div>
              ))}
            </div>
          </StartSipPanel>

          <StartSipPanel
            eyebrow="Learn more about long-term investing"
            title="Related reading"
          >
            <div className="space-y-4">
              {ARTICLE_LINKS.map((article) => (
                <div
                  key={article.title}
                  className="rounded-[16px] border border-slate-200 bg-[#FAFAFA] p-5"
                >
                  <h3 className="text-[18px] font-semibold text-slate-900">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-7 text-slate-600">
                    {article.copy}
                  </p>
                  <Link
                    href="/blog-listing"
                    className="mt-4 inline-flex text-sm font-medium text-[#0B3B6E]"
                  >
                    Read article
                  </Link>
                </div>
              ))}
              <p className="text-[12px] leading-6 text-slate-500">
                The calculations shown above are for illustration and
                educational purposes only and are based on the assumptions
                selected. They do not represent actual returns or guarantees of
                any kind. Mutual fund investments are subject to market risks.
                Please read all scheme-related documents carefully before
                investing.
              </p>
            </div>
          </StartSipPanel>
        </div>
      </section>
    </div>
  );
}
