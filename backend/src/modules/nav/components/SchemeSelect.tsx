import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { formatDate, formatNav } from "../format";
import { useNavSchemes } from "../hooks";
import type { NavScheme } from "../types";

type SchemeSelectProps = {
  role: string;
  value: string;
  onChange: (schemeId: string) => void;
};

export default function SchemeSelect({
  role,
  value,
  onChange,
}: SchemeSelectProps) {
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    if (!value && schemes[0]?._id) {
      onChange(schemes[0]._id);
    }
  }, [onChange, schemes, value]);

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(100px,250px)_minmax(100px,250px)]">
      <div>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Fund, AMC, ISIN, code"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 shadow-sm transition focus:border-[#043f79] focus:outline-none focus:ring-3 focus:ring-[#043f79]/10"
          />
        </div>
      </div>
      <div>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm transition focus:border-[#043f79] focus:outline-none focus:ring-3 focus:ring-[#043f79]/10"
        >
          <option value="">
            {isLoading
              ? "Loading imported NAV schemes..."
              : "Select imported NAV scheme"}
          </option>
          {schemes.map((scheme) => (
            <option key={scheme._id} value={scheme._id}>
              {scheme.fund_name}
              {scheme.amc_id?.name ? ` - ${scheme.amc_id.name}` : ""}
              {/* {scheme.scheme_code ? ` - Code: ${scheme.scheme_code}` : ""} */}
              {scheme.isin ? ` - ISIN: ${scheme.isin}` : ""}
              {/* {` - ${formatNav(scheme.latestNav)} on ${formatDate(scheme.latestDate)}`} */}
            </option>
          ))}
        </select>
        {/* {selectedScheme ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
            {selectedScheme.amc_id?.name ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[#043f79]">
                {selectedScheme.amc_id.name}
              </span>
            ) : null}
            {selectedScheme.scheme_code ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                Code: {selectedScheme.scheme_code}
              </span>
            ) : null}
            {selectedScheme.isin ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                ISIN: {selectedScheme.isin}
              </span>
            ) : null}
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              {selectedScheme.navCount} NAV rows
            </span>
          </div>
        ) : null} */}
      </div>
    </div>
  );
}
