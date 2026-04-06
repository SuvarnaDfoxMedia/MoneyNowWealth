"use client";

import { useEffect } from "react";
import { mountRecaptcha, unmountRecaptcha } from "@/lib/recaptcha";

export const useRecaptchaLifecycle = () => {
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
};

export default useRecaptchaLifecycle;
