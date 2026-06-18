"use client";

import type { RefObject } from "react";
import { useMemo } from "react";
import StackedBarLineChart from "@/components/all charts/StackedBarLineChart";
import type { StackedBarLineChartDatum } from "@/components/all charts/StackedBarLineChart";
import StartSipReportDownload from "@/components/start-sip/charts-sub-components/StartSipReportDownload";
import StartSipChartBlock from "@/components/start-sip/charts-sub-components/StartSipChartBlock";
import { START_SIP_DEFAULT_VALUES } from "@/stores/startSipStore";

type JourneyFormState = {
  wealth_amount: number;
  user_sip_capacity: number;
  years: number;
  expected_return: number;
  inflation_rate: number;
};

type JourneyResultState = {
  target_wealth?: number;
  sip_amount?: number;
  invested_amount?: number;
  growth_amount?: number;
};

type AllocationItem = {
  label: string;
  value: number;
  share: number;
  color: string;
};

type ChartDataItem = StackedBarLineChartDatum & {
  year: number;
  label?: string;
};

type OneCroreJourneyResultProps = {
  activeResult: JourneyResultState;
  fallbackResult: Required<JourneyResultState>;
  form: JourneyFormState;
  hasCalculated: boolean;
  loading: boolean;
  metricItems?: Array<{ label: string; value: string }>;
  chartDataType?: string;
  oneCroreChartData: ChartDataItem[];
  allocationData: AllocationItem[];
  barChartRef: RefObject<HTMLDivElement | null>;
  pieChartRef: RefObject<HTMLDivElement | null>;
};

export default function OneCroreJourneyResult({
  activeResult,
  fallbackResult,
  form,
  hasCalculated,
  loading,
  metricItems: providedMetricItems,
  chartDataType,
  oneCroreChartData,
  allocationData,
  barChartRef,
  pieChartRef,
}: OneCroreJourneyResultProps) {
  const metricItems = useMemo(
    () =>
      providedMetricItems ?? [
        {
          label: "Monthly SIP Investment Required",
          value: `Rs. ${Number(activeResult?.sip_amount || 0).toLocaleString("en-IN")}`,
        },
        {
          label: "Total Amount invested through SIP",
          value: `Rs. ${Number(activeResult?.invested_amount || 0).toLocaleString("en-IN")}`,
        },
        {
          label: "Potential Total Growth amount",
          value: `Rs. ${Number(activeResult?.growth_amount || 0).toLocaleString("en-IN")}`,
        },
        {
          label: "Your Target Amount (Inflation Adjusted)",
          value: `Rs. ${Number(activeResult?.target_wealth || form.wealth_amount || 0).toLocaleString("en-IN")}`,
        },
      ],
    [activeResult, form.wealth_amount, providedMetricItems],
  );

  const summarySentence = useMemo(() => {
    if (!activeResult?.sip_amount) return null;

    return (
      <p className="text-[16px] text-[#000000] leading-7">
        At an assumed return of {form.expected_return}% over {form.years} years,
        you may need to invest about Rs.{" "}
        {Number(activeResult.sip_amount).toLocaleString("en-IN")} per month to
        work towards your goal of Rs.{" "}
        {Number(form.wealth_amount).toLocaleString("en-IN")}.
      </p>
    );
  }, [activeResult?.sip_amount, form.expected_return, form.wealth_amount, form.years]);

  const detailSentence = useMemo(() => {
    if (!activeResult?.invested_amount) return null;

    return (
      <p className="text-[14px] text-[#000000] leading-6">
        Total invested over this period: Rs.{" "}
        {Number(activeResult.invested_amount).toLocaleString("en-IN")}. Potential
        growth over your invested amount: Rs.{" "}
        {Number(activeResult.growth_amount || 0).toLocaleString("en-IN")},
        giving a projected future value of around Rs.{" "}
        {Number(activeResult.target_wealth || 0).toLocaleString("en-IN")}.
      </p>
    );
  }, [activeResult?.growth_amount, activeResult?.invested_amount, activeResult?.target_wealth]);

  const preResultDetailSentence = (
    <p className="text-[14px] text-[#000000] leading-6">
      Total invested over this period: Rs.{" "}
      {Number(fallbackResult.invested_amount).toLocaleString("en-IN")}.
      Potential growth over your invested amount: Rs.{" "}
      {Number(fallbackResult.growth_amount).toLocaleString("en-IN")}, giving a
      projected future value of around Rs.{" "}
      {Number(fallbackResult.target_wealth).toLocaleString("en-IN")}.
    </p>
  );

  return (
    <>
      <section className="rounded-[8px] bg-[#ffffff] p-4 shadow-[0_10px_20px_rgba(15,23,42,0.12)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-[24px] font-semibold leading-[60px] text-[#000000]">
              Your SIP journey, in simple numbers
            </h2>
            {!hasCalculated ? (
              <p className="mt-1 text-[16px] leading-[26px] mb-[15px]">
                Enter your assumptions and calculate the journey to see the
                required SIP, invested amount, growth, and future value.
              </p>
            ) : null}
          </div>
          {hasCalculated && activeResult?.sip_amount ? (
            <StartSipReportDownload
              title="Target Amount SIP Calculator"
              inputRows={[
                ["Target Amount", `Rs. ${Number(form.wealth_amount || 0).toLocaleString("en-IN")}`],
                ["Expected Return Rate", `${form.expected_return}%`],
                ["Time Period", `${form.years} Years`],
                ["Inflation Rate", `${form.inflation_rate}%`],
              ]}
              resultRows={[
                ["Monthly SIP Investment Required", `Rs. ${Number(activeResult.sip_amount || 0).toLocaleString("en-IN")}`],
                ["Total Amount Invested", `Rs. ${Number(activeResult.invested_amount || 0).toLocaleString("en-IN")}`],
                ["Potential Total Growth Amount", `Rs. ${Number(activeResult.growth_amount || 0).toLocaleString("en-IN")}`],
                ["Your Target Amount (Inflation Adjusted)", `Rs. ${Number(activeResult.target_wealth || 0).toLocaleString("en-IN")}`],
              ]}
              barChartRef={barChartRef}
              pieChartRef={pieChartRef}
              chartType="sip"
              className="rounded-[4px] bg-[#0E4A89] px-4 py-2 text-[12px] font-medium hover:bg-[#0A3C6F]"
            />
          ) : null}
        </div>

        {hasCalculated && loading ? (
          <div className="mt-6 rounded-[8px] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-slate-500">
            Calculating your SIP journey...
          </div>
        ) : null}

        {activeResult?.sip_amount ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {metricItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[14px] bg-[linear-gradient(90deg,#001D3A_0%,#043F79_100%)] py-6 px-4 shadow-[0_8px_18px_rgba(11,75,136,0.12)]"
                >
                  <p className="text-[13px] font-mediu text-[#ffffff]">
                    {item.label}
                  </p>
                  <p className="mt-4 text-[#ffffff] text-[20px] font-semibold leading-tight">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 text-[13px] leading-6 text-[#2D3748]">
              {summarySentence}
              {hasCalculated ? detailSentence : preResultDetailSentence}
            </div>
          </>
        ) : null}
      </section>

      {hasCalculated &&
      activeResult?.sip_amount &&
      chartDataType === "sip" &&
      oneCroreChartData.length > 0 ? (
        <section className="rounded-[8px] border border-[#E5E9EF] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] md:p-5">
          <div ref={barChartRef}>
            <StartSipChartBlock
              title="Your Target Amount Projection"
              copy="A simple year-by-year view showing the milestone target versus projected accumulation using the required SIP."
            >
              <StackedBarLineChart
                data={oneCroreChartData}
                height={380}
                xAxisDataKey="year"
                xAxisLabel="Year"
                xAxisTickFormatter={(value) => {
                  const year = Number(value);
                  const startYear = new Date().getFullYear();
                  const finalYear = startYear + form.years - 1;

                  return year === finalYear || (year - startYear) % 2 === 0
                    ? `${year}`
                    : "";
                }}
                tooltipLabelFormatter={(label) => `${label}`}
              />
            </StartSipChartBlock>
          </div>

          <div ref={pieChartRef} className="mt-5">
            <StartSipChartBlock
              title="Invested amount vs growth"
              copy="A simple breakdown of how much comes from your contribution versus potential growth."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {allocationData.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[8px] border border-[#E7E7E7] bg-[#FAFBFD] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="text-[14px] font-medium text-[#111111]">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 text-[22px] font-semibold text-[#111111]">
                      Rs. {Number(item.value).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-[13px] text-[#4B5563]">
                      {item.share}% of total projected amount
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EEF5]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.share, 100)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </StartSipChartBlock>
          </div>
        </section>
      ) : null}

    </>
  );
}
