"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import {
  executeRecaptcha,
  mountRecaptcha,
  unmountRecaptcha,
} from "@/lib/recaptcha";

type IntlTelInputInstance = ReturnType<typeof intlTelInput>;

const statusOptions = [
  "I am an individual mutual fund distributor / IFA (ARN holder)",
  "I run a small distribution / wealth firm",
  "I am planning to become a mutual fund distributor (not yet ARN holder)",
  "AMFI Registration Number (ARN)",
];

interface FormState {
  full_name: string;
  email: string;
  city: string;
  organisation_name: string;
  current_status: string;
  arn_number: string;
  terms_accepted: boolean;
}

interface ErrorsState {
  full_name?: string;
  email?: string;
  mobile?: string;
  city?: string;
  current_status?: string;
  terms_accepted?: string;
  submit?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const inputClassName =
  "h-[50px] w-full rounded-[3px] border border-[#D7D7D7] bg-[#F8F8F8] px-3 text-[14px] text-[#1F1F1F] outline-none transition focus:border-[#0B4D8B]";
const labelClassName =
  "mb-1.5 block text-[15px] font-normal leading-5 text-[#1F1F1F]";
const PARTNER_RECAPTCHA_ACTION = "partner_with_us_submit";

const hasAlphabet = (value: string) => /[A-Za-z]/.test(value);

const PartnerForm = () => {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<IntlTelInputInstance | null>(null);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    city: "",
    organisation_name: "",
    current_status: "",
    arn_number: "",
    terms_accepted: false,
  });
  const [errors, setErrors] = useState<ErrorsState>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (phoneRef.current && !itiRef.current) {
      try {
        itiRef.current = intlTelInput(phoneRef.current, {
          initialCountry: "in",
          separateDialCode: true,
          autoPlaceholder: "off",
          utilsScript:
            "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
        });

        const container = phoneRef.current.closest(".iti");
        if (container) container.classList.add("w-full");
      } catch (error) {
        console.error("Error initializing intl-tel-input:", error);
      }
    }

    return () => {
      if (itiRef.current) {
        try {
          itiRef.current.destroy();
        } catch (error) {
          console.error("Error destroying intl-tel-input:", error);
        }
        itiRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    mountRecaptcha().catch((error) => {
      if (!isMounted) return;
      console.error("Failed to initialize reCAPTCHA:", error);
    });

    return () => {
      isMounted = false;
      unmountRecaptcha();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof ErrorsState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: undefined }));
    }
  };

  const validateMobileNumber = () => {
    const mobileValue = phoneRef.current?.value?.trim() || "";
    const normalizedMobile = mobileValue.replace(/[\s\-().]/g, "");
    const mobileDigits = normalizedMobile.replace(/\D/g, "");
    const selectedCountry =
      itiRef.current?.getSelectedCountryData()?.iso2 || "in";

    if (!mobileValue) return "Mobile number is required";
    if (hasAlphabet(normalizedMobile)) {
      return "Mobile number must contain digits only";
    }
    if (!/^\+?\d+$/.test(normalizedMobile)) {
      return "Please enter a valid mobile number";
    }

    if (selectedCountry === "in") {
      if (mobileDigits.length !== 10) {
        return "Mobile number must be exactly 10 digits";
      }
      if (!/^[6-9]/.test(mobileDigits)) {
        return "Indian mobile number must start with 6, 7, 8, or 9";
      }
      return "";
    }

    if (mobileDigits.length < 6) return "Mobile number is too short";
    if (mobileDigits.length > 15) return "Mobile number is too long";

    return "";
  };

  const handleMobileChange = () => {
    if (errors.mobile || errors.submit) {
      setErrors((prev) => ({ ...prev, mobile: undefined, submit: undefined }));
    }
  };

  const handleMobileBlur = () => {
    const mobileValue = phoneRef.current?.value?.trim() || "";

    if (!mobileValue) {
      setErrors((prev) => ({ ...prev, mobile: undefined }));
      return;
    }

    const mobileError = validateMobileNumber();
    setErrors((prev) => ({ ...prev, mobile: mobileError || undefined }));
  };

  const validateForm = () => {
    const newErrors: ErrorsState = {};
    const mobileError = validateMobileNumber();

    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (mobileError) newErrors.mobile = mobileError;
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.current_status) {
      newErrors.current_status = "Please select your current status";
    }
    if (!form.terms_accepted) {
      newErrors.terms_accepted = "You must agree before submitting";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setErrors((prev) => ({ ...prev, submit: undefined }));
    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha(PARTNER_RECAPTCHA_ACTION);
      const mobile = phoneRef.current?.value?.trim() || "";
      const countryData = itiRef.current?.getSelectedCountryData();
      const countryCode = countryData?.dialCode
        ? `+${countryData.dialCode}`
        : "+91";

      const payload = {
        ...form,
        mobile,
        country_code: countryCode,
        recaptcha_token: recaptchaToken,
      };

      const response = await fetch(`${API_BASE}/api/partner-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setForm({
        full_name: "",
        email: "",
        city: "",
        organisation_name: "",
        current_status: "",
        arn_number: "",
        terms_accepted: false,
      });

      if (phoneRef.current) {
        phoneRef.current.value = "";
      }

      setErrors({});
      router.push("/thank-You");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error &&
          error.message.includes("NEXT_PUBLIC_RECAPTCHA_SITE_KEY")
            ? "Captcha is not configured. Please contact support."
            : "Failed to submit. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[12px] border border-[#E2E2E2] bg-white px-5 py-6 shadow-[0_4px_18px_rgba(0,0,0,0.12)] md:px-8 md:py-7">
      <h3 className="mb-6 text-center text-[18px] font-semibold leading-tight text-[#043F79] md:text-[20px]">
        Share a few basic details and our team will get in touch.
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="full_name" className={labelClassName}>
              Full name <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              className={`${inputClassName} ${errors.full_name ? "border-red-500" : ""}`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelClassName}>
              Email <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`${inputClassName} ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="partner_mobile" className={labelClassName}>
              Mobile number <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="partner_mobile"
              ref={phoneRef}
              type="tel"
              onChange={handleMobileChange}
              onBlur={handleMobileBlur}
              className={`${inputClassName} ${errors.mobile ? "border-red-500" : ""}`}
            />
            {errors.mobile && (
              <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className={labelClassName}>
              City <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              className={`${inputClassName} ${errors.city ? "border-red-500" : ""}`}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-500">{errors.city}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="organisation_name" className={labelClassName}>
            Organisation name (if any)
          </label>
          <input
            id="organisation_name"
            name="organisation_name"
            type="text"
            value={form.organisation_name}
            onChange={handleChange}
            className={inputClassName}
          />
        </div>

        <div className="pt-4 pb-0">
          <p className={labelClassName}>
            Current status <span className="text-[#D7263D]">*</span>
          </p>
          <div className="space-y-[5px]">
            {statusOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-[22px] "
              >
                <input
                  type="radio"
                  name="current_status"
                  value={option}
                  checked={form.current_status === option}
                  onChange={handleChange}
                  className="mt-1 h-[16px] w-[16px] border-[#BDBDBD] text-[#0B4D8B]"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {errors.current_status && (
            <p className="mt-1 text-[14px] text-red-500">
              {errors.current_status}
            </p>
          )}
        </div>

        <div className="pl-[26px]">
          <div className="max-w-[302px]">
            <input
              name="arn_number"
              type="text"
              value={form.arn_number}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <p className="mt-2 text-[12px] leading-4 ">
            If already available, else leave it blank
          </p>
        </div>

        <div className="pt-3">
          <label className="flex items-start gap-2.5  text-[15px] leading-[25px] text-[#1F1F1F]">
            <input
              id="terms_accepted"
              name="terms_accepted"
              type="checkbox"
              checked={form.terms_accepted}
              onChange={handleChange}
              className="mt-0 h-[30px] w-[30px] rounded-[2px] border-[#BDBDBD] text-[#0B4D8B]"
            />
            <span>
              By submitting this form, you agree to be contacted by the Moneynow
              team to discuss a potential distributor partnership. This is not
              an offer or commitment to appoint you as a distributor or
              sub-distributor.
            </span>
          </label>
          {errors.terms_accepted && (
            <p className="mt-1 text-xs text-red-500">{errors.terms_accepted}</p>
          )}
        </div>

        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-[145px] items-center justify-center rounded-[4px] bg-[#043F79] px-[40px] py-[14px] text-[16px] font-medium text-[#ffffff] transition hover:bg-[#083b6b]"
          >
            {loading ? "Submitting..." : "Submit interest"}
          </button>
        </div>

        {errors.submit && (
          <p className="text-center text-sm text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};

export default PartnerForm;
