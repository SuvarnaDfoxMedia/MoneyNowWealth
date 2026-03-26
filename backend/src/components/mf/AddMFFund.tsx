import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import { axiosApi } from "../../api/axios";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
} from "./MFFormShared";
import { FiCalendar } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddMFFund() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/funds",
    listKey: "data",
  });

  const [form, setForm] = useState({
    fund_name: "",
    amc_name: "",
    category_id: "",
    plan_type: "Regular",
    option_type: "Growth",
    aum_cr: "",
    expense_ratio: "",
    y1: "",
    y3_cagr: "",
    y5_cagr: "",
    y10_cagr: "",
    fund_manager: "",
    launch_date: null as Date | null,
    min_investment: "",
    exit_load: "",
    is_featured: false,
    is_popular: false,
    is_active: 1,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { _id: string; name: string }[]
  >([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryWrapperRef = useRef<HTMLDivElement>(null);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    (async () => {
      const res: any = await axiosApi.get(`/${role}/mf/categories`, {
        limit: 500,
        page: 1,
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
        fund_name: d.fund_name || "",
        amc_name: d.amc_id?.name || "",
        category_id: d.category_id?._id || "",
        plan_type: d.plan_type || "Regular",
        option_type: d.option_type || "Growth",
        aum_cr: d.aum_cr?.toString?.() || "",
        expense_ratio: d.expense_ratio?.toString?.() || "",
        y1: d.returns?.y1?.toString?.() || "",
        y3_cagr: d.returns?.y3_cagr?.toString?.() || "",
        y5_cagr: d.returns?.y5_cagr?.toString?.() || "",
        y10_cagr: d.returns?.y10_cagr?.toString?.() || "",
        fund_manager: d.fund_manager || "",
        launch_date: d.launch_date ? new Date(d.launch_date) : null,
        min_investment: d.min_investment?.toString?.() || "",
        exit_load: d.exit_load || "",
        is_featured: !!d.is_featured,
        is_popular: !!d.is_popular,
        is_active: d.is_active ?? 1,
      });
    })();
  }, [id]);

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

  const validateNumber = (
    value: string,
    label: string,
    min = -1000,
    max = 1000,
  ) => {
    if (value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return `${label} must be a number`;
    if (num < min || num > max)
      return `${label} must be between ${min} and ${max}`;
    return "";
  };

  const validate = () => {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.category_id) next.category_id = "Category is required";
    if (!form.fund_name.trim()) next.fund_name = "Fund name is required";
    if (form.fund_name.trim().length > 200)
      next.fund_name = "Fund name must be under 200 characters";
    if (!form.amc_name.trim()) next.amc_name = "AMC name is required";
    if (form.amc_name.trim().length > 120)
      next.amc_name = "AMC name must be under 120 characters";
    if (!form.plan_type) next.plan_type = "Plan type is required";
    if (!form.option_type) next.option_type = "Option type is required";

    const aumErr = validateNumber(form.aum_cr, "AUM (Cr)", 0, 1_000_000_000);
    if (aumErr) next.aum_cr = aumErr;
    const expErr = validateNumber(form.expense_ratio, "Expense ratio", 0, 100);
    if (expErr) next.expense_ratio = expErr;

    const y1Err = validateNumber(form.y1, "1Y return");
    if (y1Err) next.y1 = y1Err;
    const y3Err = validateNumber(form.y3_cagr, "3Y CAGR return");
    if (y3Err) next.y3_cagr = y3Err;
    const y5Err = validateNumber(form.y5_cagr, "5Y CAGR return");
    if (y5Err) next.y5_cagr = y5Err;
    const y10Err = validateNumber(form.y10_cagr, "10Y CAGR return");
    if (y10Err) next.y10_cagr = y10Err;

    const minInvErr = validateNumber(
      form.min_investment,
      "Minimum investment",
      0,
      1_000_000_000,
    );
    if (minInvErr) next.min_investment = minInvErr;
    if (form.exit_load.length > 500)
      next.exit_load = "Exit load must be under 500 characters";
    if (form.fund_manager.length > 200)
      next.fund_manager = "Fund manager must be under 200 characters";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyApiErrors = (err: any) => {
    const apiErrors = err?.response?.data?.errors;
    if (!Array.isArray(apiErrors)) return false;
    const next: Partial<Record<keyof typeof form, string>> = {};
    apiErrors.forEach((e: any) => {
      const field = e?.path || e?.param;
      const msg = e?.msg || "Invalid value";
      if (field === "fund_name") next.fund_name = msg;
      if (field === "amc_name") next.amc_name = msg;
      if (field === "amc_id") next.amc_name = msg;
      if (field === "category_id") next.category_id = msg;
      if (field === "plan_type") next.plan_type = msg;
      if (field === "option_type") next.option_type = msg;
      if (field === "aum_cr") next.aum_cr = msg;
      if (field === "expense_ratio") next.expense_ratio = msg;
      if (field === "returns.y1") next.y1 = msg;
      if (field === "returns.y3_cagr") next.y3_cagr = msg;
      if (field === "returns.y5_cagr") next.y5_cagr = msg;
      if (field === "returns.y10_cagr") next.y10_cagr = msg;
      if (field === "fund_manager") next.fund_manager = msg;
      if (field === "launch_date") next.launch_date = msg;
      if (field === "min_investment") next.min_investment = msg;
      if (field === "exit_load") next.exit_load = msg;
    });
    setErrors(next);
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      fund_name: form.fund_name,
      amc_name: form.amc_name,
      category_id: form.category_id,
      plan_type: form.plan_type,
      option_type: form.option_type,
      aum_cr: form.aum_cr === "" ? null : Number(form.aum_cr),
      expense_ratio: form.expense_ratio === "" ? null : Number(form.expense_ratio),
      returns: {
        y1: form.y1 === "" ? null : Number(form.y1),
        y3_cagr: form.y3_cagr === "" ? null : Number(form.y3_cagr),
        y5_cagr: form.y5_cagr === "" ? null : Number(form.y5_cagr),
        y10_cagr: form.y10_cagr === "" ? null : Number(form.y10_cagr),
      },
      fund_manager: form.fund_manager,
      launch_date: form.launch_date ? form.launch_date.toISOString() : null,
      min_investment: form.min_investment === "" ? null : Number(form.min_investment),
      exit_load: form.exit_load,
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      is_active: form.is_active,
    };

    try {
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/funds`);
    } catch (err: any) {
      if (applyApiErrors(err)) return;
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      fund_name: "",
      amc_name: "",
      category_id: "",
      plan_type: "Regular",
      option_type: "Growth",
      aum_cr: "",
      expense_ratio: "",
      y1: "",
      y3_cagr: "",
      y5_cagr: "",
      y10_cagr: "",
      fund_manager: "",
      launch_date: null,
      min_investment: "",
      exit_load: "",
      is_featured: false,
      is_popular: false,
      is_active: 1,
    });
    setErrors({});
  };

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF Fund`}
        onBack={() => navigate(`/${role}/mf/funds`)}
      />
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <div ref={categoryWrapperRef} className="relative">
              <label className="block mb-2 text-gray-700 font-medium">Category</label>
              <div
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className={`w-full h-11 px-3 rounded-md flex justify-between items-center cursor-pointer border ${
                  errors.category_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <span>
                  {categoryOptions.length === 0
                    ? "Loading categories..."
                    : (categoryOptions.find((t) => t._id === form.category_id)?.name ??
                      "Select Category")}
                </span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${categoryDropdownOpen ? "rotate-180" : "rotate-0"}`}
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
              {categoryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-lg">
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full h-11 border-0 border-b border-gray-200 rounded-none px-3 focus:outline-none"
                  />
                  {categoryOptions
                    .filter((t) =>
                      t.name.toLowerCase().includes(categorySearch.toLowerCase()),
                    )
                    .map((t) => (
                      <div
                        key={t._id}
                        onClick={() => {
                          setForm({ ...form, category_id: t._id });
                          setCategoryDropdownOpen(false);
                          setCategorySearch("");
                          setErrors((prev) => ({ ...prev, category_id: "" }));
                        }}
                        className={`p-2 cursor-pointer hover:bg-blue-100 ${form.category_id === t._id ? "bg-blue-50 font-medium" : ""}`}
                      >
                        {t.name}
                      </div>
                    ))}
                  {categoryOptions.filter((t) =>
                    t.name.toLowerCase().includes(categorySearch.toLowerCase()),
                  ).length === 0 && (
                    <p className="text-gray-400 text-sm p-2">No categories found.</p>
                  )}
                </div>
              )}
            </div>
          </div>

<div>
            <label htmlFor="plan_type" className="block mb-2 text-gray-700 font-medium">Plan Type</label>
            <select
              id="plan_type"
              className={mfInputClass}
              value={form.plan_type}
              onChange={(e) => {
                setForm({ ...form, plan_type: e.target.value });
                setErrors((prev) => ({ ...prev, plan_type: "" }));
              }}
            >
              <option value="">Select Plan Type</option>
              <option value="Regular">Regular</option>
              <option value="Direct">Direct</option>
            </select>
            {error(errors.plan_type)}
          </div>

          <div>
            <label htmlFor="fund_name" className="block mb-2 text-gray-700 font-medium">Fund Name</label>
            <input
              id="fund_name"
              className={mfInputClass}
              placeholder="Fund Name"
              value={form.fund_name}
              onChange={(e) => {
                setForm({ ...form, fund_name: e.target.value });
                setErrors((prev) => ({ ...prev, fund_name: "" }));
              }}
            />
            {error(errors.fund_name)}
          </div>
          <div>
            <label htmlFor="amc_name" className="block mb-2 text-gray-700 font-medium">AMC Name</label>
            <input
              id="amc_name"
              className={mfInputClass}
              placeholder="AMC Name"
              value={form.amc_name}
              onChange={(e) => {
                setForm({ ...form, amc_name: e.target.value });
                setErrors((prev) => ({ ...prev, amc_name: "" }));
              }}
            />
            {error(errors.amc_name)}
          </div>

<div>
            <label htmlFor="option_type" className="block mb-2 text-gray-700 font-medium">Option Type</label>
            <select
              id="option_type"
              className={mfInputClass}
              value={form.option_type}
              onChange={(e) => {
                setForm({ ...form, option_type: e.target.value });
                setErrors((prev) => ({ ...prev, option_type: "" }));
              }}
            >
              <option value="">Select Option Type</option>
              <option value="Growth">Growth</option>
              <option value="IDCW">IDCW</option>
            </select>
            {error(errors.option_type)}
          </div>
          <div>
            <label htmlFor="aum_cr" className="block mb-2 text-gray-700 font-medium">AUM (Cr)</label>
            <input
              id="aum_cr"
              className={mfInputClass}
              placeholder="AUM (Cr)"
              value={form.aum_cr}
              onChange={(e) => {
                setForm({ ...form, aum_cr: e.target.value });
                setErrors((prev) => ({ ...prev, aum_cr: "" }));
              }}
            />
            {error(errors.aum_cr)}
          </div>
          <div>
            <label htmlFor="expense_ratio" className="block mb-2 text-gray-700 font-medium">Expense Ratio</label>
            <input
              id="expense_ratio"
              className={mfInputClass}
              placeholder="Expense Ratio"
              value={form.expense_ratio}
              onChange={(e) => {
                setForm({ ...form, expense_ratio: e.target.value });
                setErrors((prev) => ({ ...prev, expense_ratio: "" }));
              }}
            />
            {error(errors.expense_ratio)}
          </div>
          <div>
            <label htmlFor="return_y1" className="block mb-2 text-gray-700 font-medium">1Y Return</label>
            <input
              id="return_y1"
              className={mfInputClass}
              placeholder="1Y Return"
              value={form.y1}
              onChange={(e) => {
                setForm({ ...form, y1: e.target.value });
                setErrors((prev) => ({ ...prev, y1: "" }));
              }}
            />
            {error(errors.y1)}
          </div>
          <div>
            <label htmlFor="return_y3_cagr" className="block mb-2 text-gray-700 font-medium">3Y CAGR</label>
            <input
              id="return_y3_cagr"
              className={mfInputClass}
              placeholder="3Y CAGR"
              value={form.y3_cagr}
              onChange={(e) => {
                setForm({ ...form, y3_cagr: e.target.value });
                setErrors((prev) => ({ ...prev, y3_cagr: "" }));
              }}
            />
            {error(errors.y3_cagr)}
          </div>
          <div>
            <label htmlFor="return_y5_cagr" className="block mb-2 text-gray-700 font-medium">5Y CAGR</label>
            <input
              id="return_y5_cagr"
              className={mfInputClass}
              placeholder="5Y CAGR"
              value={form.y5_cagr}
              onChange={(e) => {
                setForm({ ...form, y5_cagr: e.target.value });
                setErrors((prev) => ({ ...prev, y5_cagr: "" }));
              }}
            />
            {error(errors.y5_cagr)}
          </div>
          <div>
            <label htmlFor="return_y10_cagr" className="block mb-2 text-gray-700 font-medium">10Y CAGR</label>
            <input
              id="return_y10_cagr"
              className={mfInputClass}
              placeholder="10Y CAGR"
              value={form.y10_cagr}
              onChange={(e) => {
                setForm({ ...form, y10_cagr: e.target.value });
                setErrors((prev) => ({ ...prev, y10_cagr: "" }));
              }}
            />
            {error(errors.y10_cagr)}
          </div>
          <div>
            <label htmlFor="fund_manager" className="block mb-2 text-gray-700 font-medium">Fund Manager</label>
            <input
              id="fund_manager"
              className={mfInputClass}
              placeholder="Fund Manager"
              value={form.fund_manager}
              onChange={(e) => {
                setForm({ ...form, fund_manager: e.target.value });
                setErrors((prev) => ({ ...prev, fund_manager: "" }));
              }}
            />
            {error(errors.fund_manager)}
          </div>
          <div>
            <label htmlFor="launch_date" className="block mb-2 text-gray-700 font-medium">Launch Date</label>
            <div className="relative">
              <DatePicker
                selected={form.launch_date}
                onChange={(date) => {
                  setForm({ ...form, launch_date: date });
                  setErrors((prev) => ({ ...prev, launch_date: "" }));
                }}
                dateFormat="dd/MM/yyyy"
                className={`${mfInputClass} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.launch_date)}
          </div>
          <div>
            <label htmlFor="min_investment" className="block mb-2 text-gray-700 font-medium">Minimum Investment</label>
            <input
              id="min_investment"
              className={mfInputClass}
              placeholder="Min Investment"
              value={form.min_investment}
              onChange={(e) => {
                setForm({ ...form, min_investment: e.target.value });
                setErrors((prev) => ({ ...prev, min_investment: "" }));
              }}
            />
            {error(errors.min_investment)}
          </div>
          <div>
            <label htmlFor="exit_load" className="block mb-2 text-gray-700 font-medium">Exit Load</label>
            <input
              id="exit_load"
              className={mfInputClass}
              placeholder="Exit Load"
              value={form.exit_load}
              onChange={(e) => {
                setForm({ ...form, exit_load: e.target.value });
                setErrors((prev) => ({ ...prev, exit_load: "" }));
              }}
            />
            {error(errors.exit_load)}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 text-gray-700 font-medium">
            <input className={mfCheckboxClass} type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
          </label>
          <label className="flex items-center gap-3 text-gray-700 font-medium">
            <input className={mfCheckboxClass} type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} /> Popular
          </label>
          <label className="flex items-center gap-3 text-gray-700 font-medium">
            <input className={mfCheckboxClass} type="checkbox" checked={form.is_active === 1} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} /> Active
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
