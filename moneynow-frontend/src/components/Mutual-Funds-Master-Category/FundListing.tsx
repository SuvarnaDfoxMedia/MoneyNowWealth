"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, Search, Filter, X } from "lucide-react";
import { mfService } from "@/services/mfService";
import { useRouter } from "next/navigation";
import { returnColor } from "@/components/fund-card/MfApiSchemeViewTypes";

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | null;
};

type Fund = {
  _id: string;
  fund_name?: string;
  amc_id?: { name: string };
  category_id?: { name: string };
  plan_type?: string;
  returns?: {
    trailing?: Record<string, number | null>;
    y1_cagr?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
  };
  nav_Current?: number | null;
  nav_date?: string | null;
  is_active?: boolean;
};

const getTrailingReturn = (
  returns: Fund["returns"] | undefined,
  key: "1y" | "3y" | "5y" | "10y"
) => returns?.trailing?.[key] ?? null;

const formatReturnValue = (val: number | null | undefined) =>
  val == null ? "-" : `${Number(val).toFixed(2)}%`;

export default function FundListing() {
  const router = useRouter();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(500);
  const [totalItems, setTotalItems] = useState(0);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "fund_name",
    direction: "asc",
  });

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [amcs, setAmcs] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [selectedAmcs, setSelectedAmcs] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);


  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchFilters = async () => {
    try {
      // In a real app, we might hit /api/mf/filters
      // But we can just use the categories API for now
      const catRes = await mfService.getMainCategories({ limit: 50 });
      if (catRes?.data) {
        setCategories(catRes.data.map((c: any) => ({ id: c._id, name: c.name })));
      }
    } catch (err) {
      console.error("Failed to load filters", err);
    }
  };

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit,
        search: debouncedSearch,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        is_active: 1,
      };

      if (selectedAmcs.length > 0) params.amcIds = selectedAmcs.join(",");
      if (selectedCategories.length > 0) params.mainCategoryIds = selectedCategories.join(",");

      const res = await mfService.getFunds(params);
      
      if (res && res.data) {
        setFunds(res.data);
        setTotalPages(res.totalPages || Math.ceil((res.total || 0) / limit));
        setTotalItems(res.total || res.data.length);
      } else {
        setFunds([]);
      }
    } catch (err) {
      setError("Failed to fetch funds. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, sortConfig, selectedAmcs, selectedCategories]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
    setCurrentPage(1);
  };

  const toggleFilter = (id: string, type: "amc" | "category") => {
    if (type === "amc") {
      setSelectedAmcs((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedCategories((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedAmcs([]);
    setSelectedCategories([]);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-poppins min-h-screen bg-[#FAFAFA] text-gray-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight">
            Mutual Fund Screener
          </h1>
          <p className="text-gray-500 mt-2 text-[15px] md:text-[16px]">
            Discover, analyze, and find the best mutual funds tailored for your goals.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm text-gray-700 font-semibold text-[14px] cursor-pointer"
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Sidebar Filters */}
        <div
          className={`${
            showFilters ? "block" : "hidden"
          } lg:block w-full lg:w-[280px] shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm p-5 self-start sticky top-6`}
        >
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-[16px] text-gray-800 flex items-center gap-2">
              <Filter size={18} className="text-[#043F79]" /> Filters
            </h3>
            {(selectedAmcs.length > 0 || selectedCategories.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-[13px] text-red-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-6">
            {categories.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3 text-[14px]">Category</h4>
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleFilter(cat.id, "category")}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded border border-gray-300 bg-white peer-checked:bg-[#043F79] peer-checked:border-[#043F79] transition-all flex items-center justify-center">
                          <svg
                            className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-[14px] text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search funds by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-slate-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#043F79]/10 focus:border-[#043F79] transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="text-[13px] font-semibold inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[#043F79] border border-blue-100/50">
                Found <span className="mx-1 font-bold">{totalItems}</span> funds
              </div>
            </div>

            {/* Desktop Header Grid */}
            <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <div
                onClick={() => handleSort("fund_name")}
                className="flex-1 min-w-0 cursor-pointer hover:text-gray-700 transition-colors group flex items-center gap-2"
              >
                Fund Name
                <SortIcon active={sortConfig.key === "fund_name"} direction={sortConfig.direction} />
              </div>
              
              <div className="flex items-center gap-6 md:gap-12 shrink-0">
                <div className="w-24 text-left">NAV</div>
                
                <div
                  onClick={() => handleSort("y1")}
                  className="w-20 cursor-pointer hover:text-gray-700 transition-colors group flex items-center justify-end gap-1.5"
                >
                  1Y Return
                  <SortIcon active={sortConfig.key === "y1"} direction={sortConfig.direction} />
                </div>
                
                <div
                  onClick={() => handleSort("y3")}
                  className="w-20 cursor-pointer hover:text-gray-700 transition-colors group flex items-center justify-end gap-1.5"
                >
                  3Y Return
                  <SortIcon active={sortConfig.key === "y3"} direction={sortConfig.direction} />
                </div>
                
                <div
                  onClick={() => handleSort("y5")}
                  className="w-20 cursor-pointer hover:text-gray-700 transition-colors group flex items-center justify-end gap-1.5"
                >
                  5Y Return
                  <SortIcon active={sortConfig.key === "y5"} direction={sortConfig.direction} />
                </div>
                
                <div className="w-24 text-right">Action</div>
              </div>
            </div>

            {/* Data Cards list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4 h-24"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded-md w-1/2"></div>
                    </div>
                    <div className="flex items-center gap-6 md:gap-12">
                      <div className="h-5 bg-gray-100 rounded-md w-24"></div>
                      <div className="h-5 bg-gray-100 rounded-md w-20"></div>
                      <div className="h-5 bg-gray-100 rounded-md w-20"></div>
                      <div className="h-5 bg-gray-100 rounded-md w-20"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded-md w-24"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-red-500 font-semibold shadow-sm">
                {error}
              </div>
            ) : funds.length > 0 ? (
              <div className="space-y-3">
                {funds.map((fund) => {
                  const y1 = getTrailingReturn(fund.returns, "1y");
                  const y3 = getTrailingReturn(fund.returns, "3y");
                  const y5 = getTrailingReturn(fund.returns, "5y");

                  const fundName = fund.fund_name || "Unknown Fund";
                  const category = fund.category_id?.name || "Uncategorized";
                  const plan = fund.plan_type || "Direct";
                  const nav = fund.nav_Current;
                  const navDate = fund.nav_date;

                  return (
                    <div
                      key={fund._id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Fund Name & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-semibold text-slate-800 text-[15px] cursor-pointer hover:text-[#043F79] hover:underline leading-snug transition-colors"
                          onClick={() => router.push(`/funds/${fund._id}`)}
                        >
                          {fundName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                            {category}
                          </span>
                          <span>•</span>
                          <span>{plan}</span>
                        </div>
                      </div>

                      {/* Right: stats strips on desktop, stack grid on mobile */}
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 lg:gap-12 py-3 md:py-0 border-y border-gray-50 md:border-none my-1 md:my-0 shrink-0 w-full md:w-auto">
                        {/* NAV Stat */}
                        <div className="flex justify-between md:block md:w-24 text-left">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                            NAV
                          </span>
                          <div>
                            <span className="text-sm font-bold text-gray-800 tabular-nums">
                              {nav ? `₹${Number(nav).toFixed(2)}` : "-"}
                            </span>
                            {navDate && (
                              <div className="text-[10px] text-gray-400 font-normal md:mt-0.5">
                                {new Date(navDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 1Y Return */}
                        <div className="flex justify-between md:block md:w-20 md:text-right">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                            1Y Return
                          </span>
                          <div>
                            <ReturnCell value={y1} />
                          </div>
                        </div>

                        {/* 3Y Return */}
                        <div className="flex justify-between md:block md:w-20 md:text-right">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                            3Y Return
                          </span>
                          <div>
                            <ReturnCell value={y3} />
                          </div>
                        </div>

                        {/* 5Y Return */}
                        <div className="flex justify-between md:block md:w-20 md:text-right">
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 md:hidden mb-0.5">
                            5Y Return
                          </span>
                          <div>
                            <ReturnCell value={y5} />
                          </div>
                        </div>

                        {/* Invest/Explore Button */}
                        <div className="w-full md:w-24 text-right flex md:block mt-2 md:mt-0">
                          <button 
                            onClick={() => router.push(`/funds/${fund._id}`)}
                            className="w-full justify-center inline-flex items-center bg-[#043F79] hover:bg-[#032d56] text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Invest
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                  <div className="text-gray-400 font-semibold text-[16px]">No funds match your criteria.</div>
                  <button 
                    onClick={clearFilters}
                    className="mt-4 text-[#043F79] hover:underline text-[14px] font-bold cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[14px] text-gray-500 font-medium">
                  Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-semibold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-semibold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" | null }) {
  return (
    <div className="flex flex-col -space-y-1">
      <ChevronUp
        size={14}
        strokeWidth={3}
        className={`${active && direction === "asc" ? "text-[#043F79]" : "text-gray-400"}`}
      />
      <ChevronDown
        size={14}
        strokeWidth={3}
        className={`${active && direction === "desc" ? "text-[#043F79]" : "text-gray-400"}`}
      />
    </div>
  );
}

function ReturnCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-400">-</span>;
  const isPositive = value >= 0;
  return (
    <span className={`text-sm font-bold tabular-nums ${returnColor(value)}`}>
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
