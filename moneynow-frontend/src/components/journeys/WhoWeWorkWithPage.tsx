"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";

type Persona = {
  id: string;
  label: string;
  title: string;
  summary: string;
  icon: "briefcase" | "family" | "globe";
  fitHeading: string;
  fit: string[];
  concernsHeading: string;
  concerns: string[];
  supportHeading: string;
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
    title: "Working professionals",
    summary:
      "Structured wealth building for doctors, lawyers, and salaried professionals who want long-term clarity without handling everything alone.",
    icon: "briefcase",
    fitHeading: "Why it fits you",
    fit: ["Doctors", "Lawyers", "Salaried professionals"],
    concernsHeading: "Common concerns",
    concerns: [
      "I know I should be investing, but I do not want to handle everything alone.",
      "I know I should be investing, but I want structure and accountability here.",
    ],
    supportHeading: "How we support you",
    support: [
      "Structured, goal-based plans using mutual funds",
      "Organized reviews and practical guidance",
    ],
    nextCta: {
      label: "Start a conversation",
      href: "/contact-us",
    },
  },
  {
    id: "families",
    label: "Families and life stages",
    title: "Families and life stages",
    summary:
      "Simple, step-by-step support for young families, retirees, and beginners who want to build habits that last.",
    icon: "family",
    fitHeading: "Details",
    fit: [
      "Young families: long-term habit building and goal-linked mutual funds",
      "Retirees: income, stability, and organized decision support",
      "Beginners: simple, clear steps to start with mutual funds",
    ],
    concernsHeading: "Common concerns",
    concerns: [
      "I want money decisions to feel simpler and less intimidating.",
      "I want support that fits my life stage, not generic advice.",
    ],
    supportHeading: "How we support you",
    support: [
      "Goal-linked investing and habit building",
      "Guided conversations around priorities and next steps",
    ],
    nextCta: {
      label: "Start a conversation",
      href: "/contact-us",
    },
  },
  {
    id: "business-nri",
    label: "Business owners and NRIs",
    title: "Business owners and NRIs",
    summary:
      "Clarity, structure, and oversight for self-employed professionals, business families, and NRIs managing money across contexts.",
    icon: "globe",
    fitHeading: "Details",
    fit: [
      "Self-employed: clarity, structure, and non-chaotic process",
      "Families protecting business wealth: clearer separation and oversight",
      "NRIs: organized reporting and support from a distance",
    ],
    concernsHeading: "Common concerns",
    concerns: [
      "My money decisions are spread across places and need a clearer picture.",
      "I want reliable support, not product-pushing.",
    ],
    supportHeading: "How we support you",
    support: [
      "Structured planning outside business or distance pressures",
      "Guided prioritization and long-term oversight",
    ],
    nextCta: {
      label: "Start a conversation",
      href: "/contact-us",
    },
  },
];

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-[#D8DEE8] bg-white px-4 text-[15px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const WHO_WE_WORK_WITH_RECAPTCHA_ACTION = "who_we_work_with_submit";

function PersonaIcon({ icon }: { icon: Persona["icon"] }) {
  if (icon === "briefcase") {
    return (
      <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none">
        <rect x="10" y="20" width="44" height="28" rx="5" fill="#477AB3" />
        <rect x="24" y="14" width="16" height="8" rx="2" fill="#214D7C" />
        <rect x="16" y="27" width="18" height="14" rx="2" fill="#E4B84A" />
        <rect x="38" y="24" width="12" height="18" rx="2" fill="#5AC29A" />
      </svg>
    );
  }

  if (icon === "family") {
    return (
      <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none">
        <circle cx="19" cy="22" r="8" fill="#D89C7D" />
        <circle cx="32" cy="28" r="7" fill="#F0C59A" />
        <circle cx="47" cy="21" r="8" fill="#CDA173" />
        <path d="M11 34c0-4 4-7 8-7s8 3 8 7v10H11V34Z" fill="#6D8FCD" />
        <path d="M24 38c0-4 4-7 8-7s8 3 8 7v8H24v-8Z" fill="#8FD2B5" />
        <path d="M39 34c0-4 4-7 8-7s8 3 8 7v10H39V34Z" fill="#88AE71" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none">
      <circle cx="22" cy="19" r="8" fill="#C89B73" />
      <path d="M14 33c0-4 4-7 8-7s8 3 8 7v11H14V33Z" fill="#5D7FB5" />
      <circle cx="44" cy="31" r="14" fill="#73B6D8" />
      <path
        d="M31 31h26M44 18c-3 3-5 8-5 13s2 10 5 13M44 18c3 3 5 8 5 13s-2 10-5 13"
        stroke="#2A587D"
        strokeWidth="2"
      />
    </svg>
  );
}

function PersonaHeroIllustration() {
  return (
    <div className="relative h-[250px] w-full md:h-[300px]">
      <div className="absolute left-[6%] top-[10%] h-[92px] w-[180px] rounded-[10px] border border-[#163B63] bg-white p-3 shadow-[0_10px_30px_rgba(17,45,77,0.10)]">
        <p className="text-[14px] font-semibold text-[#111111]">Mutual Funds</p>
        <div className="mt-3 space-y-2">
          <div className="h-[1px] bg-slate-200" />
          <div className="h-[1px] bg-slate-200" />
          <div className="h-[1px] bg-slate-200" />
        </div>
        <svg
          viewBox="0 0 120 60"
          className="absolute bottom-3 right-3 h-12 w-28"
          fill="none"
        >
          <path
            d="M5 50L35 20L55 34L90 10"
            stroke="#3D7CC0"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M90 10H78M90 10V22"
            stroke="#3D7CC0"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="absolute right-[8%] top-[16%] h-[96px] w-[182px] rounded-[10px] border border-[#2E8C5B] bg-white p-3 shadow-[0_10px_30px_rgba(17,45,77,0.10)]">
        <div className="mt-8">
          <svg viewBox="0 0 120 50" className="h-12 w-28" fill="none">
            <path
              d="M5 40L24 28L42 34L61 16L86 30L111 10"
              stroke="#42B57A"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M111 10H98M111 10V23"
              stroke="#42B57A"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 flex w-[290px] -translate-x-1/2 items-end justify-center gap-3">
        {["#5C84BA", "#78A6D6", "#1B3F67", "#7BC2A5", "#4F7FB0"].map(
          (color, index) => (
            <div
              key={color}
              className="flex flex-col items-center"
              style={{ marginBottom: index % 2 === 0 ? 0 : 10 }}
            >
              <div className="h-8 w-8 rounded-full border-2 border-[#1D3857] bg-[#E8B18E]" />
              <div
                className="mt-1 h-16 w-10 rounded-t-[10px]"
                style={{ backgroundColor: color }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function TickBullet({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-6 text-[#202020]">
      <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#36B37E] text-[12px] font-bold text-white">
        &#10003;
      </span>
      <span>{text}</span>
    </li>
  );
}

export default function WhoWeWorkWithPage() {
  const {
    phoneRef,
    getMobileValue,
    getCountryCode,
    clearPhoneValue,
    validateMobileNumber,
  } = useIntlPhoneField();
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
      PERSONAS.find((persona) => persona.id === selectedPersonaId) ??
      PERSONAS[0],
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

      const response = await fetch(
        `${API_BASE}/api/who-we-work-with-enquiries`,
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
    <div className="bg-[#F7FAFD] font-poppins text-[#111111]">
      <section className="border-b border-[#E6EDF5] bg-[radial-gradient(circle_at_top,rgba(39,91,156,0.16),transparent_48%),linear-gradient(180deg,#F9FCFF_0%,#F2F7FC_100%)]">
        <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
          <div className="grid items-center gap-10 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] border border-[#DCE8F4] bg-white/85 p-7 shadow-[0_18px_50px_rgba(18,45,77,0.08)] md:min-h-[306px] md:p-10">
              <p className="text-[15px] font-medium text-[#0B4B88]">Personas</p>
              <h1 className="mt-3 max-w-[560px] text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#111111] md:text-[52px]">
                Who we work with
              </h1>
              <p className="mt-5 max-w-[560px] text-[18px] leading-8 text-[#3B4856]">
                Start with the kind of financial situation that feels most like
                yours. We help long-term investors build structure, clarity, and
                confidence with mutual funds.
              </p>
              <div className="mt-7">
                <Link
                  href={selectedPersona.nextCta.href}
                  className="inline-flex items-center rounded-[10px] bg-[#0B3B6E] px-6 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#082D54]"
                >
                  Get Started
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#DCE8F4] bg-white/90 p-5 shadow-[0_18px_50px_rgba(18,45,77,0.08)] md:min-h-[306px] md:p-7">
              <PersonaHeroIllustration />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-10 md:px-6 md:py-12">
        <div className="grid gap-8 xl:grid-cols-[1.9fr_0.95fr]">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111] md:text-[32px]">
              Personas
            </h2>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
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
                    className={`flex h-full flex-col rounded-[18px] border bg-white p-5 text-left shadow-[0_12px_30px_rgba(18,45,77,0.06)] transition ${
                      active
                        ? "border-[#0B4B88] shadow-[0_18px_38px_rgba(11,75,136,0.12)]"
                        : "border-[#DCE5EF] hover:border-[#AFC5DB]"
                    }`}
                  >
                    <PersonaIcon icon={persona.icon} />
                    <h3 className="mt-4 text-[18px] font-semibold text-[#111111]">
                      {persona.title}
                    </h3>
                    <div className="mt-5">
                      <p className="text-[15px] font-semibold text-[#111111]">
                        {persona.fitHeading}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {persona.fit.map((item) => (
                          <TickBullet key={item} text={item} />
                        ))}
                      </ul>
                    </div>
                    <div className="mt-5">
                      <p className="text-[15px] font-semibold text-[#111111]">
                        {persona.concernsHeading}
                      </p>
                      <ul className="mt-3 space-y-2 text-[15px] leading-6 text-[#202020]">
                        {persona.concerns.map((item) => (
                          <li key={item} className="list-none">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-5">
                      <p className="text-[15px] font-semibold text-[#111111]">
                        {persona.supportHeading}
                      </p>
                      <ul className="mt-3 space-y-2 text-[15px] leading-6 text-[#202020]">
                        {persona.support.map((item) => (
                          <li key={item} className="list-none">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="mt-auto inline-flex items-center pt-6 text-[15px] font-medium text-[#0B4B88]">
                      {persona.nextCta.label}
                      <span className="ml-2">&rarr;</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[18px] border border-[#DCE5EF] bg-white p-6 shadow-[0_12px_30px_rgba(18,45,77,0.06)]">
              <h3 className="text-[16px] font-semibold text-[#111111]">
                Primary use
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-[#2E3A48]">
                Goal-based, long-term mutual fund planning with a clear human
                support layer.
              </p>

              <h3 className="mt-5 text-[16px] font-semibold text-[#111111]">
                Audience groups
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-[#2E3A48]">
                Working professionals, families in different life stages,
                business owners, and NRIs.
              </p>

              <h3 className="mt-5 text-[16px] font-semibold text-[#111111]">
                Journey intent
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-[#2E3A48]">
                Long-term habit building, structure, and practical wealth
                conversations.
              </p>

              <h3 className="mt-5 text-[16px] font-semibold text-[#111111]">
                Next action
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-[#2E3A48]">
                Start a guided discussion based on the persona path that fits
                you best.
              </p>
            </div>

            <div className="rounded-[18px] border border-[#DCE5EF] bg-white p-6 shadow-[0_12px_30px_rgba(18,45,77,0.06)]">
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#111111] md:text-[28px]">
                Connect with an advisor
              </h2>

              <form
                noValidate
                onSubmit={handleLeadSubmit}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#111111]">
                    Name
                  </label>
                  <input
                    value={lead.name}
                    onChange={(event) => {
                      setLead((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        name: undefined,
                        submit: undefined,
                      }));
                    }}
                    placeholder="Enter your name"
                    className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name ? (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#111111]">
                    Email
                  </label>
                  <input
                    type="text"
                    inputMode="email"
                    value={lead.email}
                    onChange={(event) => {
                      setLead((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        email: undefined,
                        submit: undefined,
                      }));
                    }}
                    placeholder="Enter your email"
                    className={`${inputClass} ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email ? (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  ) : null}
                </div>

                <div className="who-we-work-phone">
                  <label className="mb-2 block text-[14px] font-medium text-[#111111]">
                    Mobile
                  </label>
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
                    placeholder="Enter your mobile number"
                    className={`${inputClass} !pl-[84px] ${
                      errors.mobile ? "border-red-500" : ""
                    }`}
                  />
                  {errors.mobile ? (
                    <p className="mt-2 text-sm text-red-600">{errors.mobile}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#111111]">
                    Preference
                  </label>
                  <select
                    value={lead.preference}
                    onChange={(event) =>
                      setLead((prev) => ({
                        ...prev,
                        preference: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    {PERSONAS.map((persona) => (
                      <option key={persona.id} value={persona.label}>
                        {persona.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full rounded-[10px] bg-[#0B3B6E] px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#082D54] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLoading ? "Submitting..." : "Schedule my discussion"}
                </button>

                {submitted ? (
                  <div className="rounded-[10px] border border-[#C8E6D4] bg-[#F2FBF6] px-4 py-3 text-sm text-[#17663A]">
                    Your details were shared successfully. We&apos;ll follow up
                    based on the persona path that fits you best.
                  </div>
                ) : null}
                {errors.submit ? (
                  <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.submit}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .who-we-work-phone .iti {
          width: 100%;
        }

        .who-we-work-phone .iti input {
          width: 100%;
          height: 52px;
          border-radius: 10px;
          border: 1px solid #d8dee8;
          background: #ffffff;
          padding-left: 84px;
          color: #1a1a1a;
        }

        .who-we-work-phone .iti__flag-container,
        .who-we-work-phone .iti__selected-flag {
          height: 52px;
        }

        .who-we-work-phone .iti__flag-container {
          width: 76px;
          border: 1px solid #d8dee8;
          border-right: none;
          border-radius: 10px 0 0 10px;
          background: #ffffff;
        }

        .who-we-work-phone .iti--separate-dial-code .iti__selected-flag {
          width: 76px;
          padding: 0 10px;
          justify-content: center;
          background: #ffffff;
          border-right: 1px solid #d8dee8;
        }

        .who-we-work-phone .iti__selected-dial-code,
        .who-we-work-phone .iti__country-name,
        .who-we-work-phone .iti__dial-code,
        .who-we-work-phone .iti__arrow,
        .who-we-work-phone .iti__country {
          color: #111111;
        }

        .who-we-work-phone .iti__country-list {
          width: auto;
          min-width: 220px;
          max-width: 240px;
          background: #ffffff;
          border: 1px solid #d8dee8;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
          color: #111111;
          z-index: 40;
        }
      `}</style>
    </div>
  );
}
