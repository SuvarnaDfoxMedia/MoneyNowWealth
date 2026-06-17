import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavSchemes } from "../hooks";
import type { NavScheme } from "../types";

type SchemeSelectProps = {
  role: string;
  value: string;
  onChange: (schemeId: string) => void;
};

const buildSchemeLabel = (scheme: NavScheme) => {
  const parts = [scheme.fund_name];

  if (scheme.amc_id?.name) parts.push(scheme.amc_id.name);
  if (scheme.scheme_code) parts.push(`Code: ${scheme.scheme_code}`);
  if (scheme.isin) parts.push(`ISIN: ${scheme.isin}`);

  return parts.join(" - ");
};

export default function SchemeSelect({
  role,
  value,
  onChange,
}: SchemeSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useNavSchemes(role, {
    search,
    page: 1,
    limit: 50,
  });

  const schemes = useMemo<NavScheme[]>(() => data?.data ?? [], [data?.data]);
  const selectedScheme = useMemo(
    () => schemes.find((scheme) => scheme._id === value),
    [schemes, value],
  );
  const selectedLabel = selectedScheme ? buildSchemeLabel(selectedScheme) : "";

  useEffect(() => {
    if (!value && schemes[0]?._id) {
      onChange(schemes[0]._id);
    }
  }, [onChange, schemes, value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative w-full min-w-[320px] max-w-[520px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-[#043f79] focus:outline-none focus:ring-3 focus:ring-[#043f79]/10"
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedLabel ||
            (isLoading ? "Loading imported NAV schemes..." : "Select imported NAV scheme")}
        </span>
        <span className="flex items-center gap-2 text-gray-400">
          {isLoading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-[#043f79]" />
          ) : null}
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Fund, AMC, ISIN, code"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 shadow-sm transition focus:border-[#043f79] focus:outline-none focus:ring-3 focus:ring-[#043f79]/10"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Search by fund name, AMC, scheme code, or ISIN.
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {schemes.length > 0 ? (
              schemes.map((scheme) => (
                <button
                  key={scheme._id}
                  type="button"
                  onClick={() => {
                    onChange(scheme._id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-blue-50 ${
                    value === scheme._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {scheme.fund_name}
                      </p>
                      <p className="mt-1 whitespace-normal break-words text-xs leading-5 text-gray-500">
                        {buildSchemeLabel(scheme)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      {scheme.navCount} NAVs
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No imported NAV schemes match this search.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
