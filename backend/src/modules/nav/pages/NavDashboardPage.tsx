import { useState } from "react";
import { useParams } from "react-router-dom";
import ChartCard from "../components/ChartCard";
import NavImportActions from "../components/NavImportActions";
import PageHeader from "../components/PageHeader";
import SchemeSelect from "../components/SchemeSelect";
import StatCard from "../components/StatCard";
import {
  formatDate,
  formatNav,
  formatPercent,
  toneClassForReturn,
} from "../format";
import { useScheme } from "../../schemes/hooks";
import { useLatestNav, useNavHistory, useReturns } from "../hooks";

const statTone = (value?: number | null) =>
  value && value > 0 ? "positive" : value && value < 0 ? "negative" : "neutral";

export default function NavDashboardPage() {
  const { role = "admin" } = useParams();
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const schemeId = selectedSchemeId;

  const latestQuery = useLatestNav(role, schemeId);
  const returnsQuery = useReturns(role, schemeId);
  const historyQuery = useNavHistory(role, schemeId, { page: 1, limit: 120 });
  const selectedSchemeQuery = useScheme(role, schemeId);

  const latest = latestQuery.data?.data?.latest;
  const previous = latestQuery.data?.data?.previous;
  const change = latestQuery.data?.data?.change;
  const returns = returnsQuery.data?.data;
  const selectedScheme = selectedSchemeQuery.data?.data;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="NAV Dashboard"
        actions={
          <>
            <SchemeSelect
              role={role}
              value={schemeId}
              onChange={(value) => setSelectedSchemeId(value)}
            />
            <NavImportActions
              role={role}
              onImported={async () => {
                await latestQuery.refetch();
                await returnsQuery.refetch();
                await historyQuery.refetch();
              }}
            />
          </>
        }
      />

      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="mt-1 truncate text-base font-semibold text-gray-900">
              {selectedScheme?.fund_name ||
                (schemeId
                  ? "Loading scheme..."
                  : "Import NAV data or select an imported NAV scheme")}
            </p>
          </div>
          {selectedScheme ? (
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {selectedScheme.amc_id?.name ? (
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[#043f79]">
                  {selectedScheme.amc_id.name}
                </span>
              ) : null}
              {selectedScheme.scheme_code ? (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700">
                  Code: {selectedScheme.scheme_code}
                </span>
              ) : null}
              {selectedScheme.isin ? (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700">
                  ISIN: {selectedScheme.isin}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current NAV"
          value={formatNav(latest?.nav)}
          meta={formatDate(latest?.date)}
        />
        <StatCard
          label="Previous NAV"
          value={formatNav(previous?.nav)}
          meta={formatDate(previous?.date)}
        />
        <StatCard
          label="% Change"
          value={formatPercent(change)}
          meta="Versus previous available NAV"
          tone={statTone(change)}
        />
        <StatCard
          label="1Y Return"
          value={formatPercent(returns?.y1.value)}
          meta={
            returns?.y1.pastDate
              ? `Since ${formatDate(returns.y1.pastDate)}`
              : "History unavailable"
          }
          tone={statTone(returns?.y1.value)}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <ChartCard
          title="NAV Trend"
          data={historyQuery.data?.data ?? []}
          loading={historyQuery.isLoading}
        />
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Returns</h2>
          <div className="mt-4 space-y-4">
            {[
              ["1 Day", returns?.d1.value, returns?.d1.pastDate],
              ["1 Month", returns?.m1.value, returns?.m1.pastDate],
              ["1 Year", returns?.y1.value, returns?.y1.pastDate],
            ].map(([label, value, date]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {typeof date === "string"
                      ? formatDate(date)
                      : "Historical NAV unavailable"}
                  </p>
                </div>
                <p
                  className={`text-lg font-semibold ${toneClassForReturn(value as number | null)}`}
                >
                  {formatPercent(value as number | null)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
