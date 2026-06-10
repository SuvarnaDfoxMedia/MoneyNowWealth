"use client";

import { CalculatorTab } from "@/hooks/useCalculator";

interface StartSipCalculatorListProps {
  items: CalculatorTab[];
  activeItem: CalculatorTab;
  onSelect: (item: CalculatorTab) => void;
}

export default function StartSipCalculatorList({
  items,
  activeItem,
  onSelect,
}: StartSipCalculatorListProps) {
  return (
    <aside className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 h-fit">
      <p className="text-sm uppercase tracking-[0.25em] text-[#0A4A86] mb-4">
        Calculators
      </p>
      <div className="max-h-[620px] overflow-y-auto pr-1">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item}>
              <button
                onClick={() => onSelect(item)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition ${
                  activeItem === item
                    ? "bg-[#0A4A86] text-white font-semibold"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
