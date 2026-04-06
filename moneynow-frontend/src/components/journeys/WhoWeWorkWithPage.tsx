"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import StartSipHero from "@/components/start-sip/charts-sub-components/StartSipHero";
import StartSipPanel from "@/components/start-sip/charts-sub-components/StartSipPanel";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";

type Persona = {
  id: string;
  label: string;
  title: string;
  summary: string;
  fit: string[];
  concerns: string[];
  support: string[];
  nextCta: {
    label: string;
    href: string;
  };
};

type LeadState = {
  name: string;
  email: string;
  preference: string;
};

type LeadErrors = {
  name?: string;
  email?: string;
  mobile?: string;
  submit?: string;
};

const PERSONAS: Persona[] = [
  {
    id: "professionals",
    label: "Working professionals",
    title: "Professionals and salaried people building wealth over time",
    summary:
      "This usually fits doctors, lawyers, salaried professionals, and busy working couples who want a structured, goal-linked approach without having to manage everything on their own.",
    fit: [
      "Doctors and healthcare professionals managing long hours and family responsibilities",
      "Lawyers and other professionals balancing demanding schedules and long-term goals",
      "Salaried employees and busy working couples wanting to convert monthly surplus into disciplined investing",
    ],
    concerns: [
      "I know I should be investing, but I do not want to handle everything alone.",
      "I want my investments to be linked to real-life goals and not changed every few months.",
      "I want clarity, discipline, and someone I can speak to when money questions come up.",
    ],
    support: [
      "A structured, goal-based plan using mutual funds and related solutions",
      "Help setting up and maintaining SIPs and lumpsums in line with time-bound goals",
      "Regular reviews so investments evolve with life events and market conditions",
    ],
    nextCta: {
      label: "Start a conversation",
      href: "/contact-us",
    },
  },
  {
    id: "families",
    label: "Families and life stages",
    title: "Families building long-term habits through different life stages",
    summary:
      "This usually fits young families, retirees, pre-retirees, and people starting their investing journey who want simple guidance instead of jargon.",
    fit: [
      "Young families starting SIPs for children, future homes, or financial independence",
      "Retirees and pre-retirees looking to turn accumulated savings into sustainable income",
      "People just starting their investing journey and wanting step-by-step guidance",
    ],
    concerns: [
      "I want to build good money habits early and stay consistent with them.",
      "I want things to feel simple, understandable, and connected to my future goals.",
      "I do not want to feel lost in product terms or market noise.",
    ],
    support: [
      "Support in building long-term habits through a practical and structured plan",
      "Help linking savings and investments to goals across different timelines",
      "A human voice to speak to when markets are volatile or big decisions come up",
    ],
    nextCta: {
      label: "Start a conversation",
      href: "/contact-us",
    },
  },
  {
    id: "business-nri",
    label: "Business owners and NRIs",
    title: "Business owners and NRIs looking for clarity, structure, and oversight",
    summary:
      "This usually fits business owners, self-employed professionals, and NRIs who want visibility, organised reporting, and a trusted team to help align investments with long-term plans.",
    fit: [
      "Business owners and self-employed people whose income may be uneven but goals are clear",
      "Families that want structure outside the business to protect and grow wealth",
      "NRIs managing money from a distance and wanting visibility and organised reporting",
    ],
    concerns: [
      "My money decisions are spread across places and I want one clearer picture.",
      "I want support that is practical and relationship-led, not product-pushing.",
      "I want a trusted team in India to help me stay aligned to long-term plans.",
    ],
    support: [
      "A structured, goal-linked approach outside the day-to-day pressure of business or distance",
      "Help prioritising what to act on first and what can wait",
      "A guided conversation around fit, complexity, and next steps",
    ],
    nextCta: {
      label: "Start a conversation",
      href: "/contact-us",
    },
  },
];

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-[#D8D8D8] bg-white px-4 text-[15px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const WHO_WE_WORK_WITH_RECAPTCHA_ACTION = "who_we_work_with_submit";

const heroMetrics = [
  { label: "Primary use", value: "Persona-fit journey" },
  { label: "Audience groups", value: "3 segments" },
  { label: "Journey intent", value: "Trust + routing" },
  { label: "Next action", value: "Conversation or tool" },
];

export default function WhoWeWorkWithPage() {
  const { phoneRef, getMobileValue, getCountryCode, clearPhoneValue, validateMobileNumber } =
    useIntlPhoneField();
  const [selectedPersonaId, setSelectedPersonaId] = useState(PERSONAS[0].id);
  const [lead, setLead] = useState<LeadState>({
    name: "",
    email: "",
    preference: PERSONAS[0].label,
  });
  const [errors, setErrors] = useState<LeadErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedPersona = useMemo(
    () =>
      PERSONAS.find((persona) => persona.id === selectedPersonaId) ?? PERSONAS[0],
    [selectedPersonaId],
  );

  useRecaptchaLifecycle();

  const validateLead = () => {
    const nextErrors: LeadErrors = {};

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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateLead()) {
      return;
    }

    setSubmitLoading(true);
    setErrors({});

    try {
      const recaptchaToken = await executeRecaptcha(
        WHO_WE_WORK_WITH_RECAPTCHA_ACTION,
      );
      const mobile = getMobileValue();
      const countryCode = getCountryCode();

      const payload = {
        full_name: lead.name.trim(),
        email: lead.email.trim(),
        mobile,
        country_code: countryCode,
        preference: lead.preference.trim(),
        persona_id: selectedPersona.id,
        persona_label: selectedPersona.label,
        recaptcha_token: recaptchaToken,
      };

      const response = await fetch(`${API_BASE}/api/who-we-work-with-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json().catch(() => null);

      if (!response.ok || responseJson?.success === false) {
        throw new Error(responseJson?.message || "Submission failed");
      }

      setLead({
        name: "",
        email: "",
        preference: selectedPersona.label,
      });
      clearPhoneValue();
      setSubmitted(true);
    } catch (submitError) {
      setErrors({
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
        title="Who usually works with us"
        subtitle="MoneyNow is designed for people who want to build wealth steadily over time with structure, goal-based planning, and a real team alongside them."
        metrics={heroMetrics}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <StartSipPanel
            eyebrow="Choose the closest fit"
            title="Start with the kind of situation that feels most like yours"
            subtitle="These are examples, not limits. If you want a long-term, supported wealth-building journey, you are welcome here."
          >
            <div className="flex flex-wrap gap-3">
              {PERSONAS.map((persona) => {
                const active = persona.id === selectedPersona.id;

                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => {
                      setSelectedPersonaId(persona.id);
                      setLead((prev) => ({
                        ...prev,
                        preference: persona.label,
                      }));
                      setSubmitted(false);
                      setErrors({});
                    }}
                    className={`rounded-full px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#0B3B6E] text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-[#0B3B6E]"
                    }`}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[20px] border border-slate-200 bg-[#FAFAFA] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[#0A4A86]">
                Built for long-term, supported investing
              </p>
              <h3 className="mt-3 text-[24px] font-bold text-slate-900 font-poppins">
                {selectedPersona.title}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                {selectedPersona.summary}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-[#0B3B6E]">
                  Usually fits
                </p>
                <div className="mt-3 space-y-3">
                  {selectedPersona.fit.map((item) => (
                    <div
                      key={item}
                      className="rounded-[14px] bg-[#F8FAFC] px-3 py-3 text-[14px] leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-[#0B3B6E]">
                  Common concerns
                </p>
                <div className="mt-3 space-y-3">
                  {selectedPersona.concerns.map((item) => (
                    <div
                      key={item}
                      className="rounded-[14px] bg-[#F8FAFC] px-3 py-3 text-[14px] leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-[#0B3B6E]">
                  What they usually expect from us
                </p>
                <div className="mt-3 space-y-3">
                  {selectedPersona.support.map((item) => (
                    <div
                      key={item}
                      className="rounded-[14px] bg-[#F8FAFC] px-3 py-3 text-[14px] leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </StartSipPanel>

          <div className="space-y-8">
            <StartSipPanel
              eyebrow="Recommended next step"
              title="If this sounds like you, we should talk"
              subtitle="Share a few details and we&apos;ll let you know how we usually work with people in a similar situation, at your own pace and with no obligation."
            >
              <div className="rounded-[18px] border border-slate-200 bg-[#F8FAFC] p-5">
                <p className="text-[15px] leading-7 text-slate-600">
                  Most of the people we work with are busy with their own
                  careers and lives. They know they should be investing, but
                  they do not want to handle everything alone, chase market
                  noise, or keep shifting strategies every few months.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={selectedPersona.nextCta.href}
                    className="rounded-md bg-[#0B3B6E] px-5 py-3 text-sm font-medium text-white"
                  >
                    {selectedPersona.nextCta.label}
                  </Link>
                  <Link
                    href="/"
                    className="rounded-md border border-[#0B3B6E] px-5 py-3 text-sm font-medium text-[#0B3B6E]"
                  >
                    Go back to homepage
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "See how your SIP can grow towards Rs 1 Crore",
                    copy: "Explore a simple milestone-led SIP journey built around long-term, goal-based investing.",
                    href: "/one-crore-journey",
                    label: "Open journey",
                  },
                  {
                    title: "Get a quick snapshot of your money life",
                    copy: "Use the financial wellness journey to reflect on habits, protection, investing, goals, and debt.",
                    href: "/financial-wellness",
                    label: "Open journey",
                  },
                  {
                    title: "Have a goal in mind?",
                    copy: "Start a conversation if you want to talk through your situation with someone directly.",
                    href: "/contact-us",
                    label: "Start a conversation",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[16px] border border-slate-200 bg-white p-4"
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
                      {card.label}
                    </Link>
                  </div>
                ))}
              </div>
            </StartSipPanel>

            <StartSipPanel
              eyebrow="Prefer a callback?"
              title="Leave your details and context"
              subtitle="Share a few details and we&apos;ll let you know how we usually work with people in a similar situation."
            >
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <input
                      value={lead.name}
                      onChange={(event) =>
                        setLead((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Full name"
                      className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name ? (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      type="email"
                      value={lead.email}
                      onChange={(event) =>
                        setLead((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="Email"
                      className={`${inputClass} ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email ? (
                      <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      ref={phoneRef}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={() =>
                        setErrors((prev) => ({
                          ...prev,
                          mobile: undefined,
                          submit: undefined,
                        }))
                      }
                      onBlur={() => {
                        const mobileError = validateMobileNumber();
                        setErrors((prev) => ({
                          ...prev,
                          mobile: mobileError || undefined,
                        }));
                      }}
                      placeholder="Mobile number"
                      className={`${inputClass} ${errors.mobile ? "border-red-500" : ""}`}
                    />
                    {errors.mobile ? (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.mobile}
                      </p>
                    ) : null}
                  </div>
                  <input
                    value={lead.preference}
                    onChange={(event) =>
                      setLead((prev) => ({
                        ...prev,
                        preference: event.target.value,
                      }))
                    }
                    placeholder="What best describes you?"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-md bg-[#0B3B6E] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLoading ? "Submitting..." : "Start a conversation"}
                </button>

                {submitted ? (
                  <div className="rounded-[8px] border border-[#C8E6D4] bg-[#F2FBF6] px-4 py-3 text-sm text-[#17663A]">
                    Your details have been shared successfully. We can now use
                    this to follow up based on the persona path that fits you
                    best.
                  </div>
                ) : null}
                {errors.submit ? (
                  <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.submit}
                  </div>
                ) : null}
              </form>
            </StartSipPanel>
          </div>
        </div>
      </section>
    </div>
  );
}
