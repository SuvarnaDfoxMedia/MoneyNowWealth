const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v3";
const RECAPTCHA_BASE_URL = "https://www.google.com/recaptcha/api.js";
const RECAPTCHA_BADGE_SELECTOR = ".grecaptcha-badge";

let activeConsumers = 0;
let scriptLoadPromise: Promise<void> | null = null;

const getSiteKey = () => process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || "";

const loadRecaptchaScript = (siteKey: string): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("reCAPTCHA can only run in the browser"));
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(
    RECAPTCHA_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existingScript) {
    if (!scriptLoadPromise) {
      scriptLoadPromise = new Promise((resolve, reject) => {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load reCAPTCHA script")),
          { once: true },
        );
      });
    }

    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `${RECAPTCHA_BASE_URL}?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

const waitForGrecaptcha = (): Promise<Grecaptcha> =>
  new Promise((resolve, reject) => {
    const recaptcha = window.grecaptcha;
    if (!recaptcha) {
      reject(new Error("reCAPTCHA is unavailable"));
      return;
    }

    recaptcha.ready(() => resolve(recaptcha));
  });

export const executeRecaptcha = async (action: string): Promise<string> => {
  const siteKey = getSiteKey();

  if (!siteKey) {
    throw new Error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
  }

  await loadRecaptchaScript(siteKey);
  const recaptcha = await waitForGrecaptcha();

  return recaptcha.execute(siteKey, { action });
};

const setBadgeVisibility = (isVisible: boolean) => {
  if (typeof document === "undefined") return;

  document.querySelectorAll<HTMLElement>(RECAPTCHA_BADGE_SELECTOR).forEach((badge) => {
    badge.style.visibility = isVisible ? "visible" : "hidden";
    badge.style.opacity = isVisible ? "1" : "0";
    badge.style.pointerEvents = isVisible ? "auto" : "none";
  });
};

const removeRecaptchaArtifacts = () => {
  if (typeof document === "undefined") return;

  document
    .querySelectorAll(`${RECAPTCHA_BADGE_SELECTOR}, iframe[src*="recaptcha"]`)
    .forEach((node) => node.remove());
};

export const mountRecaptcha = async () => {
  const siteKey = getSiteKey();

  if (!siteKey) {
    throw new Error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
  }

  activeConsumers += 1;
  await loadRecaptchaScript(siteKey);
  setBadgeVisibility(true);
};

export const unmountRecaptcha = () => {
  activeConsumers = Math.max(0, activeConsumers - 1);

  if (activeConsumers > 0) {
    return;
  }

  const script = document.getElementById(RECAPTCHA_SCRIPT_ID);
  if (script) {
    script.remove();
  }

  removeRecaptchaArtifacts();
  scriptLoadPromise = null;
  if (typeof window !== "undefined") {
    delete window.grecaptcha;
  }
};
