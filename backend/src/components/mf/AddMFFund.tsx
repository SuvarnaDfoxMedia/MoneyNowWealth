import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCalendar, FiSearch } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import { axiosApi } from "../../api/axios";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
  mfTextAreaClass,
} from "./MFFormShared";
import { getApiMessage, isDuplicateEntryMessage, toDuplicateFieldMessage } from "./mfValidation";

const emptyForm = {
  scheme_code: "",
  fund_name: "",
  amc_name: "",
  category_id: "",
  plan_type: "Regular",
  option_type: "Growth",
  aum_cr: "",
  expense_ratio: "",
  d1: "0",
  m1: "0",
  m3: "0",
  m6: "0",
  y1: "",
  y3_cagr: "",
  y5_cagr: "",
  y10_cagr: "",
  sharpe_3y: "",
  std_dev_3y: "",
  beta_3y: "",
  alpha_3y: "",
  max_drawdown_5y: "",
  turnover_ratio: "",
  fund_manager: "",
  launch_date: null as Date | null,
  benchmark_index_name: "",
  benchmark_trailing_d1: "0",
  benchmark_trailing_m1: "0",
  benchmark_trailing_m3: "0",
  benchmark_trailing_m6: "0",
  benchmark_trailing_y1: "",
  benchmark_trailing_y3: "",
  benchmark_trailing_y5: "",
  benchmark_trailing_y10: "",
  benchmark_annual_y1: "",
  benchmark_annual_y3: "",
  benchmark_annual_y5: "",
  benchmark_annual_y10: "",
  min_investment: "",
  sip_allowed: true,
  min_sip_investment: "",
  lumpsum_allowed: true,
  min_lumpsum_investment: "",
  exit_load: "",
  fund_objective: "",
  investment_strategy: "",
  top_holdings: "",
  equity_pct: "",
  debt_pct: "",
  other_pct: "",
  tax_type: "",
  riskometer_label: "",
  is_featured: false,
  is_popular: false,
  is_active: 1,
};

type FundFormState = typeof emptyForm;

interface FundDuplicateCandidate {
  _id?: string;
  scheme_code?: string;
  fund_name?: string;
  plan_type?: string;
  option_type?: string;
}

export default function AddMFFund() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/funds",
    listKey: "data",
  });

  const [form, setForm] = useState<FundFormState>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FundFormState, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { _id: string; name: string }[]
  >([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryWrapperRef = useRef<HTMLDivElement>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const normalizeValue = (value: string | undefined | null) =>
    String(value ?? "").trim().toLowerCase();

  useEffect(() => {
    (async () => {
      const res: any = await axiosApi.get(`/${role}/mf/categories`, {
        limit: 5000,
        page: 1,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      setCategoryOptions(items);
    })();
  }, [role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        scheme_code: d.scheme_code || "",
        fund_name: d.fund_name || "",
        amc_name: d.amc_id?.name || "",
        category_id: d.category_id?._id || "",
        plan_type: d.plan_type || "Regular",
        option_type: d.option_type || "Growth",
        aum_cr: d.aum_cr?.toString?.() || "",
        expense_ratio: d.expense_ratio?.toString?.() || "",
        d1: d.returns?.d1?.toString?.() || "0",
        m1: d.returns?.m1?.toString?.() || "0",
        m3: d.returns?.m3?.toString?.() || "0",
        m6: d.returns?.m6?.toString?.() || "0",
        y1: d.returns?.y1?.toString?.() || "",
        y3_cagr: d.returns?.y3_cagr?.toString?.() || "",
        y5_cagr: d.returns?.y5_cagr?.toString?.() || "",
        y10_cagr: d.returns?.y10_cagr?.toString?.() || "",
        sharpe_3y: d.risk_metrics?.sharpe_3y?.toString?.() || "",
        std_dev_3y: d.risk_metrics?.std_dev_3y?.toString?.() || "",
        beta_3y: d.risk_metrics?.beta_3y?.toString?.() || "",
        alpha_3y: d.risk_metrics?.alpha_3y?.toString?.() || "",
        max_drawdown_5y: d.risk_metrics?.max_drawdown_5y?.toString?.() || "",
        turnover_ratio: d.risk_metrics?.turnover_ratio?.toString?.() || "",
        fund_manager: d.fund_manager || "",
        launch_date: d.launch_date ? new Date(d.launch_date) : null,
        benchmark_index_name: d.benchmark_index_name || "",
        benchmark_trailing_d1:
          d.benchmark_returns_trailing?.d1?.toString?.() || "0",
        benchmark_trailing_m1:
          d.benchmark_returns_trailing?.m1?.toString?.() || "0",
        benchmark_trailing_m3:
          d.benchmark_returns_trailing?.m3?.toString?.() || "0",
        benchmark_trailing_m6:
          d.benchmark_returns_trailing?.m6?.toString?.() || "0",
        benchmark_trailing_y1:
          d.benchmark_returns_trailing?.y1?.toString?.() || "",
        benchmark_trailing_y3:
          d.benchmark_returns_trailing?.y3?.toString?.() || "",
        benchmark_trailing_y5:
          d.benchmark_returns_trailing?.y5?.toString?.() || "",
        benchmark_trailing_y10:
          d.benchmark_returns_trailing?.y10?.toString?.() || "",
        benchmark_annual_y1: d.benchmark_returns_annual?.y1?.toString?.() || "",
        benchmark_annual_y3: d.benchmark_returns_annual?.y3?.toString?.() || "",
        benchmark_annual_y5: d.benchmark_returns_annual?.y5?.toString?.() || "",
        benchmark_annual_y10:
          d.benchmark_returns_annual?.y10?.toString?.() || "",
        min_investment: d.min_investment?.toString?.() || "",
        sip_allowed: d.sip_allowed ?? true,
        min_sip_investment: d.min_sip_investment?.toString?.() || "",
        lumpsum_allowed: d.lumpsum_allowed ?? true,
        min_lumpsum_investment: d.min_lumpsum_investment?.toString?.() || "",
        exit_load: d.exit_load || "",
        fund_objective: d.fund_objective || "",
        investment_strategy: d.investment_strategy || "",
        top_holdings: Array.isArray(d.top_holdings)
          ? d.top_holdings.join(", ")
          : "",
        equity_pct: d.asset_allocation?.equity_pct?.toString?.() || "",
        debt_pct: d.asset_allocation?.debt_pct?.toString?.() || "",
        other_pct: d.asset_allocation?.other_pct?.toString?.() || "",
        tax_type: d.tax_type || "",
        riskometer_label: d.riskometer_label || "",
        is_featured: !!d.is_featured,
        is_popular: !!d.is_popular,
        is_active: d.is_active ?? 1,
      });
    })();
  }, [getOne, id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const setField = <K extends keyof FundFormState>(
    key: K,
    value: FundFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateNumber = (
    value: string,
    label: string,
    min = -1000,
    max = 1000,
  ) => {
    if (value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return `${label} must be a number`;
    if (num < min || num > max) {
      return `${label} must be between ${min} and ${max}`;
    }
    return "";
  };

  const validate = () => {
    const next: Partial<Record<keyof FundFormState, string>> = {};

    if (!form.scheme_code.trim()) next.scheme_code = "Scheme code is required";
    if (form.scheme_code.trim().length > 80) {
      next.scheme_code = "Scheme code must be under 80 characters";
    }
    if (!form.category_id) next.category_id = "Category is required";
    if (!form.fund_name.trim()) next.fund_name = "Fund name is required";
    if (form.fund_name.trim().length > 200) {
      next.fund_name = "Fund name must be under 200 characters";
    }
    if (!form.amc_name.trim()) next.amc_name = "AMC name is required";
    if (form.amc_name.trim().length > 120) {
      next.amc_name = "AMC name must be under 120 characters";
    }
    if (!form.plan_type) next.plan_type = "Plan type is required";
    if (!form.option_type) next.option_type = "Option type is required";

    const numericRules: Array<[keyof FundFormState, string, number, number]> = [
      ["aum_cr", "AUM (Cr)", 0, 1_000_000_000],
      ["expense_ratio", "Expense ratio", 0, 100],
      ["d1", "1D return", -1000, 1000],
      ["m1", "1M return", -1000, 1000],
      ["m3", "3M return", -1000, 1000],
      ["m6", "6M return", -1000, 1000],
      ["y1", "1Y return", -1000, 1000],
      ["y3_cagr", "3Y CAGR", -1000, 1000],
      ["y5_cagr", "5Y CAGR", -1000, 1000],
      ["y10_cagr", "10Y CAGR", -1000, 1000],
      ["sharpe_3y", "Sharpe (3Y)", -1000, 1000],
      ["std_dev_3y", "Std Dev (3Y)", 0, 1000],
      ["beta_3y", "Beta (3Y)", -1000, 1000],
      ["alpha_3y", "Alpha (3Y)", -1000, 1000],
      ["max_drawdown_5y", "Max Drawdown (5Y)", -1000, 1000],
      ["turnover_ratio", "Turnover ratio", 0, 1000],
      ["benchmark_trailing_d1", "Benchmark trailing 1D return", -1000, 1000],
      ["benchmark_trailing_m1", "Benchmark trailing 1M return", -1000, 1000],
      ["benchmark_trailing_m3", "Benchmark trailing 3M return", -1000, 1000],
      ["benchmark_trailing_m6", "Benchmark trailing 6M return", -1000, 1000],
      ["benchmark_trailing_y1", "Benchmark trailing 1Y return", -1000, 1000],
      ["benchmark_trailing_y3", "Benchmark trailing 3Y return", -1000, 1000],
      ["benchmark_trailing_y5", "Benchmark trailing 5Y return", -1000, 1000],
      ["benchmark_trailing_y10", "Benchmark trailing 10Y return", -1000, 1000],
      ["benchmark_annual_y1", "Benchmark annual 1Y return", -1000, 1000],
      ["benchmark_annual_y3", "Benchmark annual 3Y return", -1000, 1000],
      ["benchmark_annual_y5", "Benchmark annual 5Y return", -1000, 1000],
      ["benchmark_annual_y10", "Benchmark annual 10Y return", -1000, 1000],
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

    numericRules.forEach(([field, label, min, max]) => {
      const message = validateNumber(
        String(form[field] ?? ""),
        label,
        min,
        max,
      );
      if (message) next[field] = message;
    });

    if (form.fund_manager.length > 200) {
      next.fund_manager = "Fund manager must be under 200 characters";
    }
    if (form.benchmark_index_name.length > 200) {
      next.benchmark_index_name =
        "Benchmark index name must be under 200 characters";
    }
    if (form.exit_load.length > 500) {
      next.exit_load = "Exit load must be under 500 characters";
    }
    if (form.tax_type.length > 120) {
      next.tax_type = "Tax type must be under 120 characters";
    }
    if (form.riskometer_label.length > 120) {
      next.riskometer_label = "Riskometer label must be under 120 characters";
    }
    if (form.fund_objective.length > 5000) {
      next.fund_objective = "Fund objective must be under 5000 characters";
    }
    if (form.investment_strategy.length > 5000) {
      next.investment_strategy =
        "Investment strategy must be under 5000 characters";
    }
    if (form.top_holdings.length > 1000) {
      next.top_holdings = "Top holdings must be under 1000 characters";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) scrollToFirstError(next);
    return Object.keys(next).length === 0;
  };

  const applyApiErrors = (err: any) => {
    const apiErrors = err?.response?.data?.errors;
    const next: Partial<Record<keyof FundFormState, string>> = {};

    if (Array.isArray(apiErrors)) {
      apiErrors.forEach((e: any) => {
        const field = e?.path || e?.param;
        const msg = e?.msg || "Invalid value";

        if (field === "scheme_code") next.scheme_code = msg;
        if (field === "fund_name") next.fund_name = msg;
        if (field === "amc_name" || field === "amc_id") next.amc_name = msg;
        if (field === "category_id") next.category_id = msg;
        if (field === "plan_type") next.plan_type = msg;
        if (field === "option_type") next.option_type = msg;
        if (field === "aum_cr") next.aum_cr = msg;
        if (field === "expense_ratio") next.expense_ratio = msg;
        if (field === "returns.d1") next.d1 = msg;
        if (field === "returns.m1") next.m1 = msg;
        if (field === "returns.m3") next.m3 = msg;
        if (field === "returns.m6") next.m6 = msg;
        if (field === "returns.y1") next.y1 = msg;
        if (field === "returns.y3_cagr") next.y3_cagr = msg;
        if (field === "returns.y5_cagr") next.y5_cagr = msg;
        if (field === "returns.y10_cagr") next.y10_cagr = msg;
        if (field === "risk_metrics.sharpe_3y") next.sharpe_3y = msg;
        if (field === "risk_metrics.std_dev_3y") next.std_dev_3y = msg;
        if (field === "risk_metrics.beta_3y") next.beta_3y = msg;
        if (field === "risk_metrics.alpha_3y") next.alpha_3y = msg;
        if (field === "risk_metrics.max_drawdown_5y") next.max_drawdown_5y = msg;
        if (field === "risk_metrics.turnover_ratio") next.turnover_ratio = msg;
        if (field === "fund_manager") next.fund_manager = msg;
        if (field === "launch_date") next.launch_date = msg;
        if (field === "benchmark_index_name") next.benchmark_index_name = msg;
        if (field === "benchmark_returns_trailing.d1")
          next.benchmark_trailing_d1 = msg;
        if (field === "benchmark_returns_trailing.m1")
          next.benchmark_trailing_m1 = msg;
        if (field === "benchmark_returns_trailing.m3")
          next.benchmark_trailing_m3 = msg;
        if (field === "benchmark_returns_trailing.m6")
          next.benchmark_trailing_m6 = msg;
        if (field === "benchmark_returns_trailing.y1")
          next.benchmark_trailing_y1 = msg;
        if (field === "benchmark_returns_trailing.y3")
          next.benchmark_trailing_y3 = msg;
        if (field === "benchmark_returns_trailing.y5")
          next.benchmark_trailing_y5 = msg;
        if (field === "benchmark_returns_trailing.y10")
          next.benchmark_trailing_y10 = msg;
        if (field === "benchmark_returns_annual.y1")
          next.benchmark_annual_y1 = msg;
        if (field === "benchmark_returns_annual.y3")
          next.benchmark_annual_y3 = msg;
        if (field === "benchmark_returns_annual.y5")
          next.benchmark_annual_y5 = msg;
        if (field === "benchmark_returns_annual.y10")
          next.benchmark_annual_y10 = msg;
        if (field === "min_investment") next.min_investment = msg;
        if (field === "sip_allowed") next.sip_allowed = msg;
        if (field === "min_sip_investment") next.min_sip_investment = msg;
        if (field === "lumpsum_allowed") next.lumpsum_allowed = msg;
        if (field === "min_lumpsum_investment") next.min_lumpsum_investment = msg;
        if (field === "exit_load") next.exit_load = msg;
        if (field === "fund_objective") next.fund_objective = msg;
        if (field === "investment_strategy") next.investment_strategy = msg;
        if (field === "tax_type") next.tax_type = msg;
        if (field === "riskometer_label") next.riskometer_label = msg;
        if (field === "asset_allocation.equity_pct") next.equity_pct = msg;
        if (field === "asset_allocation.debt_pct") next.debt_pct = msg;
        if (field === "asset_allocation.other_pct") next.other_pct = msg;
      });
    }

    const message = getApiMessage(err);
    if (isDuplicateEntryMessage(message)) {
      if (!next.scheme_code) {
        next.scheme_code = toDuplicateFieldMessage(message, "Scheme code");
      }
      if (!next.fund_name && /fund/i.test(message)) {
        next.fund_name = toDuplicateFieldMessage(message, "Fund name");
      }
    }

    if (Object.keys(next).length === 0) return false;
    setErrors(next);
    scrollToFirstError(next);
    return true;
  };

  const toNumberOrNull = (value: string) =>
    value === "" ? null : Number(value);

  const findDuplicateFund = async () => {
    const schemeCode = form.scheme_code.trim();
    const fundName = form.fund_name.trim();
    const planType = form.plan_type.trim();
    const optionType = form.option_type.trim();

    const res: any = await axiosApi.get(`/${role}/mf/funds`, {
      page: 1,
      limit: 1000,
      search: schemeCode || fundName,
    });

    const records = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.items)
        ? res.items
        : [];

    return (records as FundDuplicateCandidate[]).find((record) => {
      if (record?._id === id) return false;

      const sameSchemeCode =
        normalizeValue(record?.scheme_code) === normalizeValue(schemeCode);

      const sameFundCombination =
        normalizeValue(record?.fund_name) === normalizeValue(fundName) &&
        normalizeValue(record?.plan_type) === normalizeValue(planType) &&
        normalizeValue(record?.option_type) === normalizeValue(optionType);

      return sameSchemeCode || sameFundCombination;
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      scheme_code: form.scheme_code.trim(),
      fund_name: form.fund_name.trim(),
      amc_name: form.amc_name.trim(),
      category_id: form.category_id,
      plan_type: form.plan_type,
      option_type: form.option_type,
      aum_cr: toNumberOrNull(form.aum_cr),
      expense_ratio: toNumberOrNull(form.expense_ratio),
      returns: {
        d1: toNumberOrNull(form.d1) ?? 0,
        m1: toNumberOrNull(form.m1) ?? 0,
        m3: toNumberOrNull(form.m3) ?? 0,
        m6: toNumberOrNull(form.m6) ?? 0,
        y1: toNumberOrNull(form.y1),
        y3_cagr: toNumberOrNull(form.y3_cagr),
        y5_cagr: toNumberOrNull(form.y5_cagr),
        y10_cagr: toNumberOrNull(form.y10_cagr),
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
      benchmark_returns_trailing: {
        d1: toNumberOrNull(form.benchmark_trailing_d1) ?? 0,
        m1: toNumberOrNull(form.benchmark_trailing_m1) ?? 0,
        m3: toNumberOrNull(form.benchmark_trailing_m3) ?? 0,
        m6: toNumberOrNull(form.benchmark_trailing_m6) ?? 0,
        y1: toNumberOrNull(form.benchmark_trailing_y1),
        y3: toNumberOrNull(form.benchmark_trailing_y3),
        y5: toNumberOrNull(form.benchmark_trailing_y5),
        y10: toNumberOrNull(form.benchmark_trailing_y10),
      },
      benchmark_returns_annual: {
        y1: toNumberOrNull(form.benchmark_annual_y1),
        y3: toNumberOrNull(form.benchmark_annual_y3),
        y5: toNumberOrNull(form.benchmark_annual_y5),
        y10: toNumberOrNull(form.benchmark_annual_y10),
      },
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
      fund_objective: form.fund_objective.trim(),
      investment_strategy: form.investment_strategy.trim(),
      top_holdings: form.top_holdings,
      asset_allocation: {
        equity_pct: toNumberOrNull(form.equity_pct),
        debt_pct: toNumberOrNull(form.debt_pct),
        other_pct: toNumberOrNull(form.other_pct),
      },
      tax_type: form.tax_type.trim(),
      riskometer_label: form.riskometer_label.trim(),
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      is_active: form.is_active,
    };

    try {
      const duplicateFund = await findDuplicateFund();
      if (duplicateFund) {
        const nextErrors: Partial<Record<keyof FundFormState, string>> = {};

        if (
          normalizeValue(duplicateFund.scheme_code) ===
          normalizeValue(payload.scheme_code)
        ) {
          nextErrors.scheme_code = "Scheme code already exists";
        }

        if (
          normalizeValue(duplicateFund.fund_name) ===
            normalizeValue(payload.fund_name) &&
          normalizeValue(duplicateFund.plan_type) ===
            normalizeValue(payload.plan_type) &&
          normalizeValue(duplicateFund.option_type) ===
            normalizeValue(payload.option_type)
        ) {
          nextErrors.fund_name =
            "Fund with same name, plan type, and option type already exists";
        }

        setErrors((prev) => ({ ...prev, ...nextErrors }));
        scrollToFirstError(nextErrors);
        return;
      }

      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/funds`);
    } catch (err: any) {
      if (applyApiErrors(err)) return;
      toast.error(getApiMessage(err) || "Failed to save MF fund");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
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
                  {categoryOptions.length === 0
                    ? "Loading categories..."
                    : categoryOptions.find(
                        (item) => item._id === form.category_id,
                      )?.name || "Select Category"}
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
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-11 w-full rounded-none border-0 pl-9 pr-3 focus:outline-none"
                    />
                  </div>
                  {categoryOptions
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(categorySearch.toLowerCase()),
                    )
                    .map((item) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          setField("category_id", item._id);
                          setCategoryDropdownOpen(false);
                          setCategorySearch("");
                        }}
                        className={`cursor-pointer p-2 hover:bg-blue-100 ${
                          form.category_id === item._id
                            ? "bg-blue-50 font-medium"
                            : ""
                        }`}
                      >
                        {item.name}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="scheme_code"
              className="mb-2 block font-medium text-gray-700"
            >
              Scheme Code
            </label>
            <input
              id="scheme_code"
              className={inputClass(errors.scheme_code)}
              placeholder="Scheme Code"
              value={form.scheme_code}
              onChange={(e) => setField("scheme_code", e.target.value)}
            />
            {error(errors.scheme_code)}
          </div>

          <div>
            <label
              htmlFor="fund_name"
              className="mb-2 block font-medium text-gray-700"
            >
              Fund Name
            </label>
            <input
              id="fund_name"
              className={inputClass(errors.fund_name)}
              placeholder="Fund Name"
              value={form.fund_name}
              onChange={(e) => setField("fund_name", e.target.value)}
            />
            {error(errors.fund_name)}
          </div>

          <div>
            <label
              htmlFor="amc_name"
              className="mb-2 block font-medium text-gray-700"
            >
              AMC Name
            </label>
            <input
              id="amc_name"
              className={inputClass(errors.amc_name)}
              placeholder="AMC Name"
              value={form.amc_name}
              onChange={(e) => setField("amc_name", e.target.value)}
            />
            {error(errors.amc_name)}
          </div>

          <div>
            <label
              htmlFor="plan_type"
              className="mb-2 block font-medium text-gray-700"
            >
              Plan Type
            </label>
            <select
              id="plan_type"
              className={inputClass(errors.plan_type)}
              value={form.plan_type}
              onChange={(e) => setField("plan_type", e.target.value)}
            >
              <option value="">Select Plan Type</option>
              <option value="Regular">Regular</option>
              <option value="Direct">Direct</option>
            </select>
            {error(errors.plan_type)}
          </div>

          <div>
            <label
              htmlFor="option_type"
              className="mb-2 block font-medium text-gray-700"
            >
              Option Type
            </label>
            <select
              id="option_type"
              className={inputClass(errors.option_type)}
              value={form.option_type}
              onChange={(e) => setField("option_type", e.target.value)}
            >
              <option value="">Select Option Type</option>
              <option value="Growth">Growth</option>
              <option value="IDCW">IDCW</option>
            </select>
            {error(errors.option_type)}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#043f79]">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["aum_cr", "AUM (Cr)"],
              ["expense_ratio", "Expense Ratio"],
              ["d1", "1D Return"],
              ["m1", "1M Return"],
              ["m3", "3M Return"],
              ["m6", "6M Return"],
              ["y1", "1Y Return"],
              ["y3_cagr", "3Y CAGR"],
              ["y5_cagr", "5Y CAGR"],
              ["y10_cagr", "10Y CAGR"],
              ["sharpe_3y", "Sharpe (3Y)"],
              ["std_dev_3y", "Std Dev (3Y)"],
              ["beta_3y", "Beta (3Y)"],
              ["alpha_3y", "Alpha (3Y)"],
              ["max_drawdown_5y", "Max Drawdown (5Y)"],
              ["turnover_ratio", "Turnover Ratio"],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block font-medium text-gray-700">
                  {label}
                </label>
                <input
                  className={inputClass(errors[field as keyof FundFormState])}
                  placeholder={label}
                  value={form[field as keyof FundFormState] as string}
                  onChange={(e) =>
                    setField(
                      field as keyof FundFormState,
                      e.target.value as never,
                    )
                  }
                />
                {error(errors[field as keyof FundFormState])}
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
              <label
                htmlFor="fund_manager"
                className="mb-2 block font-medium text-gray-700"
              >
                Fund Manager
              </label>
              <input
                id="fund_manager"
                className={inputClass(errors.fund_manager)}
                placeholder="Fund Manager"
                value={form.fund_manager}
                onChange={(e) => setField("fund_manager", e.target.value)}
              />
              {error(errors.fund_manager)}
            </div>

            <div>
              <label
                htmlFor="launch_date"
                className="mb-2 block font-medium text-gray-700"
              >
                Launch Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={form.launch_date}
                  onChange={(date) => {
                    setForm((prev) => ({ ...prev, launch_date: date }));
                    setErrors((prev) => ({ ...prev, launch_date: "" }));
                  }}
                  dateFormat="dd/MM/yyyy"
                  className={`${inputClass(errors.launch_date)} pr-10`}
                  placeholderText="dd/mm/yyyy"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              {error(errors.launch_date)}
            </div>

            <div>
              <label
                htmlFor="benchmark_index_name"
                className="mb-2 block font-medium text-gray-700"
              >
                Benchmark Index Name
              </label>
              <input
                id="benchmark_index_name"
                className={inputClass(errors.benchmark_index_name)}
                placeholder="Benchmark Index Name"
                value={form.benchmark_index_name}
                onChange={(e) =>
                  setField("benchmark_index_name", e.target.value)
                }
              />
              {error(errors.benchmark_index_name)}
            </div>

            {/* <div>
              <label className="mb-2 block font-medium text-gray-700">
                Minimum Investment
              </label>
              <input
                className={inputClass(errors.min_investment)}
                placeholder="Minimum Investment"
                value={form.min_investment}
                onChange={(e) => setField("min_investment", e.target.value)}
              />
              {error(errors.min_investment)}
            </div> */}

            <div>
              <label
                htmlFor="tax_type"
                className="mb-2 block font-medium text-gray-700"
              >
                Tax Type
              </label>
              <input
                id="tax_type"
                className={inputClass(errors.tax_type)}
                placeholder="Tax Type"
                value={form.tax_type}
                onChange={(e) => setField("tax_type", e.target.value)}
              />
              {error(errors.tax_type)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Minimum SIP Investment
              </label>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <input
                  className={mfCheckboxClass}
                  type="checkbox"
                  checked={form.sip_allowed}
                  onChange={(e) => {
                    setField("sip_allowed", e.target.checked);
                    if (!e.target.checked) setField("min_sip_investment", "");
                  }}
                />
                SIP allowed
              </div>
              <input
                className={inputClass(errors.min_sip_investment)}
                placeholder="Minimum SIP Investment"
                value={form.min_sip_investment}
                disabled={!form.sip_allowed}
                onChange={(e) => setField("min_sip_investment", e.target.value)}
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
                  onChange={(e) => {
                    setField("lumpsum_allowed", e.target.checked);
                    if (!e.target.checked)
                      setField("min_lumpsum_investment", "");
                  }}
                />
                Lumpsum allowed
              </div>
              <input
                className={inputClass(errors.min_lumpsum_investment)}
                placeholder="Minimum Lumpsum Investment"
                value={form.min_lumpsum_investment}
                disabled={!form.lumpsum_allowed}
                onChange={(e) =>
                  setField("min_lumpsum_investment", e.target.value)
                }
              />
              {error(errors.min_lumpsum_investment)}
            </div>

            <div>
              <label
                htmlFor="exit_load"
                className="mb-2 block font-medium text-gray-700"
              >
                Exit Load
              </label>
              <input
                id="exit_load"
                className={inputClass(errors.exit_load)}
                placeholder="Exit Load"
                value={form.exit_load}
                onChange={(e) => setField("exit_load", e.target.value)}
              />
              {error(errors.exit_load)}
            </div>

            <div>
              <label
                htmlFor="riskometer_label"
                className="mb-2 block font-medium text-gray-700"
              >
                Riskometer Label
              </label>
              <input
                id="riskometer_label"
                className={inputClass(errors.riskometer_label)}
                placeholder="Riskometer Label"
                value={form.riskometer_label}
                onChange={(e) => setField("riskometer_label", e.target.value)}
              />
              {error(errors.riskometer_label)}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#043f79]">
            Benchmark Returns
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                Trailing
              </h4>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  ["benchmark_trailing_d1", "1D"],
                  ["benchmark_trailing_m1", "1M"],
                  ["benchmark_trailing_m3", "3M"],
                  ["benchmark_trailing_m6", "6M"],
                  ["benchmark_trailing_y1", "1Y"],
                  ["benchmark_trailing_y3", "3Y"],
                  ["benchmark_trailing_y5", "5Y"],
                  ["benchmark_trailing_y10", "10Y"],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-2 block font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      className={inputClass(
                        errors[field as keyof FundFormState],
                      )}
                      placeholder={label}
                      value={form[field as keyof FundFormState] as string}
                      onChange={(e) =>
                        setField(
                          field as keyof FundFormState,
                          e.target.value as never,
                        )
                      }
                    />
                    {error(errors[field as keyof FundFormState])}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                Annual
              </h4>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  ["benchmark_annual_y1", "1Y"],
                  ["benchmark_annual_y3", "3Y"],
                  ["benchmark_annual_y5", "5Y"],
                  ["benchmark_annual_y10", "10Y"],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-2 block font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      className={inputClass(
                        errors[field as keyof FundFormState],
                      )}
                      placeholder={label}
                      value={form[field as keyof FundFormState] as string}
                      onChange={(e) =>
                        setField(
                          field as keyof FundFormState,
                          e.target.value as never,
                        )
                      }
                    />
                    {error(errors[field as keyof FundFormState])}
                  </div>
                ))}
              </div>
            </div>
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
                placeholder="Fund Objective"
                value={form.fund_objective}
                onChange={(e) => setField("fund_objective", e.target.value)}
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
                placeholder="Investment Strategy"
                value={form.investment_strategy}
                onChange={(e) =>
                  setField("investment_strategy", e.target.value)
                }
              />
              {error(errors.investment_strategy)}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Top Holdings
              </label>
              <textarea
                className={textAreaClass(errors.top_holdings)}
                rows={3}
                placeholder="Comma separated holdings"
                value={form.top_holdings}
                onChange={(e) => setField("top_holdings", e.target.value)}
              />
              {error(errors.top_holdings)}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Equity %
                </label>
                <input
                  className={inputClass(errors.equity_pct)}
                  placeholder="Equity %"
                  value={form.equity_pct}
                  onChange={(e) => setField("equity_pct", e.target.value)}
                />
                {error(errors.equity_pct)}
              </div>
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Debt %
                </label>
                <input
                  className={inputClass(errors.debt_pct)}
                  placeholder="Debt %"
                  value={form.debt_pct}
                  onChange={(e) => setField("debt_pct", e.target.value)}
                />
                {error(errors.debt_pct)}
              </div>
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Other %
                </label>
                <input
                  className={inputClass(errors.other_pct)}
                  placeholder="Other %"
                  value={form.other_pct}
                  onChange={(e) => setField("other_pct", e.target.value)}
                />
                {error(errors.other_pct)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 font-medium text-gray-700">
            <input
              className={mfCheckboxClass}
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setField("is_featured", e.target.checked)}
            />
            Featured
          </label>
          <label className="flex items-center gap-3 font-medium text-gray-700">
            <input
              className={mfCheckboxClass}
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => setField("is_popular", e.target.checked)}
            />
            Popular
          </label>
          <label className="flex items-center gap-3 font-medium text-gray-700">
            <input
              className={mfCheckboxClass}
              type="checkbox"
              checked={form.is_active === 1}
              onChange={(e) => setField("is_active", e.target.checked ? 1 : 0)}
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
