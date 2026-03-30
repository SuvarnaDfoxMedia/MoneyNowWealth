import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "./MFFormShared";
import { FiCalendar, FiSearch } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getApiMessage, isDuplicateEntryMessage, toDuplicateFieldMessage } from "./mfValidation";

export default function AddMFIndexSnapshot() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { createRecord, getOne, updateRecord } = useCommonCrud({
    role,
    module: "mf/index-snapshots",
    listKey: "data",
  });

  const [form, setForm] = useState({
    benchmark_index_name: "",
    main_category_id: "",
    category_id: "",
    y1: "",
    y3: "",
    y5: "",
    y10: "",
    last_updated_date: null as Date | null,
    is_active: 1,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [mainCategoryOptions, setMainCategoryOptions] = useState<
    { _id: string; name: string }[]
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { _id: string; name: string }[]
  >([]);
  const [mainCategoryDropdownOpen, setMainCategoryDropdownOpen] = useState(false);
  const mainCategoryWrapperRef = useRef<HTMLDivElement>(null);
  const [mainCategorySearch, setMainCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryWrapperRef = useRef<HTMLDivElement>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  useEffect(() => {
    (async () => {
      const [mainRes, categoryRes] = await Promise.all([
        axiosApi.get(`/${role}/mf/main-categories`, {
          limit: 5000,
          page: 1,
          sortBy: "created_at",
          sortOrder: "desc",
        }),
        axiosApi.get(`/${role}/mf/categories`, {
          limit: 5000,
          page: 1,
          sortBy: "created_at",
          sortOrder: "desc",
        }),
      ]);
      setMainCategoryOptions(Array.isArray((mainRes as any)?.data) ? (mainRes as any).data : []);
      setCategoryOptions(Array.isArray((categoryRes as any)?.data) ? (categoryRes as any).data : []);
    })();
  }, [role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        benchmark_index_name: d.benchmark_index_name || "",
        main_category_id: d.main_category_id?._id || "",
        category_id: d.category_id?._id || "",
        y1: d.returns?.y1?.toString?.() || "",
        y3: d.returns?.y3?.toString?.() || "",
        y5: d.returns?.y5?.toString?.() || "",
        y10: d.returns?.y10?.toString?.() || "",
        last_updated_date: d.last_updated_date ? new Date(d.last_updated_date) : null,
        is_active: d.is_active ?? 1,
      });
    })();
  }, [id, getOne]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mainCategoryWrapperRef.current &&
        !mainCategoryWrapperRef.current.contains(event.target as Node)
      ) {
        setMainCategoryDropdownOpen(false);
        setMainCategorySearch("");
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
    if (!form.benchmark_index_name.trim())
      next.benchmark_index_name = "Benchmark index name is required";
    if (form.benchmark_index_name.trim().length > 200)
      next.benchmark_index_name =
        "Benchmark index name must be under 200 characters";
    if (!form.main_category_id && !form.category_id) {
      next.main_category_id = "Select a main category or category";
      next.category_id = "Select a category or main category";
    }
    if (!form.last_updated_date)
      next.last_updated_date = "Last updated date is required";

    const y1Err = validateNumber(form.y1, "1Y return");
    if (y1Err) next.y1 = y1Err;
    const y3Err = validateNumber(form.y3, "3Y return");
    if (y3Err) next.y3 = y3Err;
    const y5Err = validateNumber(form.y5, "5Y return");
    if (y5Err) next.y5 = y5Err;
    const y10Err = validateNumber(form.y10, "10Y return");
    if (y10Err) next.y10 = y10Err;

    setErrors(next);
    if (Object.keys(next).length > 0) scrollToFirstError(next);
    return Object.keys(next).length === 0;
  };

  const applyApiErrors = (err: any) => {
    const apiErrors = err?.response?.data?.errors;
    const next: Partial<Record<keyof typeof form, string>> = {};

    if (Array.isArray(apiErrors)) {
      apiErrors.forEach((e: any) => {
        const field = e?.path || e?.param;
        const msg = e?.msg || "Invalid value";
        if (field === "benchmark_index_name") next.benchmark_index_name = msg;
        if (field === "main_category_id") next.main_category_id = msg;
        if (field === "category_id") next.category_id = msg;
        if (field === "returns.y1") next.y1 = msg;
        if (field === "returns.y3") next.y3 = msg;
        if (field === "returns.y5") next.y5 = msg;
        if (field === "returns.y10") next.y10 = msg;
        if (field === "last_updated_date") next.last_updated_date = msg;
      });
    }

    const message = getApiMessage(err);
    if (!next.benchmark_index_name && isDuplicateEntryMessage(message)) {
      next.benchmark_index_name = toDuplicateFieldMessage(
        message,
        "Benchmark index name",
      );
    }

    if (Object.keys(next).length === 0) return false;
    setErrors(next);
    scrollToFirstError(next);
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      benchmark_index_name: form.benchmark_index_name.trim(),
      main_category_id: form.main_category_id || undefined,
      category_id: form.category_id || undefined,
      returns: {
        y1: form.y1 === "" ? null : Number(form.y1),
        y3: form.y3 === "" ? null : Number(form.y3),
        y5: form.y5 === "" ? null : Number(form.y5),
        y10: form.y10 === "" ? null : Number(form.y10),
      },
      last_updated_date: form.last_updated_date ? form.last_updated_date.toISOString() : null,
      is_active: form.is_active,
    };

    try {
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/index-snapshots`);
    } catch (err: any) {
      if (applyApiErrors(err)) return;
      toast.error(getApiMessage(err) || "Failed to save MF index snapshot");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      benchmark_index_name: "",
      main_category_id: "",
      category_id: "",
      y1: "",
      y3: "",
      y5: "",
      y10: "",
      last_updated_date: null,
      is_active: 1,
    });
    setErrors({});
  };

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF Index Snapshot`}
        onBack={() => navigate(`/${role}/mf/index-snapshots`)}
      />
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="benchmark_index_name" className="block mb-2 text-gray-700 font-medium">
              Benchmark Index Name
            </label>
            <input
              id="benchmark_index_name"
              className={`${mfInputClass} ${errors.benchmark_index_name ? "!border-red-500 focus:!border-red-500" : ""}`}
              placeholder="Benchmark Index Name"
              value={form.benchmark_index_name}
              onChange={(e) => {
                setForm({ ...form, benchmark_index_name: e.target.value });
                setErrors((prev) => ({ ...prev, benchmark_index_name: "" }));
              }}
            />
            {error(errors.benchmark_index_name)}
          </div>

          <div ref={mainCategoryWrapperRef} className="relative">
            <label className="block mb-2 text-gray-700 font-medium">Main Category</label>
            <div
              onClick={() => setMainCategoryDropdownOpen((prev) => !prev)}
              className={`w-full h-11 px-3 rounded-md flex justify-between items-center cursor-pointer border ${
                errors.main_category_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <span>
                {mainCategoryOptions.length === 0
                  ? "Loading categories..."
                  : (mainCategoryOptions.find((t) => t._id === form.main_category_id)?.name ??
                    "Select Main Category")}
              </span>
              <svg
                className={`w-4 h-4 transform transition-transform ${mainCategoryDropdownOpen ? "rotate-180" : "rotate-0"}`}
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
            {error(errors.main_category_id)}
            {mainCategoryDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-lg">
                <div className="relative border-b border-gray-200">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search main category..."
                    value={mainCategorySearch}
                    onChange={(e) => setMainCategorySearch(e.target.value)}
                    className="w-full h-11 border-0 rounded-none pl-9 pr-3 focus:outline-none"
                  />
                </div>
                {mainCategoryOptions
                  .filter((t) =>
                    t.name.toLowerCase().includes(mainCategorySearch.toLowerCase()),
                  )
                  .map((t) => (
                    <div
                      key={t._id}
                      onClick={() => {
                        setForm({ ...form, main_category_id: t._id });
                        setMainCategoryDropdownOpen(false);
                        setMainCategorySearch("");
                        setErrors((prev) => ({
                          ...prev,
                          main_category_id: "",
                          category_id: "",
                        }));
                      }}
                      className={`p-2 cursor-pointer hover:bg-blue-100 ${form.main_category_id === t._id ? "bg-blue-50 font-medium" : ""}`}
                    >
                      {t.name}
                    </div>
                  ))}
                {mainCategoryOptions.filter((t) =>
                  t.name.toLowerCase().includes(mainCategorySearch.toLowerCase()),
                ).length === 0 && (
                  <p className="text-gray-400 text-sm p-2">No categories found.</p>
                )}
              </div>
            )}
          </div>

          <div ref={categoryWrapperRef} className="relative">
            <label className="block mb-2 text-gray-700 font-medium">Category (Optional)</label>
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
                <div className="relative border-b border-gray-200">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full h-11 border-0 rounded-none pl-9 pr-3 focus:outline-none"
                  />
                </div>
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
                        setErrors((prev) => ({
                          ...prev,
                          main_category_id: "",
                          category_id: "",
                        }));
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

          <div>
            <label htmlFor="last_updated_date" className="block mb-2 text-gray-700 font-medium">
              Last Updated Date
            </label>
            <div className="relative">
              <DatePicker
                selected={form.last_updated_date}
                onChange={(date) => {
                  setForm({ ...form, last_updated_date: date });
                  setErrors((prev) => ({ ...prev, last_updated_date: "" }));
                }}
                dateFormat="dd/MM/yyyy"
                className={`${mfInputClass} ${errors.last_updated_date ? "!border-red-500 focus:!border-red-500" : ""} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.last_updated_date)}
          </div>
        </div>

        <div>
          <label className="block mb-2 text-gray-700 font-medium">Returns</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="returns_y1" className="block mb-2 text-gray-700 font-medium">1Y</label>
              <input
                id="returns_y1"
                className={`${mfInputClass} ${errors.y1 ? "!border-red-500 focus:!border-red-500" : ""}`}
                placeholder="1Y"
                value={form.y1}
                onChange={(e) => {
                  setForm({ ...form, y1: e.target.value });
                  setErrors((prev) => ({ ...prev, y1: "" }));
                }}
              />
              {error(errors.y1)}
            </div>
            <div>
              <label htmlFor="returns_y3" className="block mb-2 text-gray-700 font-medium">3Y</label>
              <input
                id="returns_y3"
                className={`${mfInputClass} ${errors.y3 ? "!border-red-500 focus:!border-red-500" : ""}`}
                placeholder="3Y"
                value={form.y3}
                onChange={(e) => {
                  setForm({ ...form, y3: e.target.value });
                  setErrors((prev) => ({ ...prev, y3: "" }));
                }}
              />
              {error(errors.y3)}
            </div>
            <div>
              <label htmlFor="returns_y5" className="block mb-2 text-gray-700 font-medium">5Y</label>
              <input
                id="returns_y5"
                className={`${mfInputClass} ${errors.y5 ? "!border-red-500 focus:!border-red-500" : ""}`}
                placeholder="5Y"
                value={form.y5}
                onChange={(e) => {
                  setForm({ ...form, y5: e.target.value });
                  setErrors((prev) => ({ ...prev, y5: "" }));
                }}
              />
              {error(errors.y5)}
            </div>
            <div>
              <label htmlFor="returns_y10" className="block mb-2 text-gray-700 font-medium">10Y</label>
              <input
                id="returns_y10"
                className={`${mfInputClass} ${errors.y10 ? "!border-red-500 focus:!border-red-500" : ""}`}
                placeholder="10Y"
                value={form.y10}
                onChange={(e) => {
                  setForm({ ...form, y10: e.target.value });
                  setErrors((prev) => ({ ...prev, y10: "" }));
                }}
              />
              {error(errors.y10)}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 text-gray-700 font-medium">
          <input className={mfCheckboxClass} type="checkbox" checked={form.is_active === 1} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} /> Active
        </label>

        <MFFormActions
          onReset={resetForm}
          isSubmitting={saving}
          submitLabel={id ? "Update" : "Save"}
        />
      </form>
    </MFFormContainer>
  );
}
