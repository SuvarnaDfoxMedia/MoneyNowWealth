"use client";

import { ChangeEvent } from "react";
import { goalOptions } from "@/components/assessment/questions";

export type AssessmentFormState = {
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: string;
  monthly_income: string;
  monthly_expenses: string;
  loans: string;
  investments: string;
  goals: string[];
};

interface AssessmentLeadGateProps {
  form: AssessmentFormState;
  errors: Partial<Record<keyof AssessmentFormState, string>>;
  submitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleGoal: (goal: string) => void;
  onSubmit: () => void;
}

const inputClassName =
  "h-[52px] w-full rounded-[16px] border border-[#D7E5F0] bg-white px-4 text-[15px] text-[#12304B] outline-none transition focus:border-[#0F4C81] focus:ring-4 focus:ring-[#0F4C81]/10";

export default function AssessmentLeadGate({
  form,
  errors,
  submitting,
  onChange,
  onToggleGoal,
  onSubmit,
}: AssessmentLeadGateProps) {
  return (
    <section className="font-poppins rounded-[28px] border border-[#D9E8F4] bg-white p-6 shadow-[0_20px_60px_rgba(6,36,68,0.08)] md:p-8">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="xl:w-[34%]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#0F4C81]">
            Your details
          </p>
          <h2 className="mt-4 text-[30px] font-semibold leading-tight text-[#072A4A] md:text-[38px]">
            Start your financial wellness check
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#556477]">
            Fill in a quick snapshot of your current finances. We will calculate
            a score, highlight what needs attention, and generate a downloadable
            report from your responses.
          </p>
        </div>

        <div className="xl:w-[66%]">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Full name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Rahul Sharma"
                className={`${inputClassName} ${errors.name ? "border-[#D14343]" : ""}`}
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-[#D14343]">{errors.name}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Email *
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="rahul@example.com"
                className={`${inputClassName} ${errors.email ? "border-[#D14343]" : ""}`}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-[#D14343]">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Mobile number *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="9876543210"
                className={`${inputClassName} ${errors.phone ? "border-[#D14343]" : ""}`}
              />
              {errors.phone ? (
                <p className="mt-1 text-xs text-[#D14343]">{errors.phone}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={onChange}
                className={inputClassName}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Age
              </label>
              <input
                name="age"
                value={form.age}
                onChange={onChange}
                placeholder="32"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Monthly income *
              </label>
              <input
                name="monthly_income"
                value={form.monthly_income}
                onChange={onChange}
                placeholder="100000"
                className={`${inputClassName} ${errors.monthly_income ? "border-[#D14343]" : ""}`}
              />
              {errors.monthly_income ? (
                <p className="mt-1 text-xs text-[#D14343]">
                  {errors.monthly_income}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Monthly expenses *
              </label>
              <input
                name="monthly_expenses"
                value={form.monthly_expenses}
                onChange={onChange}
                placeholder="60000"
                className={`${inputClassName} ${errors.monthly_expenses ? "border-[#D14343]" : ""}`}
              />
              {errors.monthly_expenses ? (
                <p className="mt-1 text-xs text-[#D14343]">
                  {errors.monthly_expenses}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Monthly loan outflow
              </label>
              <input
                name="loans"
                value={form.loans}
                onChange={onChange}
                placeholder="10000"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#294863]">
                Current investments
              </label>
              <input
                name="investments"
                value={form.investments}
                onChange={onChange}
                placeholder="700000"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-[14px] font-medium text-[#294863]">
              What are you planning for?
            </label>
            <div className="flex flex-wrap gap-3">
              {goalOptions.map((goal) => {
                const selected = form.goals.includes(goal);

                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => onToggleGoal(goal)}
                    className={`rounded-full border px-4 py-2 text-[14px] font-medium transition ${
                      selected
                        ? "border-[#0F4C81] bg-[#EAF5FD] text-[#0F4C81]"
                        : "border-[#D7E5F0] bg-white text-[#4C6277] hover:border-[#0F4C81]"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-[16px] bg-[#0F4C81] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#0B3258] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Generating your report..."
                : "Get my wellness score"}
            </button>
            <p className="text-[13px] leading-6 text-[#6B7E90]">
              This experience is designed to be quick, private, and useful. You
              can download the result immediately after submission.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
