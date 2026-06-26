"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import "intl-tel-input/build/css/intlTelInput.css";
import OneCroreJourneyForm from "@/components/journeys/OneCroreJourneyForm";
import OneCroreJourneyLeadForm from "@/components/journeys/OneCroreJourneyLeadForm";
import OneCroreJourneyResult from "@/components/journeys/OneCroreJourneyResult";
import JourneyArticlesSection from "@/components/journeys/JourneyArticlesSection";
import MoreToolsToExplore from "@/components/journeys/MoreToolsToExplore";
import { CalculatorTab, useCalculator } from "@/hooks/useCalculator";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const ONE_CRORE_RECAPTCHA_ACTION = "one_crore_journey_submit";

const LANDING_DEFAULT_RESULT = {
  sip_amount: 12261,
  invested_amount: 2942640,
  growth_amount: 7057360,
  target_wealth: 10000000,
} as const;

const CALCULATOR_DISCLAIMER = [
  "We have gathered all the data, information, statistics from the sources believed to be highly reliable and true. All necessary precautions have been taken to avoid any error, lapse or insufficiency; however, no representations or warranties are made (express or implied) as to the reliability, accuracy or completeness of such information. We cannot be held liable for any loss arising directly or indirectly from the use of, or any action taken in on, any information appearing herein. The user is advised to verify the contents of the report independently. It is not an investment recommendation or personal financial, investment or professional advice and should not be treated as such.",
  "The Risk Level of any of the schemes must always be commensurate with the risk profile, investment objective or financial goals of the investor concerned. Therefore, the Investors should assess their risk profile before making any investment decision and consider the asset allocation accordingly.",
  "Returns less than 1 year are in absolute (%) and greater than 1 year are compounded annualised (CAGR %). SIP returns are shown in XIRR (%).",
  "Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance may or may not be sustained.",
] as const;

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
      year: Number(item.label) || new Date().getFullYear() + index,
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
    <div className="relative font-poppins">
      <section className="mx-auto max-w-full bg-[#F8F8F8] px-4 py-8 md:px-6">
        <div className="relative overflow-hidden rounded-[8px] bg-[#17384A] ">
          <Image
            src="/images/one-cr-journey.png"
            alt="One crore journey hero"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,56,74,0.93)_0%,rgba(23,56,74,0.82)_36%,rgba(23,56,74,0.40)_70%,rgba(23,56,74,0.12)_100%)]" />         <div className="relative z-10 px-5 py-8 md:px-8 md:py-10">
            <h1 className="text-[28px] md:text-[50px] font-semibold leading-tight md:leading-[1.18] tracking-[-0.03em] text-white mb-[15px]">
            Plan your path to ₹1 Crore with clarity
            </h1>
            <p className="text-[15px] md:text-[18px] leading-relaxed md:leading-[28px] max-w-[840px] text-[#ffffff]">
            Start with an amount you’re comfortable investing each month and see how disciplined SIPs can grow over time towards your milestone without chasing the markets.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="grid items-start gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <OneCroreJourneyForm
            form={form}
            loading={loading}
            error={error}
            onCalculate={handleCalculate}
            onFormChange={setForm}
          />

          <div className="space-y-5">
            <OneCroreJourneyResult
              activeResult={activeResult}
              fallbackResult={fallbackResult}
              form={form}
              hasCalculated={hasCalculated}
              loading={loading}
              chartDataType={chartData?.type || ""}
              oneCroreChartData={oneCroreChartData}
              allocationData={allocationData}
              barChartRef={barChartRef}
              pieChartRef={pieChartRef}
            />

            <OneCroreJourneyLeadForm
              lead={lead}
              setLead={setLead}
              leadErrors={leadErrors}
              setLeadErrors={setLeadErrors}
              submitLoading={submitLoading}
              leadSubmitted={leadSubmitted}
              phoneRef={phoneRef}
              onSubmit={handleLeadSubmit}
              onMobileChange={() =>
                setLeadErrors((prev) => ({
                  ...prev,
                  mobile: undefined,
                  submit: undefined,
                }))
              }
              onMobileBlur={() => {
                const mobileError = validateMobileNumber();
                setLeadErrors((prev) => ({
                  ...prev,
                  mobile: mobileError || undefined,
                }));
              }}
            />
          </div>
        </div>

      </section>

      {hasCalculated ? (
        <section className="w-full bg-[#F8FAFD] py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[18px] font-semibold">Disclaimer</h3>
              <button
                type="button"
                onClick={() => setShowFullDisclaimer((previous) => !previous)}
                className="text-[14px] font-medium text-[#0E4A89]"
              >
                {showFullDisclaimer ? "Read less" : "Read more"}
              </button>
            </div>
            <div className="mt-3 space-y-3 text-[16px] leading-[28px]">
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

      <MoreToolsToExplore />

      <JourneyArticlesSection />
    </div>
  );
}
