"use client";

import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";

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

const leadInputClassName =
  "mt-2 h-[52px] w-full rounded-[6px] border border-[#D8DEE8] bg-white px-4 text-[16px] text-[#111111] outline-none transition placeholder:text-[#7A7A7A] focus:border-[#7FAFE5] focus:ring-0";

type OneCroreJourneyLeadFormProps = {
  lead: LeadState;
  setLead: Dispatch<SetStateAction<LeadState>>;
  leadErrors: LeadErrors;
  setLeadErrors: Dispatch<SetStateAction<LeadErrors>>;
  submitLoading: boolean;
  leadSubmitted: boolean;
  phoneRef: RefObject<HTMLInputElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMobileChange: () => void;
  onMobileBlur: () => void;
};

export default function OneCroreJourneyLeadForm({
  lead,
  setLead,
  leadErrors,
  setLeadErrors,
  submitLoading,
  leadSubmitted,
  phoneRef,
  onSubmit,
  onMobileChange,
  onMobileBlur,
}: OneCroreJourneyLeadFormProps) {
  return (
    <section className="rounded-[8px] bg-[linear-gradient(135deg,#0E4A89_0%,#072B52_100%)] p-5 text-white shadow-[0_10px_30px_rgba(8,40,80,0.18)]">
      <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
        Want this plan in your inbox?
      </h2>
      <p className="mt-3 max-w-[560px] text-[15px] leading-7 text-white/88">
        We&apos;ll send you a simple summary of your SIP journey and an option
        to talk to a Moneynow executive.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
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
              <p className="mt-2 text-sm text-red-500">{leadErrors.name}</p>
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
              <p className="mt-2 text-sm text-red-500">{leadErrors.email}</p>
            ) : null}
          </div>

          <div className="one-crore-phone-field w-full mb-0 pb-0">
            <label className="block text-[14px] mb-2 font-medium text-white">
              Mobile number <span className="text-red-500">*</span>
            </label>
            <input
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={onMobileChange}
              onBlur={onMobileBlur}
              placeholder="Enter mobile number"
              className={`${leadInputClassName} !pl-[90px] ${
                leadErrors.mobile ? "border-red-500" : ""
              }`}
            />
            {leadErrors.mobile ? (
              <p className="mt-2 text-sm text-red-500">{leadErrors.mobile}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-1 md:flex-row md:items-center md:justify-between">
          <label className="flex items-start gap-3 text-[15px] leading-7 text-white/92">
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
            <span>
              I&apos;d like a Moneynow advisor to walk me through this on a
              quick call.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitLoading}
            className="min-w-[180px] whitespace-nowrap rounded-[6px] bg-white px-6 py-3 text-[16px] font-medium text-[#0E4A89] transition hover:bg-[#F4F7FB] disabled:opacity-60"
          >
            {submitLoading ? "Sending..." : "Send me this plan"}
          </button>
        </div>

        {leadSubmitted ? (
          <div className="rounded-[8px] border border-[#C8E6D4] bg-[#F2FBF6] px-4 py-3 text-sm text-[#17663A]">
            Your SIP journey summary is on its way to your email. You can now
            book a discovery call or explore other journeys.
          </div>
        ) : null}
        {leadErrors.submit ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {leadErrors.submit}
          </div>
        ) : null}
      </form>
    </section>
  );
}
