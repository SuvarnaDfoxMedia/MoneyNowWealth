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
import { RichTextField } from "../PagesComponent/RichTextField";
import { FiCalendar } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddMFNfo() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/nfo",
    listKey: "data",
  });

  const [form, setForm] = useState({
    fund_name: "",
    amc_name: "",
    category_id: "",
    fund_objective_short: "",
    subscription_start_date: null as Date | null,
    subscription_end_date: null as Date | null,
    min_investment: "",
    benchmark: "",
    risk_level: "",
    is_open: true,
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
        fund_objective_short: d.fund_objective_short || "",
        subscription_start_date: d.subscription_start_date ? new Date(d.subscription_start_date) : null,
        subscription_end_date: d.subscription_end_date ? new Date(d.subscription_end_date) : null,
        min_investment: d.min_investment?.toString?.() || "",
        benchmark: d.benchmark || "",
        risk_level: d.risk_level || "",
        is_open: !!d.is_open,
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
    min = 0,
    max = 1_000_000_000,
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
    if (!form.subscription_start_date)
      next.subscription_start_date = "Start date is required";
    if (!form.subscription_end_date)
      next.subscription_end_date = "End date is required";
    if (
      form.subscription_start_date &&
      form.subscription_end_date &&
      form.subscription_end_date < form.subscription_start_date
    ) {
      next.subscription_end_date =
        "End date must be on or after start date";
    }

    const minInvErr = validateNumber(
      form.min_investment,
      "Minimum investment",
    );
    if (minInvErr) next.min_investment = minInvErr;
    if (form.benchmark.length > 200)
      next.benchmark = "Benchmark must be under 200 characters";
    if (form.risk_level.length > 200)
      next.risk_level = "Risk level must be under 200 characters";

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
      if (field === "subscription_start_date") next.subscription_start_date = msg;
      if (field === "subscription_end_date") next.subscription_end_date = msg;
      if (field === "min_investment") next.min_investment = msg;
      if (field === "benchmark") next.benchmark = msg;
      if (field === "risk_level") next.risk_level = msg;
      if (field === "fund_objective_short") next.fund_objective_short = msg;
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
      fund_objective_short: form.fund_objective_short,
      subscription_start_date: form.subscription_start_date ? form.subscription_start_date.toISOString() : null,
      subscription_end_date: form.subscription_end_date ? form.subscription_end_date.toISOString() : null,
      min_investment: form.min_investment === "" ? null : Number(form.min_investment),
      benchmark: form.benchmark,
      risk_level: form.risk_level,
      is_open: form.is_open,
      is_active: form.is_active,
    };

    try {
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/nfo`);
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
      fund_objective_short: "",
      subscription_start_date: null,
      subscription_end_date: null,
      min_investment: "",
      benchmark: "",
      risk_level: "",
      is_open: true,
      is_active: 1,
    });
    setErrors({});
  };

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF NFO`}
        onBack={() => navigate(`/${role}/mf/nfo`)}
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
            <label htmlFor="subscription_start_date" className="block mb-2 text-gray-700 font-medium">Subscription Start Date</label>
            <div className="relative">
              <DatePicker
                selected={form.subscription_start_date}
                onChange={(date) => {
                  setForm({ ...form, subscription_start_date: date });
                  setErrors((prev) => ({ ...prev, subscription_start_date: "" }));
                }}
                dateFormat="dd/MM/yyyy"
                className={`${mfInputClass} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.subscription_start_date)}
          </div>
          <div>
            <label htmlFor="subscription_end_date" className="block mb-2 text-gray-700 font-medium">Subscription End Date</label>
            <div className="relative">
              <DatePicker
                selected={form.subscription_end_date}
                onChange={(date) => {
                  setForm({ ...form, subscription_end_date: date });
                  setErrors((prev) => ({ ...prev, subscription_end_date: "" }));
                }}
                dateFormat="dd/MM/yyyy"
                className={`${mfInputClass} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.subscription_end_date)}
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
            <label htmlFor="benchmark" className="block mb-2 text-gray-700 font-medium">Benchmark</label>
            <input
              id="benchmark"
              className={mfInputClass}
              placeholder="Benchmark"
              value={form.benchmark}
              onChange={(e) => {
                setForm({ ...form, benchmark: e.target.value });
                setErrors((prev) => ({ ...prev, benchmark: "" }));
              }}
            />
            {error(errors.benchmark)}
          </div>
          <div>
            <label htmlFor="risk_level" className="block mb-2 text-gray-700 font-medium">Risk Level</label>
            <input
              id="risk_level"
              className={mfInputClass}
              placeholder="Risk Level"
              value={form.risk_level}
              onChange={(e) => {
                setForm({ ...form, risk_level: e.target.value });
                setErrors((prev) => ({ ...prev, risk_level: "" }));
              }}
            />
            {error(errors.risk_level)}
          </div>
        </div>

        <div>
          <label className="block mb-2 text-gray-700 font-medium">Fund Objective (Short)</label>
          <RichTextField
            value={form.fund_objective_short}
            onChange={(val) => {
              setForm({ ...form, fund_objective_short: val });
              setErrors((prev) => ({ ...prev, fund_objective_short: "" }));
            }}
            height={280}
          />
          {error(errors.fund_objective_short)}
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 text-gray-700 font-medium">
            <input className={mfCheckboxClass} type="checkbox" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} /> Open
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
