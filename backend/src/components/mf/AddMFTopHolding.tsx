import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { getApiMessage } from "./mfValidation";

type HoldingRow = {
  name: string;
  net_assets_pct: string;
  market_value: string;
  share_amount: string;
  share_change: string;
  security_type: string;
  sector: string;
  maturity: string;
  credit_quality_india: string;
  country: string;
};

const emptyHoldingRow = (): HoldingRow => ({
  name: "",
  net_assets_pct: "",
  market_value: "",
  share_amount: "",
  share_change: "",
  security_type: "",
  sector: "",
  maturity: "",
  credit_quality_india: "",
  country: "",
});

const emptyForm = () => ({
  fund_id: "",
  scheme_code: "",
  fund_name: "",
  source_standard_name: "",
  source_isin: "",
  portfolio_date: null as Date | null,
  prev_portfolio_date: null as Date | null,
  stock_holdings: "",
  bond_holdings: "",
  assets_top_10_holdings_pct: "",
  turnover_pct: "",
  top_holdings_summary: "",
  is_active: 1,
});

export default function AddMFTopHolding() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusHoldingIndex = Number(searchParams.get("focusHolding"));
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/top-holdings",
    listKey: "data",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const [form, setForm] = useState(emptyForm);
  const [holdings, setHoldings] = useState<HoldingRow[]>([emptyHoldingRow()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [fundOptions, setFundOptions] = useState<
    Array<{ _id: string; fund_name: string; scheme_code?: string }>
  >([]);
  const [fundDropdownOpen, setFundDropdownOpen] = useState(false);
  const [fundSearch, setFundSearch] = useState("");
  const fundWrapperRef = useRef<HTMLDivElement>(null);
  const holdingRefs = useRef<Array<HTMLDivElement | null>>([]);
  const didFocusHoldingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const response = await axiosApi.get(`/${role}/mf/funds`, {
        limit: 5000,
        page: 1,
        sortBy: "fund_name",
        sortOrder: "asc",
      });
      setFundOptions(Array.isArray(response?.data) ? response.data : []);
    })();
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fundWrapperRef.current &&
        !fundWrapperRef.current.contains(event.target as Node)
      ) {
        setFundDropdownOpen(false);
        setFundSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const response: any = await getOne(id);
      const data = response?.data || {};
      setForm({
        fund_id: data.fund_id?._id || "",
        scheme_code: data.scheme_code || "",
        fund_name: data.fund_name || "",
        source_standard_name: data.source_standard_name || "",
        source_isin: data.source_isin || "",
        portfolio_date: data.portfolio_date ? new Date(data.portfolio_date) : null,
        prev_portfolio_date: data.prev_portfolio_date
          ? new Date(data.prev_portfolio_date)
          : null,
        stock_holdings: data.stock_holdings?.toString?.() || "",
        bond_holdings: data.bond_holdings?.toString?.() || "",
        assets_top_10_holdings_pct:
          data.assets_top_10_holdings_pct?.toString?.() || "",
        turnover_pct: data.turnover_pct?.toString?.() || "",
        top_holdings_summary: Array.isArray(data.top_holdings_summary)
          ? data.top_holdings_summary.join("\n")
          : "",
        is_active: data.is_active ?? 1,
      });
      const mappedHoldings: HoldingRow[] =
        Array.isArray(data.holdings) && data.holdings.length > 0
          ? data.holdings.map((item: any) => ({
              name: item.name || "",
              net_assets_pct: item.net_assets_pct?.toString?.() || "",
              market_value: item.market_value?.toString?.() || "",
              share_amount: item.share_amount?.toString?.() || "",
              share_change: item.share_change?.toString?.() || "",
              security_type: item.security_type || "",
              sector: item.sector || "",
              maturity: item.maturity || "",
              credit_quality_india: item.credit_quality_india || "",
              country: item.country || "",
            }))
          : [emptyHoldingRow()];
      if (
        Number.isInteger(focusHoldingIndex) &&
        focusHoldingIndex >= 0 &&
        focusHoldingIndex < mappedHoldings.length
      ) {
        const focused = mappedHoldings[focusHoldingIndex];
        setHoldings([
          focused,
          ...mappedHoldings.filter((_, index) => index !== focusHoldingIndex),
        ]);
      } else {
        setHoldings(mappedHoldings);
      }
    })();
  }, [focusHoldingIndex, getOne, id]);

  useEffect(() => {
    if (!id || didFocusHoldingRef.current) return;
    if (!Number.isInteger(focusHoldingIndex) || focusHoldingIndex < 0) return;
    if (holdings.length === 0) return;

    didFocusHoldingRef.current = true;
    window.setTimeout(() => {
      const target = holdingRefs.current[0];
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      const firstInput = target?.querySelector("input");
      firstInput?.focus();
    }, 150);
  }, [focusHoldingIndex, holdings.length, id]);

  const selectedFund = useMemo(
    () => fundOptions.find((item) => item._id === form.fund_id),
    [fundOptions, form.fund_id],
  );

  const filteredFunds = useMemo(
    () =>
      fundOptions.filter((item) =>
        item.fund_name.toLowerCase().includes(fundSearch.toLowerCase()),
      ),
    [fundOptions, fundSearch],
  );

  useEffect(() => {
    if (!selectedFund) return;
    setForm((prev) => ({
      ...prev,
      scheme_code: prev.scheme_code || selectedFund.scheme_code || "",
      fund_name: prev.fund_name || selectedFund.fund_name || "",
    }));
  }, [selectedFund]);

  const setField = (
    key: keyof typeof form,
    value: (typeof form)[keyof typeof form],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value as never }));
    setErrors((prev) => ({ ...prev, [String(key)]: "" }));
  };

  const setHoldingField = (index: number, key: keyof HoldingRow, value: string) => {
    setHoldings((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
    setErrors((prev) => ({ ...prev, [`holding_${index}_${key}`]: "" }));
  };

  const addHoldingRow = () => setHoldings((prev) => [emptyHoldingRow(), ...prev]);
  const removeHoldingRow = (index: number) =>
    setHoldings((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.fund_name.trim()) nextErrors.fund_name = "Fund name is required";
    if (!form.portfolio_date) nextErrors.portfolio_date = "Portfolio date is required";

    const filledHoldings = holdings.filter((row) => row.name.trim());
    if (filledHoldings.length === 0) {
      nextErrors.holdings = "At least one holding row is required";
    }

    filledHoldings.forEach((row, index) => {
      if (!row.name.trim()) nextErrors[`holding_${index}_name`] = "Holding name is required";
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) scrollToFirstError(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const toNumberOrNull = (value: string) =>
    value.trim() === "" ? null : Number(value);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      ...form,
      top_holdings_summary: form.top_holdings_summary,
      portfolio_date: form.portfolio_date ? form.portfolio_date.toISOString() : null,
      prev_portfolio_date: form.prev_portfolio_date
        ? form.prev_portfolio_date.toISOString()
        : null,
      holdings: holdings
        .filter((row) => row.name.trim())
        .map((row) => ({
          name: row.name.trim(),
          net_assets_pct: toNumberOrNull(row.net_assets_pct),
          market_value: toNumberOrNull(row.market_value),
          share_amount: toNumberOrNull(row.share_amount),
          share_change: toNumberOrNull(row.share_change),
          security_type: row.security_type.trim(),
          sector: row.sector.trim(),
          maturity: row.maturity.trim(),
          credit_quality_india: row.credit_quality_india.trim(),
          country: row.country.trim(),
        })),
      stock_holdings: toNumberOrNull(form.stock_holdings),
      bond_holdings: toNumberOrNull(form.bond_holdings),
      assets_top_10_holdings_pct: toNumberOrNull(form.assets_top_10_holdings_pct),
      turnover_pct: toNumberOrNull(form.turnover_pct),
      is_active: form.is_active,
    };

    try {
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/top-holdings`);
    } catch (error: any) {
      toast.error(getApiMessage(error) || "Failed to save top holding record");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setHoldings([emptyHoldingRow()]);
    setErrors({});
  };

  const error = (message?: string) =>
    message ? <p className="mt-1 text-sm text-red-500">{message}</p> : null;
  const inputClass = (message?: string) =>
    `${mfInputClass} ${message ? "!border-red-500 focus:!border-red-500" : ""}`;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={id ? "Create MF Top Holding Revision" : "Add MF Top Holding"}
        onBack={() => navigate(`/${role}/mf/top-holdings`)}
      />

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div ref={fundWrapperRef} className="relative">
            <label className="mb-2 block font-medium text-gray-700">Fund</label>
            <div
              onClick={() => setFundDropdownOpen((prev) => !prev)}
              className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 ${
                errors.fund_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <span>
                {fundOptions.find((item) => item._id === form.fund_id)?.fund_name ||
                  "Select Fund"}
              </span>
              <svg
                className={`h-4 w-4 transform transition-transform ${
                  fundDropdownOpen ? "rotate-180" : "rotate-0"
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
            {error(errors.fund_id)}
            {fundDropdownOpen ? (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
                <div className="relative border-b border-gray-200">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fund..."
                    value={fundSearch}
                    onChange={(event) => setFundSearch(event.target.value)}
                    className="h-11 w-full rounded-none border-0 pl-9 pr-3 focus:outline-none"
                  />
                </div>
                {filteredFunds.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        fund_id: item._id,
                        scheme_code: prev.scheme_code || item.scheme_code || "",
                        fund_name: prev.fund_name || item.fund_name || "",
                      }));
                      setErrors((prev) => ({ ...prev, fund_id: "", fund_name: "" }));
                      setFundDropdownOpen(false);
                      setFundSearch("");
                    }}
                    className={`cursor-pointer p-2 hover:bg-blue-100 ${
                      form.fund_id === item._id ? "bg-blue-50 font-medium" : ""
                    }`}
                  >
                    {item.fund_name}
                  </div>
                ))}
                {filteredFunds.length === 0 ? (
                  <p className="p-2 text-sm text-gray-400">No fund found.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Scheme Code</label>
            <input
              className={inputClass(errors.scheme_code)}
              value={form.scheme_code}
              onChange={(e) => setField("scheme_code", e.target.value)}
            />
            {error(errors.scheme_code)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Fund Name</label>
            <input className={inputClass(errors.fund_name)} value={form.fund_name} onChange={(e) => setField("fund_name", e.target.value)} />
            {error(errors.fund_name)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Source Standard Name</label>
            <input
              className={inputClass(errors.source_standard_name)}
              value={form.source_standard_name}
              onChange={(e) => setField("source_standard_name", e.target.value)}
            />
            {error(errors.source_standard_name)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Source ISIN</label>
            <input
              className={inputClass(errors.source_isin)}
              value={form.source_isin}
              onChange={(e) => setField("source_isin", e.target.value)}
            />
            {error(errors.source_isin)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Portfolio Date</label>
            <div className="relative">
              <DatePicker
                selected={form.portfolio_date}
                onChange={(date) => setField("portfolio_date", date)}
                dateFormat="dd/MM/yyyy"
                className={`${inputClass(errors.portfolio_date)} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.portfolio_date)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Previous Portfolio Date</label>
            <div className="relative">
              <DatePicker
                selected={form.prev_portfolio_date}
                onChange={(date) => setField("prev_portfolio_date", date)}
                dateFormat="dd/MM/yyyy"
                className={`${inputClass(errors.prev_portfolio_date)} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.prev_portfolio_date)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Stock Holdings</label>
            <input
              className={inputClass(errors.stock_holdings)}
              value={form.stock_holdings}
              onChange={(e) => setField("stock_holdings", e.target.value)}
            />
            {error(errors.stock_holdings)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Bond Holdings</label>
            <input
              className={inputClass(errors.bond_holdings)}
              value={form.bond_holdings}
              onChange={(e) => setField("bond_holdings", e.target.value)}
            />
            {error(errors.bond_holdings)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">% Assets Top 10 Holdings</label>
            <input
              className={inputClass(errors.assets_top_10_holdings_pct)}
              value={form.assets_top_10_holdings_pct}
              onChange={(e) => setField("assets_top_10_holdings_pct", e.target.value)}
            />
            {error(errors.assets_top_10_holdings_pct)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Turnover %</label>
            <input
              className={inputClass(errors.turnover_pct)}
              value={form.turnover_pct}
              onChange={(e) => setField("turnover_pct", e.target.value)}
            />
            {error(errors.turnover_pct)}
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-gray-700">
            Top Holdings Summary
          </label>
          <textarea
            rows={5}
            className={mfTextAreaClass}
            placeholder="One holding summary per line"
            value={form.top_holdings_summary}
            onChange={(e) => setField("top_holdings_summary", e.target.value)}
          />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#043f79]">Holding Rows</h3>
            <button
              type="button"
              onClick={addHoldingRow}
              className="rounded-md bg-[#043f79] px-3 py-2 text-sm font-medium text-white hover:bg-[#0654a4]"
            >
              Add Row
            </button>
          </div>
          {error(errors.holdings)}
          <div className="space-y-4">
            {holdings.map((row, index) => (
              <div
                key={index}
                ref={(element) => {
                  holdingRefs.current[index] = element;
                }}
                className={`rounded-xl border p-4 ${
                  id &&
                  Number.isInteger(focusHoldingIndex) &&
                  focusHoldingIndex >= 0 &&
                  index === 0
                    ? "border-[#043f79] bg-blue-50/40 shadow-sm"
                    : "border-gray-200"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-gray-700">Holding #{index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeHoldingRow(index)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(row).map(([key, value]) => (
                    <div key={key}>
                      <label className="mb-2 block text-sm font-medium capitalize text-gray-700">
                        {key.replace(/_/g, " ")}
                      </label>
                      <input
                        className={`${mfInputClass} ${errors[`holding_${index}_${key}`] ? "!border-red-500 focus:!border-red-500" : ""}`}
                        value={value}
                        onChange={(e) =>
                          setHoldingField(index, key as keyof HoldingRow, e.target.value)
                        }
                      />
                      {error(errors[`holding_${index}_${key}`])}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 font-medium text-gray-700">
          <input
            className={mfCheckboxClass}
            type="checkbox"
            checked={form.is_active === 1}
            onChange={(e) => setField("is_active", e.target.checked ? 1 : 0)}
          />
          Active
        </label>

        <MFFormActions
          onReset={resetForm}
          isSubmitting={saving}
          submitLabel={id ? "Create Revision" : "Save"}
        />
      </form>
    </MFFormContainer>
  );
}
