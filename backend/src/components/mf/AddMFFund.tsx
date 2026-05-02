import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { axiosApi } from "../../api/axios";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
  mfTextAreaClass,
} from "./MFFormShared";
import {
  getApiMessage,
  isDuplicateEntryMessage,
  toDuplicateFieldMessage,
} from "./mfValidation";

const FUND_TRAILING_FIELDS = [
  { key: "w1", label: "1 Week" },
  { key: "m1", label: "1 Month" },
  { key: "m3", label: "3 Months" },
  { key: "m6", label: "6 Months" },
  { key: "y1", label: "1 Year" },
  { key: "y3_cagr", label: "3 Years CAGR" },
  { key: "y5_cagr", label: "5 Years CAGR" },
  { key: "y10_cagr", label: "10 Years CAGR" },
  { key: "ytd", label: "YTD" },
] as const;

const BENCHMARK_TRAILING_FIELDS = [
  { key: "w1", label: "1 Week" },
  { key: "m1", label: "1 Month" },
  { key: "m3", label: "3 Months" },
  { key: "m6", label: "6 Months" },
  { key: "y1", label: "1 Year" },
  { key: "y3", label: "3 Years" },
  { key: "y5", label: "5 Years" },
  { key: "y10", label: "10 Years" },
  { key: "ytd", label: "YTD" },
] as const;

const ANNUAL_YEARS = [
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
] as const;

const emptyMap = <T extends readonly string[]>(keys: T) =>
  Object.fromEntries(keys.map((key) => [key, ""])) as Record<T[number], string>;

const emptyForm = () => ({
  scheme_code: "",
  fund_name: "",
  amc_id: "",
  amc_name: "",
  category_id: "",
  plan_type: "Regular",
  option_type: "Growth",
  aum_cr: "",
  expense_ratio: "",
  return_1d: "",
  returnsTrailing: emptyMap(
    FUND_TRAILING_FIELDS.map(
      (field) => field.key,
    ) as unknown as readonly string[],
  ),
  returnsAnnual: emptyMap(ANNUAL_YEARS),
  sharpe_3y: "",
  std_dev_3y: "",
  beta_3y: "",
  alpha_3y: "",
  max_drawdown_5y: "",
  turnover_ratio: "",
  fund_manager: "",
  launch_date: null as Date | null,
  benchmark_index_name: "",
  benchmarkTrailing: emptyMap(
    BENCHMARK_TRAILING_FIELDS.map(
      (field) => field.key,
    ) as unknown as readonly string[],
  ),
  benchmarkAnnual: emptyMap(ANNUAL_YEARS),
  min_investment: "",
  sip_allowed: true,
  min_sip_investment: "",
  lumpsum_allowed: true,
  min_lumpsum_investment: "",
  exit_load: "",
  fund_objective: "",
  investment_strategy: "",
  equity_pct: "",
  debt_pct: "",
  other_pct: "",
  tax_type: "",
  riskometer_label: "",
  is_featured: false,
  is_popular: false,
  is_active: 1,
});

type FundFormState = ReturnType<typeof emptyForm>;

type CategoryOption = {
  _id: string;
  name: string;
};

type AmcOption = {
  _id: string;
  name: string;
};

const toNumberOrNull = (value: string) => (value === "" ? null : Number(value));

export default function AddMFFund() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/funds",
    listKey: "data",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const [form, setForm] = useState<FundFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [amcOptions, setAmcOptions] = useState<AmcOption[]>([]);
  const [amcDropdownOpen, setAmcDropdownOpen] = useState(false);
  const [amcSearch, setAmcSearch] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const amcWrapperRef = useRef<HTMLDivElement>(null);
  const categoryWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [categoryRes, amcRes] = await Promise.all([
        axiosApi.get(`/${role}/mf/categories`, {
          limit: 5000,
          page: 1,
          sortBy: "created_at",
          sortOrder: "desc",
        }),
        axiosApi.get(`/${role}/mf/amcs`, {
          limit: 5000,
          page: 1,
          sortBy: "name",
          sortOrder: "asc",
        }),
      ]);
      setCategoryOptions(
        Array.isArray(categoryRes?.data) ? categoryRes.data : [],
      );
      setAmcOptions(Array.isArray(amcRes?.data) ? amcRes.data : []);
    })();
  }, [role]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const res: any = await getOne(id);
      const fund = res?.data || {};

      setForm({
        scheme_code: fund.scheme_code || "",
        fund_name: fund.fund_name || "",
        amc_id: fund.amc_id?._id || "",
        amc_name: fund.amc_id?.name || "",
        category_id: fund.category_id?._id || "",
        plan_type: fund.plan_type || "Regular",
        option_type: fund.option_type || "Growth",
        aum_cr: fund.aum_cr?.toString?.() || "",
        expense_ratio: fund.expense_ratio?.toString?.() || "",
        return_1d: fund.returns?.d1?.toString?.() || "",
        returnsTrailing: {
          ...emptyMap(
            FUND_TRAILING_FIELDS.map(
              (field) => field.key,
            ) as unknown as readonly string[],
          ),
          ...Object.fromEntries(
            FUND_TRAILING_FIELDS.map((field) => [
              field.key,
              fund.returns?.[field.key]?.toString?.() || "",
            ]),
          ),
        },
        returnsAnnual: {
          ...emptyMap(ANNUAL_YEARS),
          ...Object.fromEntries(
            ANNUAL_YEARS.map((year) => [
              year,
              fund.returns?.annual?.[year]?.toString?.() || "",
            ]),
          ),
        },
        sharpe_3y: fund.risk_metrics?.sharpe_3y?.toString?.() || "",
        std_dev_3y: fund.risk_metrics?.std_dev_3y?.toString?.() || "",
        beta_3y: fund.risk_metrics?.beta_3y?.toString?.() || "",
        alpha_3y: fund.risk_metrics?.alpha_3y?.toString?.() || "",
        max_drawdown_5y: fund.risk_metrics?.max_drawdown_5y?.toString?.() || "",
        turnover_ratio: fund.risk_metrics?.turnover_ratio?.toString?.() || "",
        fund_manager: fund.fund_manager || "",
        launch_date: fund.launch_date ? new Date(fund.launch_date) : null,
        benchmark_index_name: fund.benchmark_index_name || "",
        benchmarkTrailing: {
          ...emptyMap(
            BENCHMARK_TRAILING_FIELDS.map(
              (field) => field.key,
            ) as unknown as readonly string[],
          ),
          ...Object.fromEntries(
            BENCHMARK_TRAILING_FIELDS.map((field) => [
              field.key,
              fund.benchmark_returns_trailing?.[field.key]?.toString?.() || "",
            ]),
          ),
        },
        benchmarkAnnual: {
          ...emptyMap(ANNUAL_YEARS),
          ...Object.fromEntries(
            ANNUAL_YEARS.map((year) => [
              year,
              fund.benchmark_returns_annual?.[year]?.toString?.() || "",
            ]),
          ),
        },
        min_investment: fund.min_investment?.toString?.() || "",
        sip_allowed: fund.sip_allowed ?? true,
        min_sip_investment: fund.min_sip_investment?.toString?.() || "",
        lumpsum_allowed: fund.lumpsum_allowed ?? true,
        min_lumpsum_investment: fund.min_lumpsum_investment?.toString?.() || "",
        exit_load: fund.exit_load || "",
        fund_objective: fund.fund_objective || "",
        investment_strategy: fund.investment_strategy || "",
        equity_pct: fund.asset_allocation?.equity_pct?.toString?.() || "",
        debt_pct: fund.asset_allocation?.debt_pct?.toString?.() || "",
        other_pct: fund.asset_allocation?.other_pct?.toString?.() || "",
        tax_type: fund.tax_type || "",
        riskometer_label: fund.riskometer_label || "",
        is_featured: !!fund.is_featured,
        is_popular: !!fund.is_popular,
        is_active: fund.is_active ?? 1,
      });
    })();
  }, [getOne, id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        amcWrapperRef.current &&
        !amcWrapperRef.current.contains(event.target as Node)
      ) {
        setAmcDropdownOpen(false);
        setAmcSearch("");
      }
      if (
        categoryWrapperRef.current &&
        !categoryWrapperRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdownOpen(false);
        setCategorySearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = useMemo(
    () =>
      categoryOptions.filter((option) =>
        option.name.toLowerCase().includes(categorySearch.toLowerCase()),
      ),
    [categoryOptions, categorySearch],
  );

  const filteredAmcs = useMemo(
    () =>
      amcOptions.filter((option) =>
        option.name.toLowerCase().includes(amcSearch.toLowerCase()),
      ),
    [amcOptions, amcSearch],
  );

  const setField = (
    key: keyof FundFormState,
    value: FundFormState[keyof FundFormState],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [String(key)]: "" }));
  };

  const setMapField = (
    group:
      | "returnsTrailing"
      | "returnsAnnual"
      | "benchmarkTrailing"
      | "benchmarkAnnual",
    key: string,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] as Record<string, string>),
        [key]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, [`${group}.${key}`]: "" }));
  };

  const validateNumber = (
    value: string,
    label: string,
    min = -1000,
    max = 1000,
  ) => {
    if (value === "") return "";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return `${label} must be a number`;
    if (numericValue < min || numericValue > max) {
      return `${label} must be between ${min} and ${max}`;
    }
    return "";
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.scheme_code.trim())
      nextErrors.scheme_code = "Scheme code is required";
    if (!form.fund_name.trim()) nextErrors.fund_name = "Fund name is required";
    if (!form.amc_id) nextErrors.amc_id = "AMC is required";
    if (!form.category_id) nextErrors.category_id = "Category is required";
    if (form.scheme_code.length > 80)
      nextErrors.scheme_code = "Scheme code must be under 80 characters";
    if (form.fund_name.length > 200)
      nextErrors.fund_name = "Fund name must be under 200 characters";
    if (form.amc_name.length > 120)
      nextErrors.amc_name = "AMC name must be under 120 characters";
    if (form.fund_manager.length > 200)
      nextErrors.fund_manager = "Fund manager must be under 200 characters";
    if (form.benchmark_index_name.length > 200)
      nextErrors.benchmark_index_name =
        "Benchmark index name must be under 200 characters";
    if (form.exit_load.length > 500)
      nextErrors.exit_load = "Exit load must be under 500 characters";
    if (form.tax_type.length > 120)
      nextErrors.tax_type = "Tax type must be under 120 characters";
    if (form.riskometer_label.length > 120)
      nextErrors.riskometer_label =
        "Riskometer label must be under 120 characters";
    if (form.fund_objective.length > 5000)
      nextErrors.fund_objective =
        "Fund objective must be under 5000 characters";
    if (form.investment_strategy.length > 5000)
      nextErrors.investment_strategy =
        "Investment strategy must be under 5000 characters";

    const numericRules: Array<[keyof FundFormState, string, number, number]> = [
      ["aum_cr", "AUM (Cr)", 0, 1_000_000_000],
      ["expense_ratio", "Expense ratio", 0, 100],
      ["return_1d", "1 Day return", -1000, 1000],
      ["sharpe_3y", "Sharpe (3Y)", -1000, 1000],
      ["std_dev_3y", "Std Dev (3Y)", 0, 1000],
      ["beta_3y", "Beta (3Y)", -1000, 1000],
      ["alpha_3y", "Alpha (3Y)", -1000, 1000],
      ["max_drawdown_5y", "Max Drawdown (5Y)", -1000, 1000],
      ["turnover_ratio", "Turnover ratio", 0, 1000],
      ["min_investment", "Minimum investment", 0, 1_000_000_000],
      ["min_sip_investment", "Minimum SIP investment", 0, 1_000_000_000],
      [
        "min_lumpsum_investment",
        "Minimum lumpsum investment",
        0,
        1_000_000_000,
      ],
      ["equity_pct", "Equity allocation", 0, 100],
      ["debt_pct", "Debt allocation", 0, 100],
      ["other_pct", "Other allocation", 0, 100],
    ];

    for (const [field, label, min, max] of numericRules) {
      const message = validateNumber(
        String(form[field] ?? ""),
        label,
        min,
        max,
      );
      if (message) nextErrors[field] = message;
    }

    for (const field of FUND_TRAILING_FIELDS) {
      const message = validateNumber(
        form.returnsTrailing[field.key],
        field.label,
      );
      if (message) nextErrors[`returnsTrailing.${field.key}`] = message;
    }

    for (const field of BENCHMARK_TRAILING_FIELDS) {
      const message = validateNumber(
        form.benchmarkTrailing[field.key],
        `Benchmark ${field.label}`,
      );
      if (message) nextErrors[`benchmarkTrailing.${field.key}`] = message;
    }

    for (const year of ANNUAL_YEARS) {
      const fundAnnualError = validateNumber(form.returnsAnnual[year], year);
      if (fundAnnualError)
        nextErrors[`returnsAnnual.${year}`] = fundAnnualError;

      const benchmarkAnnualError = validateNumber(
        form.benchmarkAnnual[year],
        `Benchmark ${year}`,
      );
      if (benchmarkAnnualError) {
        nextErrors[`benchmarkAnnual.${year}`] = benchmarkAnnualError;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) scrollToFirstError(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const toNumberMap = (value: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(value).map(([key, rawValue]) => [
        key,
        rawValue === "" ? null : Number(rawValue),
      ]),
    );

  const applyApiErrors = (err: any) => {
    const apiErrors = err?.response?.data?.errors;
    const nextErrors: Record<string, string> = {};

    if (Array.isArray(apiErrors)) {
      apiErrors.forEach((item: any) => {
        const path = item?.path || item?.param;
        const message = item?.msg || "Invalid value";
        nextErrors[path === "amc_id" ? "amc_id" : path] = message;
      });
    }

    const message = getApiMessage(err);
    if (isDuplicateEntryMessage(message)) {
      if (!nextErrors.scheme_code) {
        nextErrors.scheme_code = toDuplicateFieldMessage(
          message,
          "Scheme code",
        );
      }
      if (!nextErrors.fund_name && /fund/i.test(message)) {
        nextErrors.fund_name = toDuplicateFieldMessage(message, "Fund name");
      }
    }

    if (Object.keys(nextErrors).length === 0) return false;
    setErrors(nextErrors);
    scrollToFirstError(nextErrors);
    return true;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      scheme_code: form.scheme_code.trim(),
      fund_name: form.fund_name.trim(),
      amc_id: form.amc_id,
      amc_name: form.amc_name.trim(),
      category_id: form.category_id,
      plan_type: form.plan_type,
      option_type: form.option_type,
      aum_cr: toNumberOrNull(form.aum_cr),
      expense_ratio: toNumberOrNull(form.expense_ratio),
      returns: {
        d1: toNumberOrNull(form.return_1d),
        ...toNumberMap(form.returnsTrailing),
        annual: toNumberMap(form.returnsAnnual),
      },
      risk_metrics: {
        sharpe_3y: toNumberOrNull(form.sharpe_3y),
        std_dev_3y: toNumberOrNull(form.std_dev_3y),
        beta_3y: toNumberOrNull(form.beta_3y),
        alpha_3y: toNumberOrNull(form.alpha_3y),
        max_drawdown_5y: toNumberOrNull(form.max_drawdown_5y),
        turnover_ratio: toNumberOrNull(form.turnover_ratio),
      },
      fund_manager: form.fund_manager.trim(),
      launch_date: form.launch_date ? form.launch_date.toISOString() : null,
      benchmark_index_name: form.benchmark_index_name.trim(),
      benchmark_returns_trailing: toNumberMap(form.benchmarkTrailing),
      benchmark_returns_annual: toNumberMap(form.benchmarkAnnual),
      min_investment: toNumberOrNull(form.min_investment),
      sip_allowed: form.sip_allowed,
      min_sip_investment: form.sip_allowed
        ? toNumberOrNull(form.min_sip_investment)
        : null,
      lumpsum_allowed: form.lumpsum_allowed,
      min_lumpsum_investment: form.lumpsum_allowed
        ? toNumberOrNull(form.min_lumpsum_investment)
        : null,
      exit_load: form.exit_load.trim(),
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      fund_objective: form.fund_objective.trim(),
      investment_strategy: form.investment_strategy.trim(),
      asset_allocation: {
        equity_pct: toNumberOrNull(form.equity_pct),
        debt_pct: toNumberOrNull(form.debt_pct),
        other_pct: toNumberOrNull(form.other_pct),
      },
      tax_type: form.tax_type.trim(),
      riskometer_label: form.riskometer_label.trim(),
      is_active: form.is_active,
    };

    try {
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/funds`);
    } catch (err: any) {
      const message = getApiMessage(err);
      if (applyApiErrors(err)) return;
      if (/e11000.*index:/i.test(message)) {
        toast.error(
          "Legacy database index conflict detected. Run MF index repair and try again.",
        );
        return;
      }
      toast.error(message || "Failed to save MF fund");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setErrors({});
  };

  const error = (message?: string) =>
    message ? <p className="mt-1 text-sm text-red-500">{message}</p> : null;
  const inputClass = (message?: string) =>
    `${mfInputClass} ${message ? "!border-red-500 focus:!border-red-500" : ""}`;
  const textAreaClass = (message?: string) =>
    `${mfTextAreaClass} ${message ? "!border-red-500 focus:!border-red-500" : ""}`;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF Fund`}
        onBack={() => navigate(`/${role}/mf/funds`)}
      />

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div ref={categoryWrapperRef} className="relative">
            <label className="mb-2 block font-medium text-gray-700">
              Category
            </label>
            <div
              onClick={() => setCategoryDropdownOpen((prev) => !prev)}
              className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 ${
                errors.category_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <span>
                {categoryOptions.find((item) => item._id === form.category_id)
                  ?.name || "Select Category"}
              </span>
              <svg
                className={`h-4 w-4 transform transition-transform ${
                  categoryDropdownOpen ? "rotate-180" : "rotate-0"
                }`}
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
            </div>
            {error(errors.category_id)}
            {categoryDropdownOpen ? (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
                <div className="relative border-b border-gray-200">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    className="h-11 w-full rounded-none border-0 pl-9 pr-3 focus:outline-none"
                  />
                </div>
                {filteredCategories.map((option) => (
                  <div
                    key={option._id}
                    onClick={() => {
                      setField("category_id", option._id);
                      setCategoryDropdownOpen(false);
                      setCategorySearch("");
                    }}
                    className={`cursor-pointer p-2 hover:bg-blue-100 ${
                      form.category_id === option._id
                        ? "bg-blue-50 font-medium"
                        : ""
                    }`}
                  >
                    {option.name}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Scheme Code
            </label>
            <input
              className={inputClass(errors.scheme_code)}
              value={form.scheme_code}
              onChange={(event) => setField("scheme_code", event.target.value)}
            />
            {error(errors.scheme_code)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Fund Name
            </label>
            <input
              className={inputClass(errors.fund_name)}
              value={form.fund_name}
              onChange={(event) => setField("fund_name", event.target.value)}
            />
            {error(errors.fund_name)}
          </div>

          <div ref={amcWrapperRef} className="relative">
            <label className="mb-2 block font-medium text-gray-700">AMC</label>
            <div
              onClick={() => setAmcDropdownOpen((prev) => !prev)}
              className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 ${
                errors.amc_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <span>
                {amcOptions.find((item) => item._id === form.amc_id)?.name ||
                  "Select AMC"}
              </span>
              <svg
                className={`h-4 w-4 transform transition-transform ${
                  amcDropdownOpen ? "rotate-180" : "rotate-0"
                }`}
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
            </div>
            {error(errors.amc_id || errors.amc_name)}
            {amcDropdownOpen ? (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
                <div className="relative border-b border-gray-200">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search AMC..."
                    value={amcSearch}
                    onChange={(event) => setAmcSearch(event.target.value)}
                    className="h-11 w-full rounded-none border-0 pl-9 pr-3 focus:outline-none"
                  />
                </div>
                {filteredAmcs.map((option) => (
                  <div
                    key={option._id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        amc_id: option._id,
                        amc_name: option.name,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        amc_id: "",
                        amc_name: "",
                      }));
                      setAmcDropdownOpen(false);
                      setAmcSearch("");
                    }}
                    className={`cursor-pointer p-2 hover:bg-blue-100 ${
                      form.amc_id === option._id ? "bg-blue-50 font-medium" : ""
                    }`}
                  >
                    {option.name}
                  </div>
                ))}
                {filteredAmcs.length === 0 ? (
                  <p className="p-2 text-sm text-gray-400">No AMC found.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Plan Type
            </label>
            <select
              className={inputClass(errors.plan_type)}
              value={form.plan_type}
              onChange={(event) => setField("plan_type", event.target.value)}
            >
              <option value="Regular">Regular</option>
              <option value="Direct">Direct</option>
            </select>
            {error(errors.plan_type)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Option Type
            </label>
            <select
              className={inputClass(errors.option_type)}
              value={form.option_type}
              onChange={(event) => setField("option_type", event.target.value)}
            >
              <option value="Growth">Growth</option>
              <option value="IDCW">IDCW</option>
            </select>
            {error(errors.option_type)}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#043f79]">
            Performance
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["aum_cr", "AUM (Cr)"],
              ["expense_ratio", "Expense Ratio"],
              ["return_1d", "1 Day Return"],
              ["sharpe_3y", "Sharpe (3Y)"],
              ["std_dev_3y", "Std Dev (3Y)"],
              ["beta_3y", "Beta (3Y)"],
              ["alpha_3y", "Alpha (3Y)"],
              ["max_drawdown_5y", "Max Drawdown (5Y)"],
              ["turnover_ratio", "Turnover Ratio"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="mb-2 block font-medium text-gray-700">
                  {label}
                </label>
                <input
                  className={inputClass(errors[key])}
                  value={String(form[key as keyof FundFormState] ?? "")}
                  onChange={(event) =>
                    setField(
                      key as keyof FundFormState,
                      event.target.value as never,
                    )
                  }
                />
                {error(errors[key])}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FUND_TRAILING_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-2 block font-medium text-gray-700">
                  {field.label}
                </label>
                <input
                  className={inputClass(errors[`returnsTrailing.${field.key}`])}
                  value={form.returnsTrailing[field.key]}
                  onChange={(event) =>
                    setMapField(
                      "returnsTrailing",
                      field.key,
                      event.target.value,
                    )
                  }
                />
                {error(errors[`returnsTrailing.${field.key}`])}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ANNUAL_YEARS.map((year) => (
              <div key={year}>
                <label className="mb-2 block font-medium text-gray-700">
                  {year}
                </label>
                <input
                  className={inputClass(errors[`returnsAnnual.${year}`])}
                  value={form.returnsAnnual[year]}
                  onChange={(event) =>
                    setMapField("returnsAnnual", year, event.target.value)
                  }
                />
                {error(errors[`returnsAnnual.${year}`])}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#043f79]">
            Fund Details
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Fund Manager
              </label>
              <input
                className={inputClass(errors.fund_manager)}
                value={form.fund_manager}
                onChange={(event) =>
                  setField("fund_manager", event.target.value)
                }
              />
              {error(errors.fund_manager)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Launch Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={form.launch_date}
                  onChange={(date) => setField("launch_date", date)}
                  dateFormat="dd/MM/yyyy"
                  className={`${inputClass(errors.launch_date)} pr-10`}
                  placeholderText="dd/mm/yyyy"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              {error(errors.launch_date)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Benchmark Index Name
              </label>
              <input
                className={inputClass(errors.benchmark_index_name)}
                value={form.benchmark_index_name}
                onChange={(event) =>
                  setField("benchmark_index_name", event.target.value)
                }
              />
              {error(errors.benchmark_index_name)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Tax Type
              </label>
              <input
                className={inputClass(errors.tax_type)}
                value={form.tax_type}
                onChange={(event) => setField("tax_type", event.target.value)}
              />
              {error(errors.tax_type)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Riskometer Label
              </label>
              <input
                className={inputClass(errors.riskometer_label)}
                value={form.riskometer_label}
                onChange={(event) =>
                  setField("riskometer_label", event.target.value)
                }
              />
              {error(errors.riskometer_label)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Minimum Investment
              </label>
              <input
                className={inputClass(errors.min_investment)}
                value={form.min_investment}
                onChange={(event) =>
                  setField("min_investment", event.target.value)
                }
              />
              {error(errors.min_investment)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Minimum SIP Investment
              </label>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <input
                  className={mfCheckboxClass}
                  type="checkbox"
                  checked={form.sip_allowed}
                  onChange={(event) => {
                    setField("sip_allowed", event.target.checked);
                    if (!event.target.checked) {
                      setField("min_sip_investment", "");
                    }
                  }}
                />
                SIP allowed
              </div>
              <input
                className={inputClass(errors.min_sip_investment)}
                disabled={!form.sip_allowed}
                value={form.min_sip_investment}
                onChange={(event) =>
                  setField("min_sip_investment", event.target.value)
                }
              />
              {error(errors.min_sip_investment)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Minimum Lumpsum Investment
              </label>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <input
                  className={mfCheckboxClass}
                  type="checkbox"
                  checked={form.lumpsum_allowed}
                  onChange={(event) => {
                    setField("lumpsum_allowed", event.target.checked);
                    if (!event.target.checked) {
                      setField("min_lumpsum_investment", "");
                    }
                  }}
                />
                Lumpsum allowed
              </div>
              <input
                className={inputClass(errors.min_lumpsum_investment)}
                disabled={!form.lumpsum_allowed}
                value={form.min_lumpsum_investment}
                onChange={(event) =>
                  setField("min_lumpsum_investment", event.target.value)
                }
              />
              {error(errors.min_lumpsum_investment)}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block font-medium text-gray-700">
              Exit Load
            </label>
            <textarea
              className={textAreaClass(errors.exit_load)}
              rows={3}
              value={form.exit_load}
              onChange={(event) => setField("exit_load", event.target.value)}
            />
            {error(errors.exit_load)}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#043f79]">
            Benchmark Returns
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BENCHMARK_TRAILING_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-2 block font-medium text-gray-700">
                  {field.label}
                </label>
                <input
                  className={inputClass(
                    errors[`benchmarkTrailing.${field.key}`],
                  )}
                  value={form.benchmarkTrailing[field.key]}
                  onChange={(event) =>
                    setMapField(
                      "benchmarkTrailing",
                      field.key,
                      event.target.value,
                    )
                  }
                />
                {error(errors[`benchmarkTrailing.${field.key}`])}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ANNUAL_YEARS.map((year) => (
              <div key={year}>
                <label className="mb-2 block font-medium text-gray-700">
                  {year}
                </label>
                <input
                  className={inputClass(errors[`benchmarkAnnual.${year}`])}
                  value={form.benchmarkAnnual[year]}
                  onChange={(event) =>
                    setMapField("benchmarkAnnual", year, event.target.value)
                  }
                />
                {error(errors[`benchmarkAnnual.${year}`])}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#043f79]">
            Content and Allocation
          </h3>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Fund Objective
              </label>
              <textarea
                className={textAreaClass(errors.fund_objective)}
                rows={4}
                value={form.fund_objective}
                onChange={(event) =>
                  setField("fund_objective", event.target.value)
                }
              />
              {error(errors.fund_objective)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Investment Strategy
              </label>
              <textarea
                className={textAreaClass(errors.investment_strategy)}
                rows={4}
                value={form.investment_strategy}
                onChange={(event) =>
                  setField("investment_strategy", event.target.value)
                }
              />
              {error(errors.investment_strategy)}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ["equity_pct", "Equity %"],
                ["debt_pct", "Debt %"],
                ["other_pct", "Other %"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-2 block font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    className={inputClass(errors[key])}
                    value={String(form[key as keyof FundFormState] ?? "")}
                    onChange={(event) =>
                      setField(
                        key as keyof FundFormState,
                        event.target.value as never,
                      )
                    }
                  />
                  {error(errors[key])}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 font-medium text-gray-700">
            <input
              className={mfCheckboxClass}
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) =>
                setField("is_featured", event.target.checked)
              }
            />
            Featured
          </label>
          <label className="flex items-center gap-3 font-medium text-gray-700">
            <input
              className={mfCheckboxClass}
              type="checkbox"
              checked={form.is_popular}
              onChange={(event) => setField("is_popular", event.target.checked)}
            />
            Popular
          </label>
          <label className="flex items-center gap-3 font-medium text-gray-700">
            <input
              className={mfCheckboxClass}
              type="checkbox"
              checked={form.is_active === 1}
              onChange={(event) =>
                setField("is_active", event.target.checked ? 1 : 0)
              }
            />
            Active
          </label>
        </div>

        <MFFormActions
          onReset={resetForm}
          isSubmitting={saving}
          submitLabel={id ? "Update" : "Save"}
        />
      </form>
    </MFFormContainer>
  );
}
