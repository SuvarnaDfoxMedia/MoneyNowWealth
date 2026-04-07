"use client";

import { useEffect, useRef } from "react";
import intlTelInput from "intl-tel-input";
import { attachNumericOnlyPhoneBehavior, sanitizePhoneInputValue } from "@/utils/phoneInput";

type IntlTelInputInstance = ReturnType<typeof intlTelInput>;

type UseIntlPhoneFieldOptions = {
  initialCountry?: string;
  separateDialCode?: boolean;
  autoPlaceholder?: "off" | "polite" | "aggressive";
};

export const useIntlPhoneField = (options?: UseIntlPhoneFieldOptions) => {
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<IntlTelInputInstance | null>(null);

  useEffect(() => {
    let detachNumericOnlyBehavior: (() => void) | undefined;

    if (phoneRef.current && !itiRef.current) {
      itiRef.current = intlTelInput(phoneRef.current, {
        initialCountry: options?.initialCountry || "in",
        preferredCountries: ["in"],
        separateDialCode: options?.separateDialCode ?? true,
        autoPlaceholder: options?.autoPlaceholder,
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.0/build/js/utils.js",
      });

      const container = phoneRef.current.closest(".iti");
      if (container) container.classList.add("w-full");
      detachNumericOnlyBehavior = attachNumericOnlyPhoneBehavior(phoneRef.current);
    }

    return () => {
      detachNumericOnlyBehavior?.();
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
    };
  }, [options?.autoPlaceholder, options?.initialCountry, options?.separateDialCode]);

  const getMobileValue = () =>
    sanitizePhoneInputValue(phoneRef.current?.value?.trim() || "");

  const getCountryCode = () => {
    const countryData = itiRef.current?.getSelectedCountryData();
    return countryData?.dialCode ? `+${countryData.dialCode}` : "+91";
  };

  const clearPhoneValue = () => {
    if (phoneRef.current) {
      phoneRef.current.value = "";
    }
  };

  const validateMobileNumber = () => {
    const mobileValue = getMobileValue();
    const selectedCountry =
      itiRef.current?.getSelectedCountryData()?.iso2 || "in";

    if (!mobileValue) return "Mobile number is required";
    if (!/^\d+$/.test(mobileValue)) {
      return "Please enter a valid mobile number";
    }

    if (selectedCountry === "in") {
      if (mobileValue.length !== 10) {
        return "Mobile number must be exactly 10 digits";
      }

      if (!/^[6-9]/.test(mobileValue)) {
        return "Indian mobile number must start with 6, 7, 8, or 9";
      }

      return "";
    }

    if (mobileValue.length < 6) return "Mobile number is too short";
    if (mobileValue.length > 15) return "Mobile number is too long";

    return "";
  };

  return {
    phoneRef,
    itiRef,
    getMobileValue,
    getCountryCode,
    clearPhoneValue,
    validateMobileNumber,
  };
};

export default useIntlPhoneField;
