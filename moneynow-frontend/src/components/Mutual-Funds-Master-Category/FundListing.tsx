"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, Search, Filter, X } from "lucide-react";
import { mfService } from "@/services/mfService";
import { useRouter } from "next/navigation";

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
    <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-poppins min-h-screen bg-[#FAFAFA]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight">
            Mutual Fund Screener
          </h1>
          <p className="text-gray-500 mt-2 text-[16px]">
            Discover, analyze, and find the best mutual funds tailored for your goals.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm text-gray-700 font-medium"
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
            <h3 className="font-semibold text-[18px] text-gray-800 flex items-center gap-2">
              <Filter size={18} className="text-[#043F79]" /> Filters
            </h3>
            {(selectedAmcs.length > 0 || selectedCategories.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-[13px] text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-6">
            {categories.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-[15px]">Category</h4>
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
                      <span className="text-[14px] text-gray-600 group-hover:text-gray-900 transition-colors">
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
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#043F79]/20 focus:border-[#043F79] transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="text-[14px] text-gray-500 font-medium">
                Found <span className="text-gray-900">{totalItems}</span> funds
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-[#495057] text-[13px] font-semibold uppercase tracking-wider">
                    <th
                      onClick={() => handleSort("fund_name")}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        Fund Name
                        <SortIcon active={sortConfig.key === "fund_name"} direction={sortConfig.direction} />
                      </div>
                    </th>
                    <th className="px-6 py-4">NAV</th>
                    <th
                      onClick={() => handleSort("y1")}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group text-right"
                    >
                      <div className="flex items-center justify-end gap-2">
                        1Y Return
                        <SortIcon active={sortConfig.key === "y1"} direction={sortConfig.direction} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("y3")}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group text-right"
                    >
                      <div className="flex items-center justify-end gap-2">
                        3Y Return
                        <SortIcon active={sortConfig.key === "y3"} direction={sortConfig.direction} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("y5")}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group text-right"
                    >
                      <div className="flex items-center justify-end gap-2">
                        5Y Return
                        <SortIcon active={sortConfig.key === "y5"} direction={sortConfig.direction} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-[#043F79]/20 border-t-[#043F79] rounded-full animate-spin mb-4"></div>
                          <span className="text-gray-500 font-medium">Loading funds...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-red-500 font-medium">
                        {error}
                      </td>
                    </tr>
                  ) : funds.length > 0 ? (
                    funds.map((fund) => {
                      const y1 = getTrailingReturn(fund.returns, "1y");
                      const y3 = getTrailingReturn(fund.returns, "3y");
                      const y5 = getTrailingReturn(fund.returns, "5y");

                      const fundName = fund.fund_name || "Unknown Fund";
                      const category = fund.category_id?.name || "Uncategorized";
                      const plan = fund.plan_type || "Direct";
                      const nav = fund.nav_Current;
                      const navDate = fund.nav_date;

                      return (
                        <tr
                          key={fund._id}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div 
                              className="font-semibold text-[#043F79] text-[15px] cursor-pointer hover:underline mb-1"
                              onClick={() => router.push(`/funds/${fund._id}`)}
                            >
                              {fundName}
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-gray-500">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                {category}
                              </span>
                              <span>•</span>
                              <span>{plan}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-gray-700 font-medium">
                            {nav ? `₹${Number(nav).toFixed(2)}` : "-"}
                            <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                              {navDate ? new Date(navDate).toLocaleDateString() : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-right font-medium">
                            <ReturnCell value={y1} />
                          </td>
                          <td className="px-6 py-4 text-[14px] text-right font-medium">
                            <ReturnCell value={y3} />
                          </td>
                          <td className="px-6 py-4 text-[14px] text-right font-medium">
                            <ReturnCell value={y5} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => router.push(`/funds/${fund._id}`)}
                              className="inline-flex items-center justify-center bg-white border border-[#043F79] text-[#043F79] px-4 py-1.5 rounded-md text-[13px] font-semibold hover:bg-[#043F79] hover:text-white transition-all shadow-sm"
                            >
                              Invest
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="text-gray-400 font-medium text-[16px]">No funds match your criteria.</div>
                        <button 
                          onClick={clearFilters}
                          className="mt-4 text-[#043F79] hover:underline text-[14px] font-medium"
                        >
                          Clear all filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[14px] text-gray-500">
                  Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" | null }) {
  return (
    <div className="flex flex-col -space-y-1">
      <ChevronUp
        size={14}
        strokeWidth={3}
        className={`${active && direction === "asc" ? "text-[#043F79]" : "text-gray-300"}`}
      />
      <ChevronDown
        size={14}
        strokeWidth={3}
        className={`${active && direction === "desc" ? "text-[#043F79]" : "text-gray-300"}`}
      />
    </div>
  );
}

function ReturnCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-400">-</span>;
  const isPositive = value >= 0;
  return (
    <span className={isPositive ? "text-emerald-600" : "text-red-500"}>
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}
