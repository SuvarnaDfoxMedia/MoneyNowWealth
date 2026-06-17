import React from "react";

// 1. Define the interface for a single dynamic field configuration item
export interface FieldItem {
  key: string;
  label: string;
  type: "number" | "text" | "select";
  options?: { value: string; label: string }[]; // Optional properties for dropdowns if needed
}

// 2. Define the props that this form component requires
interface CalculatorFormProps {
  fields: FieldItem[];
  values: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function CalculatorForm({ fields, values, onFieldChange }: CalculatorFormProps) {
  if (!fields || fields.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-slate-500">
        No configurations available for this calculator.
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${
        fields.length > 3 ? "lg:grid-cols-2" : "lg:grid-cols-3"
      }`}
    >
      {fields.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-4 block text-[16px] font-medium text-[#1A1A1A]">
            {field.label}
          </span>
          <input
            type={field.type}
            value={values[field.key] ?? ""}
            onChange={(event) =>
              onFieldChange(
                field.key,
                field.type === "number" ? Number(event.target.value) : event.target.value
              )
            }
            className="h-[58px] w-full rounded-[4px] border border-[#E2E2E2] bg-white px-4 text-[18px] outline-none transition focus:border-[#0B3B6E]"
          />
        </label>
      ))}
    </div>
  );
}