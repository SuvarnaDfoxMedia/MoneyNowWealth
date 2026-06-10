export const getFieldErrorClassName = (hasError: boolean) =>
  hasError
    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
    : "";

export const getFieldErrorTextClassName = (
  spacingClassName = "mt-1",
  sizeClassName = "text-xs",
) => `${spacingClassName} ${sizeClassName} text-red-600`;
