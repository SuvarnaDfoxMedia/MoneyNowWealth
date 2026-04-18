"use client";

const NON_DIGIT_REGEX = /\D+/g;
const ALLOWED_CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

export const sanitizePhoneInputValue = (value: string) =>
  value.replace(NON_DIGIT_REGEX, "");

export const attachNumericOnlyPhoneBehavior = (
  input: HTMLInputElement,
  onValueChange?: (value: string) => void,
) => {
  const syncSanitizedValue = () => {
    const sanitizedValue = sanitizePhoneInputValue(input.value);

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    onValueChange?.(sanitizedValue);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (ALLOWED_CONTROL_KEYS.has(event.key)) {
      return;
    }

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleBeforeInput = (event: InputEvent) => {
    if (typeof event.data === "string" && /\D/.test(event.data)) {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData("text") ?? "";
    const sanitizedText = sanitizePhoneInputValue(pastedText);

    if (pastedText === sanitizedText) {
      return;
    }

    event.preventDefault();

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const nextValue =
      input.value.slice(0, start) + sanitizedText + input.value.slice(end);

    input.value = sanitizePhoneInputValue(nextValue);
    input.setSelectionRange(start + sanitizedText.length, start + sanitizedText.length);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("beforeinput", handleBeforeInput);
  input.addEventListener("paste", handlePaste);
  input.addEventListener("input", syncSanitizedValue);

  syncSanitizedValue();

  return () => {
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("beforeinput", handleBeforeInput);
    input.removeEventListener("paste", handlePaste);
    input.removeEventListener("input", syncSanitizedValue);
  };
};
