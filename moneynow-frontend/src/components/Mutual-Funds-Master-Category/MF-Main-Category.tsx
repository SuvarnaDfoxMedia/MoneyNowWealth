"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useFetchMFData } from "../../hooks/useFetchMFcategeory";
import { usePopularFunds } from "../../hooks/usePopularFunds";
import { useNfoFunds } from "../../hooks/useNfoFunds";

const MAIN_TABS = ["Categories", "Popular Funds", "New Fund Offers"];

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | null;
};

type TableRow = {
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
        name: fund.fund_name,
        y3: getTrailingReturn(fund.returns, "3y", "y3_cagr")?.toString?.() || "-",
        y5: getTrailingReturn(fund.returns, "5y", "y5_cagr")?.toString?.() || "-",
        y10: getTrailingReturn(fund.returns, "10y", "y10_cagr")?.toString?.() || "-",
      }));
    }

    if (isNfoTab) {
      return nfos.map((fund) => ({
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
    <div className="max-w-7xl mx-auto py-[40px] font-poppins min-h-screen bg-white">
      <div className="text-center mb-[40px]">
        <h2 className="text-[30px] md:text-[40px] font-semibold mb-3">
          Explore Mutual Funds Across Categories
        </h2>
        <p className="max-w-5xl mx-auto leading-relaxed text-[16px] md:text-[18px] mb-0">
          Mutual funds are grouped into categories based on how and where they
          invest. Exploring categories helps you decide how you&apos;d like to begin.
        </p>
      </div>

      <div className="flex bg-[#F8F8F8] mb-[60px] max-w-4xl mx-auto">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveMainTab(tab);
              setCurrentPage(1);
            }}
            className={`flex-1 py-3 px-4 font-medium text-[15px] md:text-[18px] transition-all duration-200 ${
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
        <div className="w-full lg:w-1/4 border border-[#E4E4E4] rounded-lg overflow-hidden lg:sticky lg:top-6 bg-white shadow-sm flex-shrink-0">
          {masterCategories.length > 0 ? (
            masterCategories.map((cat, index) => (
              <button
                key={`${cat.id}-${index}`}
                onClick={() => handleCategoryChange(cat.name)}
                className={`w-full text-left px-5 py-4 border-b border-[#E4E4E4] last:border-0 transition-colors font-medium text-[16px] ${
                  activeCategory === cat.name
                    ? "text-[#043F79] bg-blue-50/30"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm animate-pulse">
              Loading Categories...
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-medium mb-4">
            {activeCategory || "Select Category"}
          </h2>

          <p className="mb-6 text-[15px] leading-[26px] text-gray-600">
            {selectedCategory?.description ||
              `Investments in ${activeCategory?.toLowerCase() || "selected categories"} help in diversification.`}
          </p>

          {!isPopularTab && !isNfoTab && (
            <div className="mb-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-8 ">
                {availableSubTabs.map((tab, idx) => (
                  <button
                    key={`${tab}-${idx}`}
                    onClick={() => {
                      setActiveSubTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`pb-2 mb-[8px] text-[15px] font-medium whitespace-nowrap transition-all border-b-3 ${
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

          <p className="mb-6 mt-2 text-[15px] leading-[26px] text-gray-600">
            {subTabDescriptions?.[activeSubTab] && (
              <>{subTabDescriptions[activeSubTab]}</>
            )}
          </p>

          <div className="border border-[#E4E4E4] rounded-[6px] overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px] table-fixed">
                <thead>
                  <tr className="bg-[#F1F3F5] text-[#495057] text-[14px] font-semibold">
                    <th
                      onClick={() => handleSort("name")}
                      className="px-5 py-2 border-r border-[#E4E4E4] w-auto cursor-pointer hover:bg-gray-200 transition-colors group"
                    >
                      <div className="flex items-center">
                        Fund Name
                        <SortIcons columnKey="name" sortConfig={sortConfig} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("y3")}
                      className="px-5 py-1.5 border-r border-[#E4E4E4] text-center w-[100px] cursor-pointer hover:bg-gray-200 transition-colors group"
                    >
                      <div className="flex items-center justify-center">
                        3Y <SortIcons columnKey="y3" sortConfig={sortConfig} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("y5")}
                      className="px-5 py-1.5 border-r border-[#E4E4E4] text-center w-[100px] cursor-pointer hover:bg-gray-200 transition-colors group"
                    >
                      <div className="flex items-center justify-center">
                        5Y <SortIcons columnKey="y5" sortConfig={sortConfig} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("y10")}
                      className="px-5 py-1.5 border-r border-[#E4E4E4] text-center w-[100px] cursor-pointer hover:bg-gray-200 transition-colors group"
                    >
                      <div className="flex items-center justify-center">
                        10Y <SortIcons columnKey="y10" sortConfig={sortConfig} />
                      </div>
                    </th>
                    <th className="px-5 py-1.5 text-right w-[180px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E4]">
                  {isLoadingTable ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-20 text-center text-gray-400 animate-pulse"
                      >
                        Fetching funds...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((fund, idx) => (
                      <tr
                        key={`${fund.name}-${idx}`}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-1.5 text-[13px] text-[#495057] border-r border-[#E4E4E4] font-medium truncate">
                          {fund.name}
                        </td>
                        <td className="px-5 py-1.5 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                          {formatReturnValue(fund.y3)}
                        </td>
                        <td className="px-5 py-1.5 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                          {formatReturnValue(fund.y5)}
                        </td>
                        <td className="px-5 py-1.5 text-[13px] text-center text-[#495057] border-r border-[#E4E4E4]">
                          {formatReturnValue(fund.y10)}
                        </td>
                        <td className="px-5 py-1.5 text-right">
                          <div className="flex justify-end gap-1.5 items-center px-1">
                            <button className="bg-[#043F79] text-white text-[12px] font-medium px-2.5 py-1.5 rounded-[3px] shadow-sm hover:bg-[#032d56] whitespace-nowrap">
                              Start SIP
                            </button>
                            <button className="border border-[#F39C12] text-[#F39C12] text-[12px] font-medium px-2 py-1.5 rounded-[3px] hover:bg-orange-50 whitespace-nowrap">
                              Explore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-16 text-center text-gray-400 font-medium"
                      >
                        {tableError || "No data available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isLoadingTable && totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#E4E4E4] bg-white gap-4">
                <div className="text-[13px] text-gray-500">
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
                    className="px-3 py-1.5 text-[13px] font-medium border border-[#E4E4E4] rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1 mx-1">
                    {pageNumbers.map((num) => (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num)}
                        className={`w-8 h-8 flex items-center justify-center text-[13px] font-semibold rounded transition-all ${
                          currentPage === num
                            ? "bg-[#043F79] text-white"
                            : "text-gray-500 hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-3 py-1.5 text-[13px] font-medium border border-[#E4E4E4] rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
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
