"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mfService } from "@/services/mfService";
import { useRefreshSignal } from "@/hooks/useRefreshSignal";

import { mapMFFundToFundCardProps } from "@/components/fund-card/mapMFFundToFundCardProps";
import SchemeHeroCard from "@/components/fund-card/SchemeHeroCard";
import InvestmentObjectiveCard from "@/components/fund-card/InvestmentObjectiveCard";
import FundDetailsCard from "@/components/fund-card/FundDetailsCard";
import ReturnsComparisonTable from "@/components/fund-card/ReturnsComparisonTable";
import NavMovementChart from "@/components/fund-card/NavMovementChart";
import HoldingsSplitTable from "@/components/fund-card/HoldingsSplitTable";
import SectorAllocationTable from "@/components/fund-card/SectorAllocationTable";
import AssetAllocationChart from "@/components/fund-card/AssetAllocationChart";
import PortfolioStatsPanel from "@/components/fund-card/PortfolioStatsPanel";
import PeerComparisonTable from "@/components/fund-card/PeerComparisonTable";

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [fund, setFund] = useState<any | null>(null);
  const [navHistory, setNavHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTick } = useRefreshSignal();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [res, navRes] = await Promise.all([
          mfService.getFundById(id),
          mfService.getFundNavHistory(id, { days: 365 }).catch(() => ({ data: [] }))
        ]);
        setFund(res?.data || res || null);
        setNavHistory(navRes?.data || navRes || []);
      } catch {
        setFund(null);
        setNavHistory([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, refreshTick]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#043F79]/20 border-t-[#043F79] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading Fund Details…</p>
        </div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-600 font-semibold text-lg mb-2">
            Fund not found
          </p>
          <button
            onClick={() => router.back()}
            className="text-[#043F79] underline text-sm"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const props = mapMFFundToFundCardProps(fund);

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-[Poppins,sans-serif]">
      {/* ── Header / Back Nav ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#043F79] via-[#0a5ba5] to-[#1475c4] text-white px-4 sm:px-6 pt-4 pb-2">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-[13px] mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Funds
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <SchemeHeroCard
          schemeName={props.schemeName}
          amcName={props.amcName}
          category={props.category}
          benchmark={props.benchmarkName}
          planType={props.planType}
          optionType={props.optionType}
          schemeAssets={props.aum}
          schemeManager={props.fundManager}
          nav={props.nav}
          navDate={props.navDate}
          navChange={props.navChange}
          navChangePct={props.navChangePct}
          exitLoad={props.exitLoad}
          rating={props.rating}
          ratingValue={props.ratingValue}
          riskometer={props.riskometerLabel}
          isin={props.isin}
          schemeCode={props.schemeCode}
        />

        <InvestmentObjectiveCard
          schemeObjective={props.fundObjective}
        />

        <FundDetailsCard
          inceptionDate={props.launchDate}
          expenseRatio={props.expenseRatio}
          minimumInvestment={props.minInvestment}
          minimumTopup={props.minLumpsum}
          sipMinimum={props.minSip}
          riskStatus={props.riskometerLabel}
          returnsSinceInception={props.returnsSinceInception}
          upmarketCapture={props.upmarketCapture}
          downmarketCapture={props.downmarketCapture}
          schemeTurnover={props.schemeTurnover != null ? `${props.schemeTurnover}%` : null}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold tracking-tight text-slate-800">
            Performance Returns
          </h2>
          <ReturnsComparisonTable
            performanceList={props.performanceList}
            rankWithinCategory={null}
            totalFundsInCategory={null}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <NavMovementChart 
            history={navHistory} 
            isLoading={loading}
            selectedDays={365}
            onPeriodChange={() => {}}
            currentNav={props.nav}
            navDate={props.navDate}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <HoldingsSplitTable holdings={props.topHoldings} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectorAllocationTable holdings={props.topHoldings} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <AssetAllocationChart
              assetAllocation={{
                domestic_equity_pct: props.domesticEquityPct,
                international_equity_pct: props.internationalEquityPct,
                debt_pct: props.debtPct,
                cash_pct: props.cashPct,
                gold_pct: props.goldPct,
                other_pct: props.otherPct,
              }}
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <PortfolioStatsPanel
              marketCapLargecapPct={props.largeCapPct}
              marketCapMidcapPct={props.midCapPct}
              marketCapSmallcapPct={props.smallCapPct}
              volatility3y={props.stdDev}
              volatility5y={props.stdDev5y}
              sharpeRatio3y={props.sharpe}
              sharpeRatio5y={props.sharpe5y}
              alpha1y={props.alpha}
              alpha3y={props.alpha3y}
              alpha5y={props.alpha5y}
              beta1y={props.beta}
              beta3y={props.beta3y}
              beta5y={props.beta5y}
              sortino={props.sortino}
              ytm={props.yieldToMaturity}
              avgMaturity={props.averageMaturity}
              maxDrawdown5y={props.maxDrawdown5y}
              maxDrawdown10y={props.maxDrawdown10y}
              turnoverRatio={props.schemeTurnover}
              upmarketCapture={props.upmarketCapture}
              downmarketCapture={props.downmarketCapture}
              assetAllocation={{
                domestic_equity_pct: props.domesticEquityPct,
                international_equity_pct: props.internationalEquityPct,
                debt_pct: props.debtPct,
                other_pct: props.otherPct,
                gold_pct: props.goldPct,
                cash_pct: props.cashPct,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
          <PeerComparisonTable
            peers={props.peerList}
          />
        </div>
      </div>
    </div>
  );
}
