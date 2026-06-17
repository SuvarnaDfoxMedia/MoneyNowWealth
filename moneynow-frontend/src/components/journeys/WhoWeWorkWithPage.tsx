"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";
import { ArrowRight, BarChart3, Target, TrendingUp, X } from "lucide-react";
import { executeRecaptcha } from "@/lib/recaptcha";
import useRecaptchaLifecycle from "@/hooks/useRecaptchaLifecycle";
import useIntlPhoneField from "@/hooks/useIntlPhoneField";

type AudienceCard = {
  id: string;
  tab: string;
  title: string;
  copy: string;
  image: string;
};

type Reason = {
  number: string;
  title: string;
  copy: string;
};

type ArticleCard = {
  title: string;
  copy: string;
  image: string;
  href: string;
};

type ToolCard = {
  title: string;
  copy: string;
  cta: string;
  href: string;
  icon: "target" | "chart" | "trend";
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

const AUDIENCES: AudienceCard[] = [
  {
    id: "busy-professionals",
    tab: "Busy Professionals",
    title: "Busy professionals",
    copy: "Long workdays often leave little time to organise investments properly. We help simplify the process so starting or continuing becomes easier.",
    image: "/images/article-img-1.png",
  },
  {
    id: "salaried-individuals",
    tab: "Salaried Individuals",
    title: "Salaried individuals",
    copy: "A steady income can become a steady investment habit with the right structure, SIP planning, and simple checkpoints along the way.",
    image: "/images/blog-img-1.png",
  },
  {
    id: "young-families",
    tab: "Young Families",
    title: "Young families",
    copy: "New goals can arrive quickly. We help families bring education, home, protection, and long-term investing into one clearer plan.",
    image: "/images/people-behind-1.png",
  },
  {
    id: "business-owners",
    tab: "Business Owners",
    title: "Business owners",
    copy: "When business and personal finances move together, we help create cleaner separation, better visibility, and more disciplined investing.",
    image: "/images/people-behind-2.png",
  },
  {
    id: "nris",
    tab: "NRI's",
    title: "NRI investors",
    copy: "For investors managing money from a distance, we keep reporting, portfolio discussions, and follow-ups organised and easy to track.",
    image: "/images/blog-img-2.png",
  },
  {
    id: "new-investors",
    tab: "New Investors",
    title: "New investors",
    copy: "If you are beginning, we keep the first steps clear: understand your goal, choose a sensible route, and build confidence gradually.",
    image: "/images/blog-img-3.png",
  },
];

const REASONS: Reason[] = [
  {
    number: "01",
    title: "Clarity",
    copy: "To get a clearer sense of where to begin, instead of trying to figure everything out alone.",
  },
  {
    number: "02",
    title: "Confidence",
    copy: "To start SIPs or make investments with more structure and less confusion, with someone walking them through the process step by step.",
  },
  {
    number: "03",
    title: "Goals",
    copy: "To connect what they are investing today more clearly with the future goals and timelines they have in mind.",
  },
  {
    number: "04",
    title: "Tools",
    copy: "To use simple tools and data before taking the next step, so decisions feel more informed and less guesswork-driven.",
  },
  {
    number: "05",
    title: "Guidance",
    copy: "To have human support available when it matters - a guided journey where questions can be discussed and you are not left to navigate every step on your own.",
  },
];

const ARTICLES: ArticleCard[] = [
  {
    title: "Why staying invested matters more than timing the market",
    copy: "A short read on how discipline and time can work for your money.",
    image: "/images/people-behind-2.png",
    href: "/blog-listing",
  },
  {
    title: "How to choose a comfortable SIP amount",
    copy: "Practical ways to decide what you can invest each month without over-stretching yourself.",
    image: "/images/article-img-1.png",
    href: "/blog-listing",
  },
  {
    title: "How to choose a right asset allocation",
    copy: "Practical ways to decide what you can invest each month without over-stretching yourself.",
    image: "/images/people-behind-1.png",
    href: "/blog-listing",
  },
];

const TOOLS: ToolCard[] = [
  {
    title: "Plan another goal",
    copy: "Estimate how much SIP you may need for a different goal amount, time frame, or return assumption.",
    cta: "Open goal calculator",
    href: "/free-calculators",
    icon: "target",
  },
  {
    title: "See what a lumpsum could do",
    copy: "Check how a one-time investment today could grow alongside your SIPs over the years.",
    cta: "Open lumpsum calculator",
    href: "/free-calculators",
    icon: "chart",
  },
  {
    title: "Understand inflation on your goals",
    copy: "See how inflation changes the real value of your future goals and why starting early matters.",
    cta: "Open inflation calculator",
    href: "/free-calculators",
    icon: "trend",
  },
];

const iconMap = {
  target: Target,
  chart: BarChart3,
  trend: TrendingUp,
};

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-[#D8DEE8] bg-white px-4 text-[15px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const WHO_WE_WORK_WITH_RECAPTCHA_ACTION = "who_we_work_with_submit";

function ConversationModal({
  initialPreference,
  onClose,
}: {
  initialPreference: AudienceCard;
  onClose: () => void;
}) {
  const {
    phoneRef,
    getMobileValue,
    getCountryCode,
    clearPhoneValue,
    validateMobileNumber,
  } = useIntlPhoneField();
  const [lead, setLead] = useState<LeadState>({
    name: "",
    email: "",
    preference: initialPreference.tab,
  });
  const [errors, setErrors] = useState<LeadErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useRecaptchaLifecycle();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

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
        persona_id: initialPreference.id,
        persona_label: initialPreference.tab,
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
        preference: initialPreference.tab,
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-5 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-[18px] border border-[#DCE5EF] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="conversation-modal-title"
            className="text-[24px] font-semibold tracking-[-0.03em] text-[#111111] md:text-[28px]"
          >
            Connect with an advisor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#D8DEE8] text-[#111111] transition hover:bg-[#F3F6FA]"
            aria-label="Close popup"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <form noValidate onSubmit={handleLeadSubmit} className="mt-6 space-y-4">
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
              {AUDIENCES.map((audience) => (
                <option key={audience.id} value={audience.tab}>
                  {audience.tab}
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
              Your details were shared successfully. We&apos;ll follow up based
              on the persona path that fits you best.
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
  );
}

export default function WhoWeWorkWithPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([0]);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [conversationIndex, setConversationIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % AUDIENCES.length;

        setRevealedIndexes((currentRevealed) =>
          currentRevealed.includes(nextIndex)
            ? currentRevealed
            : [...currentRevealed, nextIndex],
        );

        return nextIndex;
      });
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  const handleAudienceSelect = (index: number) => {
    setActiveIndex(index);
    setRevealedIndexes((currentRevealed) =>
      currentRevealed.includes(index)
        ? currentRevealed
        : [...currentRevealed, index],
    );
  };

  const handleConversationOpen = (index: number) => {
    setConversationIndex(index);
    setIsConversationOpen(true);
  };

  return (
    <main className="font-poppins text-[#111111]">
      <section className="bg-[#F3F9FF]">
       <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-[40px] md:px-6 lg:grid-cols-2 lg:py-[50px]">
          <div className="relative">
            <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[36px] md:text-[46px]">
              Who usually works with us
            </h1>
            <p className="mt-6 max-w-[520px] text-[16px] leading-[28px] text-[#20242A] sm:mt-8 sm:text-[17px] sm:leading-[30px]">
              Most people who reach out to Moneynow are looking for a simpler,
              more structured way to start or continue investing for long-term
              goals - with clearer information, less noise, and a smoother
              experience.
            </p>
            <button
              type="button"
              onClick={() => handleConversationOpen(activeIndex)}
              aria-haspopup="dialog"
              className="mt-8 inline-flex items-center gap-3 rounded-[6px] bg-[#074A86] px-5 py-3 text-[16px] font-medium text-white shadow-sm transition hover:bg-[#063C70]"
            >
              Start a Conversation
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full min-w-0">
            <div className="mb-3 flex gap-4 overflow-x-auto whitespace-nowrap pb-2 text-[13px] font-medium text-[#676767] sm:gap-5 sm:text-[14px] md:justify-end">
              {AUDIENCES.map((audience, index) => (
                <button
                  key={audience.id}
                  type="button"
                  onFocus={() => handleAudienceSelect(index)}
                  onClick={() => handleAudienceSelect(index)}
                  className={`border-b pb-1 transition ${
                    index === activeIndex
                      ? "border-[#074A86] text-[#074A86]"
                      : "border-transparent hover:text-[#074A86]"
                  }`}
                >
                  {audience.tab}
                </button>
              ))}
            </div>

            <div className="relative min-h-[620px] overflow-visible pt-[62px] sm:min-h-[610px] md:min-h-[420px] md:pt-[70px]">
              {AUDIENCES.map((audience, index) => {
                const stackPosition =
                  (activeIndex - index + AUDIENCES.length) % AUDIENCES.length;
                const isActive = stackPosition === 0;
                const hasBeenRevealed = revealedIndexes.includes(index);
                const isIncomingFromBottom =
                  stackPosition === AUDIENCES.length - 1;
                const visibleStackPosition = Math.min(stackPosition, 5);
                const deckPosition = isIncomingFromBottom
                  ? -1
                  : visibleStackPosition;
                const translateY = isActive
                  ? 0
                  : isIncomingFromBottom
                    ? 92
                    : -deckPosition * 14;
                const scale = isActive
                  ? 1
                  : isIncomingFromBottom
                    ? 0.985
                    : 1 - deckPosition * 0.018;
                const isVisible =
                  isActive ||
                  (hasBeenRevealed &&
                    !isIncomingFromBottom &&
                    stackPosition <= 5);

                return (
                  <article
                    key={audience.id}
                    className={`absolute inset-x-0 top-[62px] rounded-[16px] border border-[#ECEFF3] bg-[#ffffff] shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform md:top-[70px] ${
                      isActive
                        ? "pointer-events-auto grid gap-5 p-4 md:grid-cols-[1fr_0.92fr] md:gap-6 md:p-5"
                        : "pointer-events-none h-[86px] overflow-hidden"
                    }`}
                    style={{
                      zIndex: isActive
                        ? AUDIENCES.length + 1
                        : isIncomingFromBottom
                          ? 1
                          : AUDIENCES.length - deckPosition,
                      opacity: isVisible ? 1 : 0,
                      transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                      transformOrigin: "top center",
                    }}
                  >
                    {isActive ? (
                      <>
                        <div className="relative min-h-[260px] overflow-hidden rounded-[8px] bg-[#E5EEF5] sm:min-h-[300px]">
                          <Image
                            src={audience.image}
                            alt={audience.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 320px"
                          />
                        </div>
                        <div className="flex flex-col justify-center py-2 pr-1">
                          <h2 className="text-[24px] font-semibold leading-[1.16] tracking-[-0.03em] sm:text-[26px]">
                            {audience.title}
                          </h2>
                          <p className="mt-4 text-[15px] leading-[25px] sm:mt-6 sm:text-[16px] sm:leading-[26px]">
                            {audience.copy}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleConversationOpen(index)}
                            aria-haspopup="dialog"
                            className="mt-6 inline-flex items-center gap-2 text-[16px] font-medium text-[#074A86]"
                          >
                            Start a conversation
                            <span aria-hidden="true">-&gt;</span>
                          </button>
                        </div>
                      </>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-[50px]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px] md:text-[40px]">
            What People Usually Come To Us For
          </h2>

          <div className="mt-10 grid gap-y-8 sm:grid-cols-2 sm:gap-x-6 md:mt-14 lg:grid-cols-5">
            {REASONS.map((reason, index) => (
              <div
                key={reason.number}
                className={`px-4 md:px-5 ${
                  index === 0 ? "" : "lg:border-l lg:border-[#E5EAF0]"
                }`}
              >
                <p className="text-[30px] font-semibold leading-none text-[#D0D7DF]">
                  {reason.number}
                </p>
                <p className="mt-4 text-[18px] font-semibold">
                  {reason.title}
                </p>
                <p className="mt-3 text-[15px] leading-[25px] ">
                  {reason.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F9FF] py-14 md:py-[50px]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px] md:text-[40px]">
            Learn More About Long-Term Investing
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {ARTICLES.map((article) => (
              <article
                key={article.title}
                className="overflow-hidden rounded-[10px] border border-[#E5EAF0] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.03)]"
              >
                <div className="relative aspect-[1.9/1] bg-[#E5EEF5]">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-[20px] font-semibold leading-[1.48] tracking-[-0.02em]">
                    {article.title}
                  </h3>
                  <p className="mt-4 text-[16px] leading-[26px] ">
                    {article.copy}
                  </p>
                  <Link
                    href={article.href}
                    className="mt-8 inline-flex items-center gap-3 text-[16px] font-medium"
                  >
                    Read Article
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 md:py-[50px]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px] md:text-[40px]">
              More Tools To Explore
            </h2>
            <p className="mt-4 text-[17px] leading-7 text-[#20242A]">
              Use these simple tools to look at your money from a few different
              angles
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = iconMap[tool.icon];

              return (
                <article
                  key={tool.title}
                  className="rounded-[10px] border border-[#E5EAF0] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.10)]"
                >
                  <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[6px] bg-[#E7EEF5] text-[#074A86]">
                    <Icon aria-hidden="true" className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">
                    {tool.title}
                  </h3>
                  <p className="mt-5 text-[16px] leading-[26px]">
                    {tool.copy}
                  </p>
                  <Link
                    href={tool.href}
                    className="mt-7 inline-flex items-center gap-3 rounded-[6px] bg-[#074A86] px-5 py-3 text-[16px] font-medium text-white transition hover:bg-[#063C70]"
                  >
                    {tool.cta}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {isConversationOpen ? (
        <ConversationModal
          initialPreference={AUDIENCES[conversationIndex]}
          onClose={() => setIsConversationOpen(false)}
        />
      ) : null}

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
          z-index: 60;
        }
      `}</style>
    </main>
  );
}
