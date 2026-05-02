"use client";

import type { Dispatch, SetStateAction } from "react";

type OneCroreFormState = {
  wealth_amount: number;
  user_sip_capacity: number;
  years: number;
  expected_return: number;
  inflation_rate: number;
};

const RETURN_PRESETS = [
  { label: "Conservative", value: 8 },
  { label: "Balanced", value: 11 },
  { label: "Growth-Oriented", value: 13 },
] as const;

const inputClassName =
  "mt-3 h-[54px] w-full rounded-[6px] border border-[#E2E8F0] bg-white px-4 text-[15px] text-[#1A1A1A] outline-none transition focus:border-[#0B3B6E]";

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
    <div className="rounded-[8px] border border-[#F0F0F0] bg-[#FAFCFE] p-4">
      <label className="block text-[18px] font-medium text-[#000000]">
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
      <div className="mt-2 flex items-center justify-between text-[14px] text-[#6B7280]">
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
      <p className="mt-3 text-[14px] leading-5 text-[#000]">{hint}</p>
    </div>
  );
}

type OneCroreJourneyFormProps = {
  form: OneCroreFormState;
  loading: boolean;
  error?: string | null;
  onCalculate: () => void;
  onFormChange: Dispatch<SetStateAction<OneCroreFormState>>;
};

export default function OneCroreJourneyForm({
  form,
  loading,
  error,
  onCalculate,
  onFormChange,
}: OneCroreJourneyFormProps) {
  return (
    <section className="rounded-[8px] bg-[#ffffff] p-4 shadow-[0_10px_20px_rgba(15,23,42,0.12)] md:py-[30px] px-[20px]">
      <p className="text-[16px] text-[#000000]">
        See how your SIP can grow towards Rs.1crore and beyond
      </p>
      <h2 className="text-[32px] mb-[30px] font-semibold leading-[60px] text-[#000000]">
        Tell us what you’re aiming for
      </h2>

      <div className="space-y-4">
        <JourneyField
          label="What amount are you aiming for?"
          hint="You can adjust this to any goal amount - your first Rs 50L, Rs 1 Crore, Rs 2 Crore or more."
          value={form.wealth_amount}
          min={2500000}
          max={100000000}
          step={50000}
          prefix="Rs. "
          onChange={(value) =>
            onFormChange((prev) => ({ ...prev, wealth_amount: value }))
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
            onFormChange((prev) => ({ ...prev, user_sip_capacity: value }))
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
            onFormChange((prev) => ({ ...prev, years: value }))
          }
        />

        <div className="rounded-[8px] border border-[#E7EDF3] bg-[#FAFCFE] p-4">
          <label className="block text-[14px] font-medium text-[#000]">
            What rate of return would you expect your SIP investment to
            generate (% per annum)
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            {RETURN_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onFormChange((prev) => ({
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
                onFormChange((prev) => ({
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
          <p className="mt-3 text-[14px] leading-[24px] text-[#000]">
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
            onFormChange((prev) => ({ ...prev, inflation_rate: value }))
          }
        />

        <div className="pt-1">
          <button
            type="button"
            onClick={onCalculate}
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
  );
}
