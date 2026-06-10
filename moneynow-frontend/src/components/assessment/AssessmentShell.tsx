"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HeartHandshake, Shield } from "lucide-react";
import { API } from "@/app/api/axios";
import AssessmentLeadGate, {
  AssessmentFormState,
} from "@/components/assessment/AssessmentLeadGate";
import AssessmentResult from "@/components/assessment/AssessmentResult";
import {
  trustHighlights,
  pillarLabels,
} from "@/components/assessment/questions";

type AssessmentApiResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    score: number;
    category: string;
    report: {
      wealth_creation: string;
      wealth_protection: string;
      wealth_restructuring: string;
      wealth_distribution: string;
    };
    chart_data?: {
      savings_score: number;
      investment_score: number;
      protection_score: number;
      distribution_score: number;
    };
    pdf_url?: string | null;
    next_step?: string;
  };
};

const initialForm: AssessmentFormState = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  age: "",
  monthly_income: "",
  monthly_expenses: "",
  loans: "",
  investments: "",
  goals: [],
};

const toAbsolutePdfUrl = (pdfUrl?: string | null) => {
  if (!pdfUrl) return null;
  if (/^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "";
  return `${baseUrl}${pdfUrl}`;
};

export default function AssessmentShell() {
  const [form, setForm] = useState<AssessmentFormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AssessmentFormState, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentApiResponse["data"] | null>(
    null,
  );

  const pdfHref = useMemo(
    () => toAbsolutePdfUrl(result?.pdf_url),
    [result?.pdf_url],
  );

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError(null);
  };

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((item) => item !== goal)
        : [...prev.goals, goal],
    }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof AssessmentFormState, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email";
    }

    if (!form.phone.trim()) nextErrors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      nextErrors.phone = "Use a valid 10-digit Indian mobile number";
    }

    if (!form.monthly_income.trim()) {
      nextErrors.monthly_income = "Monthly income is required";
    } else if (Number(form.monthly_income) <= 0) {
      nextErrors.monthly_income = "Monthly income must be greater than 0";
    }

    if (!form.monthly_expenses.trim()) {
      nextErrors.monthly_expenses = "Monthly expenses are required";
    } else if (Number(form.monthly_expenses) < 0) {
      nextErrors.monthly_expenses = "Monthly expenses cannot be negative";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitAssessment = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender || undefined,
        age: form.age || undefined,
        monthly_income: Number(form.monthly_income),
        monthly_expenses: Number(form.monthly_expenses),
        loans: form.loans ? Number(form.loans) : 0,
        investments: form.investments ? Number(form.investments) : 0,
      };

      const { data } = await API.post<AssessmentApiResponse>(
        "/api/financial-assessment",
        payload,
      );

      if (!data?.success || !data?.data) {
        throw new Error(data?.message || "Unable to complete the assessment");
      }

      setResult(data.data);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : error instanceof Error
            ? error.message
            : null;

      setSubmitError(
        message || "Something went wrong while submitting the assessment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-poppins bg-[linear-gradient(180deg,#F4FAFF_0%,#FFFFFF_42%,#F7FBFE_100%)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(93,214,255,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(15,76,129,0.16),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-18">
          <div className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div>
              <h1 className="mt-5 max-w-[720px] text-[38px] font-semibold leading-[1.08] text-[#072A4A] md:text-[58px]">
                A clearer picture of your money health, in one guided check-in.
              </h1>
              <p className="mt-5 max-w-[680px] text-[16px] leading-8 text-[#556477] md:text-[18px]">
                This is not the CFPB-style questionnaire. Our experience is
                built for MoneyNow&apos;s current system, using your actual
                income, expenses, loans, and investments to generate a practical
                score, four-pillar recommendations, and a downloadable report.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#assessment-form"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#0F4C81] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#0B3258]"
                >
                  Start assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#BFD7EA] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#0F4C81] transition hover:border-[#0F4C81]"
                >
                  Talk to an advisor
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {trustHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-[#D8E8F4] bg-white/80 p-4 backdrop-blur"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#0F4C81]" />
                    <p className="mt-3 text-[14px] leading-6 text-[#4E6277]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-[#072A4A] p-6 text-white shadow-[0_28px_80px_rgba(7,42,74,0.2)] md:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-white/10 p-3">
                  <Shield className="h-6 w-6 text-[#8FD3FF]" />
                </div>
                <div>
                  <p className="text-[13px] uppercase tracking-[0.24em] text-white/68">
                    How it works
                  </p>
                  <h2 className="mt-2 text-[26px] font-semibold">
                    Designed to feel useful, not overwhelming
                  </h2>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {[
                  "Share a quick financial snapshot with key monthly and long-term numbers.",
                  "We calculate a current wellness score and map it into a clear category.",
                  "You receive four practical recommendation blocks plus a PDF report.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-[20px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8FD3FF] text-[14px] font-semibold text-[#072A4A]">
                      0{index + 1}
                    </div>
                    <p className="text-[15px] leading-7 text-white/88">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[22px] bg-white/6 p-5">
                <div className="flex items-center gap-3">
                  <HeartHandshake className="h-5 w-5 text-[#8FD3FF]" />
                  <p className="text-[15px] font-medium">
                    Your result is meant to guide your next move
                  </p>
                </div>
                <p className="mt-3 text-[14px] leading-7 text-white/75">
                  The strongest experience comes from combining the report with
                  a discovery conversation. That is why the result section
                  includes a clear call to speak with the team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 md:px-10">
        <div className="grid gap-4 md:grid-cols-4">
          {pillarLabels.map((pillar) => (
            <div
              key={pillar.key}
              className="rounded-[20px] border border-[#D7E5F0] bg-white p-5"
            >
              <p className="text-[12px] uppercase tracking-[0.22em] text-[#0F4C81]">
                Pillar
              </p>
              <h3 className="mt-2 text-[19px] font-semibold text-[#0B3258]">
                {pillar.label}
              </h3>
              <p className="mt-3 text-[14px] leading-6 text-[#617487]">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div
        id="assessment-form"
        className="mx-auto max-w-7xl px-6 pb-18 md:px-10"
      >
        <AssessmentLeadGate
          form={form}
          errors={errors}
          submitting={submitting}
          onChange={handleChange}
          onToggleGoal={toggleGoal}
          onSubmit={submitAssessment}
        />

        {submitError ? (
          <div className="mt-5 rounded-[18px] border border-[#F3C7C7] bg-[#FFF4F4] px-5 py-4 text-[14px] text-[#9F2F2F]">
            {submitError}
          </div>
        ) : null}

        {result ? (
          <div className="mt-8">
            <AssessmentResult result={result} pdfHref={pdfHref} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
