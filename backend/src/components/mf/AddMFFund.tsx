import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import {
  MFFundVisibilityFieldLabel,
  MFFundVisibilitySectionTitle,
  emptyMFFundVisibility,
  getMFFundVisibilityGroupFieldKeys,
  normalizeMFFundVisibility,
  syncMFFundVisibilityGroups,
} from "./MFFundVisibilityControls";

const FUND_TRAILING_FIELDS = [
  { key: "1w", label: "1 Week" },
  { key: "1m", label: "1 Month" },
  { key: "3m", label: "3 Months" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
  { key: "2y", label: "2 Years" },
  { key: "3y", label: "3 Years" },
  { key: "5y", label: "5 Years" },
  { key: "10y", label: "10 Years" },
  { key: "since_launch", label: "Since Launch" },
  { key: "ytd", label: "YTD" },
] as const;

const buildAnnualYears = (startYear: number) =>
  Array.from({ length: 9 }, (_, index) => String(startYear - index));
const DEFAULT_ANNUAL_YEARS = buildAnnualYears(new Date().getFullYear() - 1);

const emptyMap = <T extends readonly string[]>(keys: T) =>
  Object.fromEntries(keys.map((key) => [key, ""])) as Record<T[number], string>;

const emptyForm = () => ({
  scheme_code: "",
  isin_number: "",
  fund_name: "",
  amc_id: "",
  amc_name: "",
  category_id: "",
  plan_type: "Regular",
  option_type: "Growth",
  nav_Current: "",
  nav_date: null as string | null,
  nav_change: "",
  nav_change_percentage: "",
  aum: "",
  expense_ratio: "",
  inception_return: "",
  return_1d: "",
  return_ytd: "",
  returnsTrailing: emptyMap(
    FUND_TRAILING_FIELDS.map(
      (field) => field.key,
    ) as unknown as readonly string[],
  ),
  apiCategoryReturns: emptyMap([
    ...FUND_TRAILING_FIELDS.map((field) => field.key),
    "ytd",
  ] as unknown as readonly string[]),
  returnsAnnual: emptyMap(DEFAULT_ANNUAL_YEARS),
  sharpe_3y: "",
  sharpe_5y: "",
  std_dev_3y: "",
  std_dev_5y: "",
  beta_3y: "",
  beta_5y: "",
  alpha_3y: "",
  alpha_5y: "",
  max_drawdown_5y: "",
  max_drawdown_10y: "",
  turnover_ratio: "",
  fund_manager: "",
  launch_date: null as Date | null,
  min_investment: "",
  sip_allowed: true,
  min_sip_investment: "",
  lumpsum_allowed: true,
  min_lumpsum_investment: "",
  exit_load: "",
  fund_objective: "",
  investment_strategy: "",
  domestic_equity_pct: "",
  international_equity_pct: "",
  debt_pct: "",
  other_pct: "",
  gold_pct: "",
  cash_pct: "",
  large_cap_pct: "",
  mid_cap_pct: "",
  small_cap_pct: "",
  tax_type: "",
  riskometer_label: "",

  frontend_visibility: emptyMFFundVisibility(),
  is_featured: false,
  is_popular: false,
  is_active: 1,
});

type FundFormState = ReturnType<typeof emptyForm>;

type CategoryOption = {
  _id: string;
  name: string;
  main_category_id?: {
    name?: string;
  };
};

type AmcOption = {
  _id: string;
  name: string;
};

const toNumberOrNull = (value: string) => (value === "" ? null : Number(value));

const getApiCategoryReturnValue = (
  source: any,
  key: (typeof FUND_TRAILING_FIELDS)[number]["key"],
) => {
  if (!source) return "";
  if (key === "ytd") {
    return (
      source?.annual?.ytd?.toString?.() ||
      source?.trailing?.ytd?.toString?.() ||
      source?.ytd?.toString?.() ||
      ""
    );
  }

  return (
    source?.trailing?.[key]?.toString?.() || source?.[key]?.toString?.() || ""
  );
};

const formatNavDate = (value?: string | null) => {
  if (!value) return "(Date not available)";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "(Date not available)";
  return `As on ${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
};

export default function AddMFFund() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = location.pathname.includes("/view/");
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/funds",
    listKey: "data",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const [form, setForm] = useState<FundFormState>(emptyForm);
  const [annualYears, setAnnualYears] =
    useState<string[]>(DEFAULT_ANNUAL_YEARS);
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
      const importedYears = Object.keys(
        fund?.returns?.annual?.yearly_returns || fund?.returns?.annual || {},
      )
        .filter((year) => /^\d{4}$/.test(year))
        .map((year) => Number(year))
        .filter((year) => Number.isFinite(year));
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 1;
      const dynamicAnnualYears = buildAnnualYears(startYear);
      setAnnualYears(dynamicAnnualYears);

      setForm({
        scheme_code: fund.scheme_code || "",
        isin_number: fund.isin_number || "",
        fund_name: fund.fund_name || "",
        amc_id: fund.amc_id?._id || "",
        amc_name: fund.amc_id?.name || "",
        category_id: fund.category_id?._id || "",
        plan_type: fund.plan_type || "Regular",
        option_type: fund.option_type || "Growth",
        nav_Current:
          fund.nav_Current?.toString?.() ||
          fund.nav_current?.toString?.() ||
          "",
        nav_date: fund.nav_date || null,
        nav_change: fund.nav_change?.toString?.() || "",
        nav_change_percentage: fund.nav_change_percentage?.toString?.() || "",
        aum: fund.aum?.toString?.() || fund.aum_cr?.toString?.() || "",
        expense_ratio: fund.expense_ratio?.toString?.() || "",
        inception_return:
          fund.returns?.trailing?.since_launch?.toString?.() ||
          fund.returns?.since_inception?.toString?.() ||
          fund.inception_return?.toString?.() ||
          "",
        return_1d: fund.returns?.d1?.toString?.() || "",
        return_ytd:
          fund.returns?.annual?.ytd?.toString?.() ||
          fund.returns?.ytd?.toString?.() ||
          "",
        returnsTrailing: {
          ...emptyMap(
            FUND_TRAILING_FIELDS.map(
              (field) => field.key,
            ) as unknown as readonly string[],
          ),
          ...Object.fromEntries(
            FUND_TRAILING_FIELDS.map((field) => [
              field.key,
              fund.returns?.trailing?.[field.key]?.toString?.() ||
                (field.key === "1w" ? fund.returns?.w1?.toString?.() : "") ||
                (field.key === "1m" ? fund.returns?.m1?.toString?.() : "") ||
                (field.key === "3m" ? fund.returns?.m3?.toString?.() : "") ||
                (field.key === "6m" ? fund.returns?.m6?.toString?.() : "") ||
                (field.key === "1y" ? fund.returns?.y1?.toString?.() : "") ||
                (field.key === "2y" ? fund.returns?.y2?.toString?.() : "") ||
                (field.key === "3y"
                  ? fund.returns?.y3_cagr?.toString?.()
                  : "") ||
                (field.key === "5y"
                  ? fund.returns?.y5_cagr?.toString?.()
                  : "") ||
                (field.key === "10y"
                  ? fund.returns?.y10_cagr?.toString?.()
                  : "") ||
                (field.key === "since_launch"
                  ? fund.returns?.since_inception?.toString?.()
                  : "") ||
                (field.key === "ytd"
                  ? fund.returns?.annual?.ytd?.toString?.() ||
                    fund.returns?.ytd?.toString?.()
                  : "") ||
                "",
            ]),
          ),
        },
        apiCategoryReturns: {
          ...emptyMap(
            FUND_TRAILING_FIELDS.map(
              (field) => field.key,
            ) as unknown as readonly string[],
          ),
          ...Object.fromEntries(
            FUND_TRAILING_FIELDS.map((field) => [
              field.key,
              getApiCategoryReturnValue(fund.api_category_returns, field.key),
            ]),
          ),
        },
        returnsAnnual: {
          ...emptyMap(dynamicAnnualYears),
          ...Object.fromEntries(
            dynamicAnnualYears.map((year) => [
              year,
              fund.returns?.annual?.yearly_returns?.[year]?.toString?.() ||
                fund.returns?.annual?.[year]?.toString?.() ||
                "",
            ]),
          ),
        },
        sharpe_3y: fund.risk_metrics?.sharpe_3y?.toString?.() || "",
        sharpe_5y: fund.risk_metrics?.sharpe_5y?.toString?.() || "",
        std_dev_3y: fund.risk_metrics?.std_dev_3y?.toString?.() || "",
        std_dev_5y: fund.risk_metrics?.std_dev_5y?.toString?.() || "",
        beta_3y: fund.risk_metrics?.beta_3y?.toString?.() || "",
        beta_5y: fund.risk_metrics?.beta_5y?.toString?.() || "",
        alpha_3y: fund.risk_metrics?.alpha_3y?.toString?.() || "",
        alpha_5y: fund.risk_metrics?.alpha_5y?.toString?.() || "",
        max_drawdown_5y: fund.risk_metrics?.max_drawdown_5y?.toString?.() || "",
        max_drawdown_10y:
          fund.risk_metrics?.max_drawdown_10y?.toString?.() || "",
        turnover_ratio: fund.risk_metrics?.turnover_ratio?.toString?.() || "",
        fund_manager: fund.fund_manager || "",
        launch_date: fund.launch_date ? new Date(fund.launch_date) : null,
        min_investment: fund.min_investment?.toString?.() || "",
        sip_allowed: fund.sip_allowed ?? true,
        min_sip_investment: fund.min_sip_investment?.toString?.() || "",
        lumpsum_allowed: fund.lumpsum_allowed ?? true,
        min_lumpsum_investment: fund.min_lumpsum_investment?.toString?.() || "",
        exit_load: fund.exit_load || "",
        fund_objective: fund.fund_objective || "",
        investment_strategy: fund.investment_strategy || "",
        domestic_equity_pct: fund.domestic_equity_pct?.toString?.() || "",
        international_equity_pct:
          fund.international_equity_pct?.toString?.() || "",
        debt_pct: fund.debt_pct?.toString?.() || "",
        other_pct: fund.other_pct?.toString?.() || "",
        gold_pct: fund.gold_pct?.toString?.() || "",
        cash_pct: fund.cash_pct?.toString?.() || "",
        large_cap_pct: fund.large_cap_pct?.toString?.() || "",
        mid_cap_pct: fund.mid_cap_pct?.toString?.() || "",
        small_cap_pct: fund.small_cap_pct?.toString?.() || "",
        tax_type: fund.tax_type || "",
        riskometer_label: fund.riskometer_label || "",

        frontend_visibility: normalizeMFFundVisibility(
          fund.frontend_visibility,
        ),
        is_featured: !!fund.is_featured,
        is_popular: !!fund.is_popular,
        is_active: fund.is_active ?? 1,
      });
    })();
  }, [getOne, id]);

  useEffect(() => {
    if (id) return;
    setAnnualYears(DEFAULT_ANNUAL_YEARS);
  }, [id]);

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

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => item._id === form.category_id),
    [categoryOptions, form.category_id],
  );

  const setField = (
    key: keyof FundFormState,
    value: FundFormState[keyof FundFormState],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [String(key)]: "" }));
  };

  const setMapField = (
    group: "returnsTrailing" | "returnsAnnual" | "apiCategoryReturns",
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
    if (form.isin_number.length > 80)
      nextErrors.isin_number = "ISIN must be under 80 characters";
    if (form.fund_name.length > 200)
      nextErrors.fund_name = "Fund name must be under 200 characters";
    if (form.amc_name.length > 120)
      nextErrors.amc_name = "AMC name must be under 120 characters";
    if (form.fund_manager.length > 200)
      nextErrors.fund_manager = "Fund manager must be under 200 characters";
    if (form.exit_load.length > 500)
      nextErrors.exit_load = "Exit load must be under 500 characters";
    if (form.fund_objective.length > 5000)
      nextErrors.fund_objective =
        "Fund objective must be under 5000 characters";
    if (form.investment_strategy.length > 5000)
      nextErrors.investment_strategy =
        "Investment strategy must be under 5000 characters";

    const numericRules: Array<[keyof FundFormState, string, number, number]> = [
      ["nav_Current", "NAV", 0, 1_000_000_000],
      ["aum", "AUM (Cr)", 0, 1_000_000_000],
      ["expense_ratio", "Expense ratio", 0, 100],
      ["inception_return", "Inception returns", -1000, 1000],
      ["return_1d", "1 Day return", -1000, 1000],
      ["return_ytd", "YTD return", -1000, 1000],
      ["sharpe_3y", "Sharpe (3Y)", -1000, 1000],
      ["sharpe_5y", "Sharpe (5Y)", -1000, 1000],
      ["std_dev_3y", "Std Dev (3Y)", 0, 1000],
      ["std_dev_5y", "Std Dev (5Y)", 0, 1000],
      ["beta_3y", "Beta (3Y)", -1000, 1000],
      ["beta_5y", "Beta (5Y)", -1000, 1000],
      ["alpha_3y", "Alpha (3Y)", -1000, 1000],
      ["alpha_5y", "Alpha (5Y)", -1000, 1000],
      ["max_drawdown_5y", "Max Drawdown (5Y)", -1000, 1000],
      ["max_drawdown_10y", "Max Drawdown (10Y)", -1000, 1000],
      ["turnover_ratio", "Turnover ratio", 0, 1000],
      ["domestic_equity_pct", "Domestic equity %", 0, 100],
      ["international_equity_pct", "International equity %", 0, 100],
      ["debt_pct", "Debt %", 0, 100],
      ["other_pct", "Other %", 0, 100],
      ["gold_pct", "Gold %", 0, 100],
      ["cash_pct", "Cash %", 0, 100],
      ["large_cap_pct", "Large cap %", 0, 100],
      ["mid_cap_pct", "Mid cap %", 0, 100],
      ["small_cap_pct", "Small cap %", 0, 100],
      ["min_investment", "Minimum investment", 0, 1_000_000_000],
      ["min_sip_investment", "Minimum SIP investment", 0, 1_000_000_000],
      [
        "min_lumpsum_investment",
        "Minimum lumpsum investment",
        0,
        1_000_000_000,
      ],
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

    for (const year of annualYears) {
      const fundAnnualError = validateNumber(form.returnsAnnual[year], year);
      if (fundAnnualError)
        nextErrors[`returnsAnnual.${year}`] = fundAnnualError;
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

    if (isViewMode) {
      if (!id) return;
      setSaving(true);
      try {
        await axiosApi.update(`/${role}/mf/funds/edit/${id}`, {
          frontend_visibility: syncMFFundVisibilityGroups(
            form.frontend_visibility,
          ),
        });
        toast.success("Updated successfully");
      } catch (err: any) {
        const message = getApiMessage(err);
        if (applyApiErrors(err)) return;
        toast.error(message || "Failed to update visibility");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!validate()) return;

    setSaving(true);
    const payload = {
      scheme_code: form.scheme_code.trim(),
      isin_number: form.isin_number.trim(),
      fund_name: form.fund_name.trim(),
      amc_id: form.amc_id,
      amc_name: form.amc_name.trim(),
      category_id: form.category_id,
      plan_type: form.plan_type,
      option_type: form.option_type,
      nav_Current: toNumberOrNull(form.nav_Current),
      nav_change: toNumberOrNull(form.nav_change),
      nav_change_percentage: toNumberOrNull(form.nav_change_percentage),
      aum: toNumberOrNull(form.aum),
      expense_ratio: toNumberOrNull(form.expense_ratio),
      returns: {
        trailing: {
          since_launch: toNumberOrNull(form.inception_return),
          ...toNumberMap(form.returnsTrailing),
        },
        d1: toNumberOrNull(form.return_1d),
        annual: {
          ytd: toNumberOrNull(form.return_ytd),
          yearly_returns: toNumberMap(form.returnsAnnual),
        },
      },
      api_category_returns: toNumberMap(form.apiCategoryReturns),
      risk_metrics: {
        sharpe_3y: toNumberOrNull(form.sharpe_3y),
        sharpe_5y: toNumberOrNull(form.sharpe_5y),
        std_dev_3y: toNumberOrNull(form.std_dev_3y),
        std_dev_5y: toNumberOrNull(form.std_dev_5y),
        beta_3y: toNumberOrNull(form.beta_3y),
        beta_5y: toNumberOrNull(form.beta_5y),
        alpha_3y: toNumberOrNull(form.alpha_3y),
        alpha_5y: toNumberOrNull(form.alpha_5y),
        max_drawdown_5y: toNumberOrNull(form.max_drawdown_5y),
        max_drawdown_10y: toNumberOrNull(form.max_drawdown_10y),
        turnover_ratio: toNumberOrNull(form.turnover_ratio),
      },
      fund_manager: form.fund_manager.trim(),
      launch_date: form.launch_date ? form.launch_date.toISOString() : null,
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
      domestic_equity_pct: toNumberOrNull(form.domestic_equity_pct),
      international_equity_pct: toNumberOrNull(form.international_equity_pct),
      debt_pct: toNumberOrNull(form.debt_pct),
      other_pct: toNumberOrNull(form.other_pct),
      gold_pct: toNumberOrNull(form.gold_pct),
      cash_pct: toNumberOrNull(form.cash_pct),
      large_cap_pct: toNumberOrNull(form.large_cap_pct),
      mid_cap_pct: toNumberOrNull(form.mid_cap_pct),
      small_cap_pct: toNumberOrNull(form.small_cap_pct),
      tax_type: form.tax_type.trim(),
      riskometer_label: form.riskometer_label.trim(),

      frontend_visibility: syncMFFundVisibilityGroups(form.frontend_visibility),
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

  const setVisibilityGroup = (key: string, value: boolean) => {
    setForm((prev) => {
      const nextFields = { ...prev.frontend_visibility.fields };
      for (const fieldKey of getMFFundVisibilityGroupFieldKeys(key)) {
        nextFields[fieldKey] = value;
      }

      return {
        ...prev,
        frontend_visibility: syncMFFundVisibilityGroups({
          ...prev.frontend_visibility,
          fields: nextFields,
        }),
      };
    });
  };

  const setVisibilityField = (key: string, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      frontend_visibility: syncMFFundVisibilityGroups({
        ...prev.frontend_visibility,
        fields: {
          ...prev.frontend_visibility.fields,
          [key]: value,
        },
      }),
    }));
  };

  const renderSectionTitle = (groupKey: string, label: string) => (
    <MFFundVisibilitySectionTitle
      groupKey={groupKey}
      isViewMode={isViewMode}
      label={label}
      visibility={form.frontend_visibility}
      onChange={setVisibilityGroup}
    />
  );

  const renderFieldLabel = (label: string, visibilityKey: string) => (
    <MFFundVisibilityFieldLabel
      isViewMode={isViewMode}
      visibility={form.frontend_visibility}
      visibilityKey={visibilityKey}
      onChange={setVisibilityField}
    >
      {label}
    </MFFundVisibilityFieldLabel>
  );

  const renderInputField = (
    key: keyof FundFormState,
    label: string,
    visibilityKey = String(key),
  ) => (
    <div>
      {renderFieldLabel(label, visibilityKey)}
      <input
        className={inputClass(errors[String(key)])}
        disabled={isViewMode}
        value={String(form[key] ?? "")}
        onChange={(event) => setField(key, event.target.value as never)}
      />
      {error(errors[String(key)])}
    </div>
  );

  const renderTextAreaField = (
    key: keyof FundFormState,
    label: string,
    rows = 4,
    visibilityKey = String(key),
  ) => (
    <div>
      {renderFieldLabel(label, visibilityKey)}
      <textarea
        className={textAreaClass(errors[String(key)])}
        disabled={isViewMode}
        rows={rows}
        value={String(form[key] ?? "")}
        onChange={(event) => setField(key, event.target.value as never)}
      />
      {error(errors[String(key)])}
    </div>
  );

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${isViewMode ? "View" : id ? "Edit" : "Add"} MF Fund`}
        onBack={() => navigate(`/${role}/mf/funds`)}
      />

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <section>
          {renderSectionTitle("fund_overview", "Fund Overview")}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderInputField(
              "scheme_code",
              "Scheme Code",
              "fund_overview.scheme_code",
            )}
            {renderInputField(
              "isin_number",
              "ISIN",
              "fund_overview.isin_number",
            )}
            {renderInputField(
              "fund_name",
              "Scheme Name",
              "fund_overview.fund_name",
            )}

            <div ref={amcWrapperRef} className="relative">
              {renderFieldLabel("AMC Name", "fund_overview.amc_name")}
              <div
                onClick={() => {
                  if (!isViewMode) setAmcDropdownOpen((prev) => !prev);
                }}
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
                        form.amc_id === option._id
                          ? "bg-blue-50 font-medium"
                          : ""
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

            <div ref={categoryWrapperRef} className="relative">
              {renderFieldLabel("Category Name", "fund_overview.category_name")}
              <div
                onClick={() => {
                  if (!isViewMode) setCategoryDropdownOpen((prev) => !prev);
                }}
                className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 ${
                  errors.category_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <span>{selectedCategory?.name || "Select Category"}</span>
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
                      onChange={(event) =>
                        setCategorySearch(event.target.value)
                      }
                      className="h-11 w-full rounded-none border-0 pl-9 pr-3 focus:outline-none"
                    />
                  </div>
                  {filteredCategories.map((option) => (
                    <div
                      key={option._id}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          category_id: option._id,
                        }));
                        setErrors((prev) => ({
                          ...prev,
                          category_id: "",
                        }));
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
              {renderFieldLabel(
                "Main Category",
                "fund_overview.main_category_name",
              )}
              <input
                className={`${mfInputClass} bg-gray-50`}
                value={selectedCategory?.main_category_id?.name || ""}
                readOnly
              />
            </div>

            <div>
              {renderFieldLabel("Plan Type", "fund_overview.plan_type")}
              <select
                className={inputClass(errors.plan_type)}
                disabled={isViewMode}
                value={form.plan_type}
                onChange={(event) => setField("plan_type", event.target.value)}
              >
                <option value="Regular">Regular</option>
                <option value="Direct">Direct</option>
              </select>
              {error(errors.plan_type)}
            </div>

            <div>
              {renderFieldLabel("Option Type", "fund_overview.option_type")}
              <select
                className={inputClass(errors.option_type)}
                disabled={isViewMode}
                value={form.option_type}
                onChange={(event) =>
                  setField("option_type", event.target.value)
                }
              >
                <option value="Growth">Growth</option>
                <option value="IDCW">IDCW</option>
              </select>
              {error(errors.option_type)}
            </div>

            <div>
              {renderFieldLabel("NAV", "fund_overview.nav_Current")}
              <input
                className={`${mfInputClass} bg-gray-50`}
                value={form.nav_Current ? `INR ${form.nav_Current}` : ""}
                readOnly
                disabled
              />
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <FiCalendar className="h-3.5 w-3.5" />
                {formatNavDate(form.nav_date)}
              </p>
            </div>
            {renderInputField(
              "nav_change",
              "NAV Change",
              "fund_overview.nav_change",
            )}
            {renderInputField(
              "nav_change_percentage",
              "NAV Change %",
              "fund_overview.nav_change_percentage",
            )}
            {renderInputField("aum", "AUM (Crs.)", "fund_overview.aum")}
            {renderInputField(
              "expense_ratio",
              "Expense Ratio",
              "fund_overview.expense_ratio",
            )}
            {renderInputField(
              "fund_manager",
              "Fund Manager",
              "fund_overview.fund_manager",
            )}

            <div>
              {renderFieldLabel("Inception Date", "fund_overview.launch_date")}
              <div className="relative">
                <DatePicker
                  selected={form.launch_date}
                  onChange={(date) => setField("launch_date", date)}
                  dateFormat="dd/MM/yyyy"
                  className={`${inputClass(errors.launch_date)} pr-10`}
                  disabled={isViewMode}
                  placeholderText="dd/mm/yyyy"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              {error(errors.launch_date)}
            </div>

            {renderInputField(
              "min_investment",
              "Min Investment",
              "fund_overview.min_investment",
            )}

            <div>
              {renderFieldLabel("SIP Allowed", "fund_overview.sip_allowed")}
              <label className="flex h-11 items-center gap-2 text-sm text-gray-600">
                <input
                  className={mfCheckboxClass}
                  type="checkbox"
                  checked={form.sip_allowed}
                  disabled={isViewMode}
                  onChange={(event) => {
                    setField("sip_allowed", event.target.checked);
                    if (!event.target.checked) {
                      setField("min_sip_investment", "");
                    }
                  }}
                />
                Allowed
              </label>
            </div>

            <div>
              {renderFieldLabel("Min SIP", "fund_overview.min_sip_investment")}
              <input
                className={inputClass(errors.min_sip_investment)}
                disabled={isViewMode || !form.sip_allowed}
                value={form.min_sip_investment}
                onChange={(event) =>
                  setField("min_sip_investment", event.target.value)
                }
              />
              {error(errors.min_sip_investment)}
            </div>

            <div>
              {renderFieldLabel(
                "Lumpsum Allowed",
                "fund_overview.lumpsum_allowed",
              )}
              <label className="flex h-11 items-center gap-2 text-sm text-gray-600">
                <input
                  className={mfCheckboxClass}
                  type="checkbox"
                  checked={form.lumpsum_allowed}
                  disabled={isViewMode}
                  onChange={(event) => {
                    setField("lumpsum_allowed", event.target.checked);
                    if (!event.target.checked) {
                      setField("min_lumpsum_investment", "");
                    }
                  }}
                />
                Allowed
              </label>
            </div>

            <div>
              {renderFieldLabel(
                "Min Lumpsum",
                "fund_overview.min_lumpsum_investment",
              )}
              <input
                className={inputClass(errors.min_lumpsum_investment)}
                disabled={isViewMode || !form.lumpsum_allowed}
                value={form.min_lumpsum_investment}
                onChange={(event) =>
                  setField("min_lumpsum_investment", event.target.value)
                }
              />
              {error(errors.min_lumpsum_investment)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {renderTextAreaField(
              "exit_load",
              "Exit Load",
              3,
              "fund_overview.exit_load",
            )}
            {renderTextAreaField(
              "fund_objective",
              "Investment Objective",
              4,
              "fund_overview.fund_objective",
            )}
            {renderTextAreaField(
              "investment_strategy",
              "Investment Strategy",
              4,
              "fund_overview.investment_strategy",
            )}
          </div>
        </section>

        <section>
          {renderSectionTitle("fund_performance", "Fund Performance")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderInputField(
              "inception_return",
              "Inception Returns",
              "fund_performance.inception_return",
            )}
            {renderInputField(
              "return_1d",
              "1 Day",
              "fund_performance.return_1d",
            )}
            {FUND_TRAILING_FIELDS.map((field) => (
              <div key={field.key}>
                {renderFieldLabel(field.label, `fund_performance.${field.key}`)}
                <input
                  className={inputClass(errors[`returnsTrailing.${field.key}`])}
                  disabled={isViewMode}
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

          <h4 className="mb-4 mt-6 font-semibold text-gray-700">
            Annual Returns
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {annualYears.map((year) => (
              <div key={year}>
                {renderFieldLabel(year, `fund_performance.annual_${year}`)}
                <input
                  className={inputClass(errors[`returnsAnnual.${year}`])}
                  disabled={isViewMode}
                  value={form.returnsAnnual[year]}
                  onChange={(event) =>
                    setMapField("returnsAnnual", year, event.target.value)
                  }
                />
                {error(errors[`returnsAnnual.${year}`])}
              </div>
            ))}
          </div>

          {/* <h4 className="mb-4 mt-6 font-semibold text-gray-700">
            API Category Returns
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FUND_TRAILING_FIELDS.map((field) => (
              <div key={field.key}>
                {renderFieldLabel(
                  field.label,
                  `fund_performance.api_category_returns_${field.key}`,
                )}
                <input
                  className={inputClass(
                    errors[`apiCategoryReturns.${field.key}`],
                  )}
                  disabled={isViewMode}
                  value={form.apiCategoryReturns[field.key]}
                  onChange={(event) =>
                    setMapField(
                      "apiCategoryReturns",
                      field.key,
                      event.target.value,
                    )
                  }
                />
                {error(errors[`apiCategoryReturns.${field.key}`])}
              </div>
            ))}
          </div> */}
        </section>

        <section>
          {renderSectionTitle("asset_allocation", "Asset Allocation")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["domestic_equity_pct", "Domestic Equity %"],
              ["international_equity_pct", "International Equity %"],
              ["debt_pct", "Debt %"],
              ["other_pct", "Other %"],
              ["gold_pct", "Gold %"],
              ["cash_pct", "Cash %"],
            ].map(([key, label]) => (
              <div key={key}>
                {renderFieldLabel(label, `asset_allocation.${key}`)}
                <input
                  className={inputClass(errors[key])}
                  disabled={isViewMode}
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
        </section>

        <section>
          {renderSectionTitle("equity_allocation", "Equity Allocation")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["large_cap_pct", "Large Cap %"],
              ["mid_cap_pct", "Mid Cap %"],
              ["small_cap_pct", "Small Cap %"],
            ].map(([key, label]) => (
              <div key={key}>
                {renderFieldLabel(label, `equity_allocation.${key}`)}
                <input
                  className={inputClass(errors[key])}
                  disabled={isViewMode}
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
        </section>

        <section>
          {renderSectionTitle("fund_overview_risk", "Fund Overview and Risk")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["tax_type", "Tax Type"],
              ["riskometer_label", "Risk-o-meter"],
            ].map(([key, label]) => (
              <div key={key}>
                {renderFieldLabel(label, `fund_overview_risk.${key}`)}
                <input
                  className={inputClass(errors[key])}
                  disabled={isViewMode}
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
        </section>

        <div>
          {renderSectionTitle("risk_ratio", "Risk Ratio")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["sharpe_3y", "Sharpe (3Y)"],
              ["sharpe_5y", "Sharpe (5Y)"],
              ["std_dev_3y", "Std Dev (3Y)"],
              ["std_dev_5y", "Std Dev (5Y)"],
              ["beta_3y", "Beta (3Y)"],
              ["beta_5y", "Beta (5Y)"],
              ["alpha_3y", "Alpha (3Y)"],
              ["alpha_5y", "Alpha (5Y)"],
              ["max_drawdown_5y", "Max Drawdown (5Y)"],
              ["max_drawdown_10y", "Max Drawdown (10Y)"],
              ["turnover_ratio", "Turnover Ratio"],
            ].map(([key, label]) => (
              <div key={key}>
                {renderFieldLabel(label, `risk_ratio.${key}`)}
                <input
                  className={inputClass(errors[key])}
                  disabled={isViewMode}
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

        {!isViewMode ? (
          <MFFormActions
            onReset={resetForm}
            isSubmitting={saving}
            submitLabel={id ? "Update" : "Save"}
          />
        ) : (
          <div className="flex justify-end border-t border-gray-100 pt-8">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#043f79] px-6 py-2.5 font-medium text-white transition hover:bg-[#0654a4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Visibility"}
            </button>
          </div>
        )}
      </form>
    </MFFormContainer>
  );
}
