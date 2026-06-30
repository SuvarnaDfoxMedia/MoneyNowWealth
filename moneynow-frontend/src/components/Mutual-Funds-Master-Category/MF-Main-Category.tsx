"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useFetchMFData } from "../../hooks/useFetchMFcategeory";
import { usePopularFunds } from "../../hooks/usePopularFunds";
import { useRouter } from "next/navigation";
import { useNfoFunds } from "../../hooks/useNfoFunds";
import { returnColor } from "@/components/fund-card/MfApiSchemeViewTypes";

const MAIN_TABS = ["Categories", "Popular Funds", "New Fund Offers"];

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | null;
};

type TableRow = {
  id?: string;
  name: string;
  y3: string;
  y5: string;
  y10: string;
  is_featured?: boolean;
};

type FundReturnShape = {
  trailing?: Record<string, number | null>;
  y3_cagr?: number | null;
  y5_cagr?: number | null;
  y10_cagr?: number | null;
};

const getTrailingReturn = (
  returns: FundReturnShape | undefined,
  key: "3y" | "5y" | "10y",
  legacyKey: "y3_cagr" | "y5_cagr" | "y10_cagr",
) => returns?.trailing?.[key] ?? returns?.[legacyKey] ?? null;

const parseReturn = (value: string) => {
  const numericValue = Number.parseFloat(String(value));
  return value === "-" || Number.isNaN(numericValue) ? -999 : numericValue;
};

const sortFeaturedFirst = (rows: TableRow[], sortKey: string) => {
  const byReturnKey = (row: TableRow) => {
    if (sortKey === "y5") return parseReturn(row.y5);
    if (sortKey === "y10") return parseReturn(row.y10);
    return parseReturn(row.y3);
  };

  return [...rows].sort((a, b) => {
    if (!!a.is_featured !== !!b.is_featured) {
      return a.is_featured ? -1 : 1;
    }

    const returnDiff = byReturnKey(b) - byReturnKey(a);
    if (returnDiff !== 0) return returnDiff;

    return a.name.localeCompare(b.name);
  });
};

const formatReturnValue = (value: string) => (value === "-" ? "-" : `${value}%`);

const SortIcons = ({
  columnKey,
  sortConfig,
}: {
  columnKey: string;
  sortConfig: SortConfig;
}) => {
  const isActive = sortConfig.key === columnKey;
  const isAsc = isActive && sortConfig.direction === "asc";
  const isDesc = isActive && sortConfig.direction === "desc";

  return (
    <div className="flex flex-col ml-2 -space-y-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
      <ChevronUp
        size={14}
        strokeWidth={3}
        className={`${isAsc ? "text-[#043F79]" : "text-gray-400"}`}
      />
      <ChevronDown
        size={14}
        strokeWidth={3}
        className={`${isDesc ? "text-[#043F79]" : "text-gray-400"}`}
      />
    </div>
  );
};

export default function MFMainCategory() {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState("Categories");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: null,
  });

  const itemsPerPage = 10;
  const isPopularTab = activeMainTab === "Popular Funds";
  const isNfoTab = activeMainTab === "New Fund Offers";

  const {
    masterCategories,
    fundData,
    loading,
    error,
    availableSubTabs,
    subTabDescriptions,
  } = useFetchMFData(activeCategory, activeSubTab);
  const { popularFunds, loading: popularLoading, error: popularError } =
    usePopularFunds({
      limit: 50,
    });
  const { nfos, loading: nfoLoading, error: nfoError } = useNfoFunds({
    isOpen: true,
    limit: 100,
    sortBy: "subscription_end_date",
    sortOrder: "asc",
  });

  useEffect(() => {
    if (masterCategories.length > 0 && activeCategory === "") {
      setActiveCategory(masterCategories[0].name);
      setActiveSubTab("");
    }
  }, [masterCategories, activeCategory]);

  useEffect(() => {
    if (isPopularTab || isNfoTab || availableSubTabs.length === 0) return;
    if (!availableSubTabs.includes(activeSubTab)) {
      setActiveSubTab(availableSubTabs[0]);
    }
    setCurrentPage(1);
  }, [activeSubTab, availableSubTabs, isPopularTab, isNfoTab, activeCategory]);

  const handleCategoryChange = (catName: string) => {
    setActiveCategory(catName);
    setActiveSubTab("");
    setCurrentPage(1);
  };

  const selectedCategory = useMemo(
    () => masterCategories.find((cat) => cat.name === activeCategory),
    [masterCategories, activeCategory],
  );

  const baseData = useMemo(() => {
    if (isPopularTab) {
      return popularFunds.map((fund) => ({
        id: fund._id,
        name: fund.fund_name,
        y3: getTrailingReturn(fund.returns, "3y", "y3_cagr")?.toString?.() || "-",
        y5: getTrailingReturn(fund.returns, "5y", "y5_cagr")?.toString?.() || "-",
        y10: getTrailingReturn(fund.returns, "10y", "y10_cagr")?.toString?.() || "-",
      }));
    }

    if (isNfoTab) {
      return nfos.map((fund) => ({
        id: fund._id,
        name: fund.fund_name,
        y3: "-",
        y5: "-",
        y10: "-",
      }));
    }

    return fundData || [];
  }, [fundData, isNfoTab, isPopularTab, nfos, popularFunds]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    const data = [...baseData] as TableRow[];
    if (!sortConfig.direction) return sortFeaturedFirst(data, "y3");

    const sorted = data.sort((a, b) => {
      const valA = a[sortConfig.key as keyof typeof a];
      const valB = b[sortConfig.key as keyof typeof b];

      if (sortConfig.key !== "name") {
        return sortConfig.direction === "asc"
          ? parseReturn(String(valA)) - parseReturn(String(valB))
          : parseReturn(String(valB)) - parseReturn(String(valA));
      }

      return sortConfig.direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sortFeaturedFirst(
      sorted,
      sortConfig.key === "y5" || sortConfig.key === "y10" ? sortConfig.key : "y3",
    );
  }, [baseData, sortConfig]);

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    if (totalPages <= 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const isLoadingTable = isPopularTab
    ? popularLoading
    : isNfoTab
      ? nfoLoading
      : loading;
  const tableError = isPopularTab ? popularError : isNfoTab ? nfoError : error;

  return (
    <div className="max-w-7xl mx-auto py-[40px] font-poppins min-h-screen bg-white text-gray-900">
      <div className="text-center mb-[40px]">
        <h2 className="text-[30px] md:text-[40px] font-semibold mb-3">
          Explore Mutual Funds Across Categories
        </h2>
        <p className="max-w-5xl mx-auto leading-relaxed text-[16px] md:text-[18px] mb-0 text-gray-500">
          Mutual funds are grouped into categories based on how and where they
          invest. Exploring categories helps you decide how you&apos;d like to begin.
        </p>
      </div>

      <div className="flex bg-[#F8F8F8] mb-[60px] max-w-4xl mx-auto rounded-none">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveMainTab(tab);
              setCurrentPage(1);
            }}
            className={`flex-1 py-3 px-4 font-medium text-[15px] md:text-[18px] transition-all duration-200 cursor-pointer ${
              activeMainTab === tab
                ? "bg-[#043F79] text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Left */}
        <div className="w-full lg:w-1/4 border border-gray-200 rounded-xl overflow-hidden lg:sticky lg:top-6 bg-white shadow-sm flex-shrink-0 p-2 space-y-1">
          {masterCategories.length > 0 ? (
            masterCategories.map((cat, index) => (
              <button
                key={`${cat.id}-${index}`}
                onClick={() => handleCategoryChange(cat.name)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium text-[15px] flex items-center justify-between cursor-pointer ${
                  activeCategory === cat.name
                    ? "text-[#043F79] bg-[#043F79]/5 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span>{cat.name}</span>
                {activeCategory === cat.name && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#043F79]" />
                )}
              </button>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm animate-pulse">
              Loading Categories...
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-[22px] font-medium mb-4 text-slate-800">
            {activeCategory || "Select Category"}
          </h2>

          <p className="mb-6 text-[15px] leading-[26px] text-gray-600">
            {selectedCategory?.description ||
              `Investments in ${activeCategory?.toLowerCase() || "selected categories"} help in diversification.`}
          </p>

          {/* Sub-tabs for filters */}
          {!isPopularTab && !isNfoTab && (
            <div className="mb-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-8">
                {availableSubTabs.map((tab, idx) => (
                  <button
                    key={`${tab}-${idx}`}
                    onClick={() => {
                      setActiveSubTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`pb-2 mb-[8px] text-[15px] font-medium whitespace-nowrap transition-all border-b-3 cursor-pointer ${
                      activeSubTab === tab
                        ? "border-[#043F79] text-[#043F79]"
                        : "border-transparent text-[#E9AF11] hover:text-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab description */}
          {!isPopularTab && !isNfoTab && subTabDescriptions?.[activeSubTab] && (
            <p className="mb-6 mt-2 text-[15px] leading-[26px] text-gray-600">
              {subTabDescriptions[activeSubTab]}
            </p>
          )}

            {/* Grid Header and Cards */}
            <div className="space-y-4">
              {/* Desktop Header Grid */}
              <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-400 text-[10px] font-bold uppercase tracking-wider items-center shadow-sm">
                <div
                  onClick={() => handleSort("name")}
                  className="col-span-4 cursor-pointer hover:text-gray-700 transition-colors group flex items-center"
                >
                  Fund Name
                  <SortIcons columnKey="name" sortConfig={sortConfig} />
                </div>
                <div
                  onClick={() => handleSort("y3")}
                  className="col-span-2 cursor-pointer hover:text-gray-700 transition-colors group flex items-center justify-center text-center"
                >
                  3Y Return
                  <SortIcons columnKey="y3" sortConfig={sortConfig} />
                </div>
                <div
                  onClick={() => handleSort("y5")}
                  className="col-span-2 cursor-pointer hover:text-gray-700 transition-colors group flex items-center justify-center text-center"
                >
                  5Y Return
                  <SortIcons columnKey="y5" sortConfig={sortConfig} />
                </div>
                <div
                  onClick={() => handleSort("y10")}
                  className="col-span-2 cursor-pointer hover:text-gray-700 transition-colors group flex items-center justify-center text-center"
                >
                  10Y Return
                  <SortIcons columnKey="y10" sortConfig={sortConfig} />
                </div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Cards List */}
              {isLoadingTable ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse flex flex-col md:grid md:grid-cols-12 gap-4 h-24"
                    >
                      <div className="col-span-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded-md w-1/2"></div>
                      </div>
                      <div className="col-span-6 grid grid-cols-3 gap-4">
                        <div className="h-5 bg-gray-100 rounded-md"></div>
                        <div className="h-5 bg-gray-100 rounded-md"></div>
                        <div className="h-5 bg-gray-100 rounded-md"></div>
                      </div>
                      <div className="col-span-2 h-8 bg-gray-200 rounded-md"></div>
                    </div>
                  ))}
                </div>
              ) : paginatedData.length > 0 ? (
                <div className="space-y-3">
                  {paginatedData.map((fund, idx) => {
                    const y3Num = parseFloat(fund.y3);
                    const y5Num = parseFloat(fund.y5);
                    const y10Num = parseFloat(fund.y10);
                    
                    const y3Val = fund.y3 === "-" || isNaN(y3Num) ? null : y3Num;
                    const y5Val = fund.y5 === "-" || isNaN(y5Num) ? null : y5Num;
                    const y10Val = fund.y10 === "-" || isNaN(y10Num) ? null : y10Num;

                    return (
                      <div
                        key={`${fund.name}-${idx}`}
                        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col md:grid md:grid-cols-12 md:items-center gap-4"
                      >
                        {/* Fund Name & Category */}
                        <div className="col-span-4 min-w-0">
                          <div
                            className="font-semibold text-slate-800 text-[15px] cursor-pointer hover:text-[#043F79] hover:underline leading-snug transition-colors"
                            onClick={() => {
                              if (fund.id) router.push(`/funds/${fund.id}`);
                            }}
                          >
                            {fund.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                              {activeMainTab === "Popular Funds"
                                ? "Popular Fund"
                                : activeMainTab === "New Fund Offers"
                                ? "NFO"
                                : activeCategory}
                            </span>
                            {!isPopularTab && !isNfoTab && activeSubTab && (
                              <>
                                <span>•</span>
                                <span className="text-gray-500">{activeSubTab}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Stat Strip */}
                        <div className="col-span-6 grid grid-cols-3 gap-2 md:gap-4 py-3 md:py-0 border-y border-gray-50 md:border-none my-1 md:my-0">
                          {/* 3Y Return */}
                          <div className="flex flex-col items-center md:items-center text-center">
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                              3Y Return
                            </span>
                            <span
                              className={`text-sm font-bold tabular-nums md:mt-0 ${returnColor(
                                y3Val
                              )}`}
                            >
                              {y3Val !== null ? `${y3Val > 0 ? "+" : ""}${y3Val.toFixed(2)}%` : "-"}
                            </span>
                          </div>

                          {/* 5Y Return */}
                          <div className="flex flex-col items-center md:items-center text-center">
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                              5Y Return
                            </span>
                            <span
                              className={`text-sm font-bold tabular-nums md:mt-0 ${returnColor(
                                y5Val
                              )}`}
                            >
                              {y5Val !== null ? `${y5Val > 0 ? "+" : ""}${y5Val.toFixed(2)}%` : "-"}
                            </span>
                          </div>

                          {/* 10Y Return */}
                          <div className="flex flex-col items-center md:items-center text-center">
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                              10Y Return
                            </span>
                            <span
                              className={`text-sm font-bold tabular-nums md:mt-0 ${returnColor(
                                y10Val
                              )}`}
                            >
                              {y10Val !== null ? `${y10Val > 0 ? "+" : ""}${y10Val.toFixed(2)}%` : "-"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex md:justify-end gap-2 items-center w-full md:w-auto mt-2 md:mt-0">
                          <button className="flex-1 md:flex-initial bg-[#043F79] text-white text-[12px] font-bold px-3 py-2 rounded-lg shadow-sm hover:bg-[#032d56] transition-all whitespace-nowrap cursor-pointer">
                            Start SIP
                          </button>
                          <button
                            onClick={() => {
                              if (fund.id) router.push(`/funds/${fund.id}`);
                            }}
                            className="flex-1 md:flex-initial border border-[#F39C12] text-[#F39C12] text-[12px] font-bold px-3 py-2 rounded-lg hover:bg-orange-50/50 transition-all whitespace-nowrap cursor-pointer"
                          >
                            Explore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 font-medium shadow-sm">
                  {tableError || "No data available"}
                </div>
              )}

              {/* Pagination */}
              {!isLoadingTable && totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
                  <div className="text-[13px] text-gray-500 font-medium">
                    Showing{" "}
                    <span className="font-semibold text-gray-800">
                      {startIndex + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-800">
                      {endIndex}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-800">
                      {totalItems}
                    </span>{" "}
                    results
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="px-3 py-1.5 text-[13px] font-semibold border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1 mx-1">
                      {pageNumbers.map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-8 h-8 flex items-center justify-center text-[13px] font-bold rounded-lg transition-all cursor-pointer ${
                            currentPage === num
                              ? "bg-[#043F79] text-white shadow-sm"
                              : "text-gray-500 hover:bg-gray-100 border border-transparent"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((prev) => prev - 1 + 2)}
                      className="px-3 py-1.5 text-[13px] font-semibold border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
