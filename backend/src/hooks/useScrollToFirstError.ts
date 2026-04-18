import { RefObject, useCallback, useRef } from "react";

const getFirstErrorKeys = (errors: object) =>
  Object.entries(errors)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key]) => key);

const escapeSelector = (value: string) => {
  if (typeof window !== "undefined" && window.CSS?.escape) {
    return window.CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
};

const focusIfPossible = (element: HTMLElement | null) => {
  if (!element) return;
  if (typeof element.focus === "function") {
    try {
      element.focus({ preventScroll: true });
      return;
    } catch {
      element.focus();
    }
  }
};

const findTarget = (form: HTMLFormElement, field: string) => {
  const safeField = escapeSelector(field);
  const selectorCandidates = [
    `#${safeField}`,
    `[name="${safeField}"]`,
    `[data-field="${safeField}"]`,
    `[data-error-for="${safeField}"]`,
    `[aria-describedby="${safeField}-error"]`,
  ];

  for (const selector of selectorCandidates) {
    const element = form.querySelector<HTMLElement>(selector);
    if (element) return element;
  }

  return null;
};

export const useScrollToFirstError = <
  TForm extends HTMLFormElement = HTMLFormElement,
>() => {
  const formRef = useRef<TForm | null>(null);

  const scrollToFirstError = useCallback(
    (errors: object, overrideRef?: RefObject<TForm | null>) => {
      const errorFields = getFirstErrorKeys(errors);
      if (errorFields.length === 0) return;

      window.requestAnimationFrame(() => {
        const form = overrideRef?.current ?? formRef.current;
        if (!form) return;

        let target: HTMLElement | null = null;

        for (const field of errorFields) {
          target = findTarget(form, field);
          if (target) break;
        }

        if (!target) {
          target =
            form.querySelector<HTMLElement>("[class*='border-red-500']") ||
            form.querySelector<HTMLElement>("[class*='ring-red-500']") ||
            form.querySelector<HTMLElement>("[data-error-for]") ||
            form.querySelector<HTMLElement>("p.text-red-500");
        }

        if (!target) return;

        const focusable =
          target.matches("input, textarea, select, button, [tabindex]")
            ? target
            : target.querySelector<HTMLElement>(
                "input, textarea, select, button, [tabindex]",
              );

        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        focusIfPossible(focusable ?? target);
      });
    },
    [],
  );

  return { formRef, scrollToFirstError };
};

export default useScrollToFirstError;
