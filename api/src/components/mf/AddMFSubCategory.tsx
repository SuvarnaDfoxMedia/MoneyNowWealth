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
import { RichTextField } from "../PagesComponent/RichTextField";
import { FiSearch } from "react-icons/fi";
import { getApiMessage, isDuplicateEntryMessage, toDuplicateFieldMessage } from "./mfValidation";

interface MainCategoryOption {
  _id: string;
  name: string;
}

export default function AddMFCategory() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/categories",
    listKey: "data",
  });

  const [mainCategoryOptions, setMainCategoryOptions] = useState<MainCategoryOption[]>([]);
  const [mainCategoryDropdownOpen, setMainCategoryDropdownOpen] = useState(false);
  const mainCategoryWrapperRef = useRef<HTMLDivElement>(null);
  const [mainCategorySearch, setMainCategorySearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    main_category_id: "",
    description: "",
    benchmark_index_name: "",
    y1: "",
    y3: "",
    y5: "",
    y10: "",
    category_avg_y1: "",
    category_avg_y3: "",
    category_avg_y5: "",
    category_avg_y10: "",
    risk_level: "",
    suggested_use_case: "",
    suggested_use_case_note: "",
    is_active: 1,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  useEffect(() => {
    (async () => {
      const res: any = await axiosApi.get(`/${role}/mf/main-categories`, {
        limit: 5000,
        page: 1,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      setMainCategoryOptions(Array.isArray(res?.data) ? res.data : []);
    })();
  }, [role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        name: d.name || "",
        main_category_id: d.main_category_id?._id || "",
        description: d.description || "",
        benchmark_index_name: d.benchmark_index_name || "",
        // Bug 2: y1/y3/y5/y10 are the manually-editable category_returns.trailing fields
        // (the UI section was mislabelled "Benchmark Returns" — now corrected to "Category Returns").
        y1: d.category_returns?.trailing?.["1y"]?.toString?.() || "",
        y3: d.category_returns?.trailing?.["3y"]?.toString?.() || "",
        y5: d.category_returns?.trailing?.["5y"]?.toString?.() || "",
        y10: d.category_returns?.trailing?.["10y"]?.toString?.() || "",
        // category_average_returns is auto-computed by the backend from active fund returns.
        // We display it read-only; the correct nested path uses "1y" string keys.
        category_avg_y1: d.category_average_returns?.trailing?.["1y"]?.toString?.() || "",
        category_avg_y3: d.category_average_returns?.trailing?.["3y"]?.toString?.() || "",
        category_avg_y5: d.category_average_returns?.trailing?.["5y"]?.toString?.() || "",
        category_avg_y10: d.category_average_returns?.trailing?.["10y"]?.toString?.() || "",
        risk_level: d.risk_level || "",
        suggested_use_case: d.suggested_use_case || "",
        suggested_use_case_note: d.suggested_use_case_note || "",
        is_active: d.is_active ?? 1,
      });
    })();
  }, [getOne, id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mainCategoryWrapperRef.current &&
        !mainCategoryWrapperRef.current.contains(event.target as Node)
      ) {
        setMainCategoryDropdownOpen(false);
        setMainCategorySearch("");
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
    if (!form.main_category_id) next.main_category_id = "Main category is required";
    if (!form.name.trim()) next.name = "Name is required";
    if (form.name.trim().length > 120)
      next.name = "Name must be under 120 characters";
    if (form.description && form.description.length > 5000)
      next.description = "Description must be under 5000 characters";
    if (form.benchmark_index_name.length > 200)
      next.benchmark_index_name =
        "Benchmark index name must be under 200 characters";

    const y1Err = validateNumber(form.y1, "1Y return");
    if (y1Err) next.y1 = y1Err;
    const y3Err = validateNumber(form.y3, "3Y return");
    if (y3Err) next.y3 = y3Err;
    const y5Err = validateNumber(form.y5, "5Y return");
    if (y5Err) next.y5 = y5Err;
    const y10Err = validateNumber(form.y10, "10Y return");
    if (y10Err) next.y10 = y10Err;
    const catY1Err = validateNumber(form.category_avg_y1, "Category average 1Y return");
    if (catY1Err) next.category_avg_y1 = catY1Err;
    const catY3Err = validateNumber(form.category_avg_y3, "Category average 3Y return");
    if (catY3Err) next.category_avg_y3 = catY3Err;
    const catY5Err = validateNumber(form.category_avg_y5, "Category average 5Y return");
    if (catY5Err) next.category_avg_y5 = catY5Err;
    const catY10Err = validateNumber(form.category_avg_y10, "Category average 10Y return");
    if (catY10Err) next.category_avg_y10 = catY10Err;

    if (form.risk_level.length > 200)
      next.risk_level = "Risk level must be under 200 characters";
    if (form.suggested_use_case.length > 500)
      next.suggested_use_case =
        "Suggested use case must be under 500 characters";
    if (form.suggested_use_case_note.length > 5000)
      next.suggested_use_case_note =
        "Suggested use case note must be under 5000 characters";

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
        if (field === "name") next.name = msg;
        if (field === "main_category_id") next.main_category_id = msg;
        if (field === "description") next.description = msg;
        if (field === "benchmark_index_name") next.benchmark_index_name = msg;
        if (field === "category_returns.trailing.1y") next.y1 = msg;
        if (field === "category_returns.trailing.3y") next.y3 = msg;
        if (field === "category_returns.trailing.5y") next.y5 = msg;
        if (field === "category_returns.trailing.10y") next.y10 = msg;
        if (field === "risk_level") next.risk_level = msg;
        if (field === "suggested_use_case") next.suggested_use_case = msg;
        if (field === "suggested_use_case_note") next.suggested_use_case_note = msg;
      });
    }

    const message = getApiMessage(err);
    if (
      !next.name &&
      isDuplicateEntryMessage(message) &&
      !/e11000.*index:/i.test(message)
    ) {
      next.name = toDuplicateFieldMessage(message, "Category name");
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
      name: form.name.trim(),
      main_category_id: form.main_category_id,
      description: form.description.trim(),
      benchmark_index_name: form.benchmark_index_name.trim(),
      // Bug 2: write to category_returns.trailing with "1y"/"3y" string keys.
      // category_average_returns is intentionally omitted — it is auto-computed
      // by the backend (recomputeCategoryAverageReturns) and must not be overwritten here.
      category_returns: {
        trailing: {
          "1y":  form.y1  === "" ? null : Number(form.y1),
          "3y":  form.y3  === "" ? null : Number(form.y3),
          "5y":  form.y5  === "" ? null : Number(form.y5),
          "10y": form.y10 === "" ? null : Number(form.y10),
        },
      },
      risk_level: form.risk_level.trim(),
      suggested_use_case: form.suggested_use_case.trim(),
      suggested_use_case_note: form.suggested_use_case_note.trim(),
      is_active: form.is_active,
    };

    try {
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/categories`);
    } catch (err: any) {
      const message = getApiMessage(err);
      if (applyApiErrors(err)) return;
      if (/e11000.*index:/i.test(message)) {
        toast.error(
          "Legacy database index conflict detected. Run MF index repair and try again.",
        );
        return;
      }
      toast.error(message || "Failed to save MF category");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      main_category_id: "",
      description: "",
      benchmark_index_name: "",
      y1: "",
      y3: "",
      y5: "",
      y10: "",
      category_avg_y1: "",
      category_avg_y3: "",
      category_avg_y5: "",
      category_avg_y10: "",
      risk_level: "",
      suggested_use_case: "",
      suggested_use_case_note: "",
      is_active: 1,
    });
    setErrors({});
  };

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;
  const inputClass = (m?: string) =>
    `${mfInputClass} ${m ? "!border-red-500 focus:!border-red-500" : ""}`;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF Category`}
        onBack={() => navigate(`/${role}/mf/categories`)}
      />
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                        setErrors((prev) => ({ ...prev, main_category_id: "" }));
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

          <div>
            <label htmlFor="category_name" className="block mb-2 text-gray-700 font-medium">Name</label>
            <input
              id="category_name"
              className={inputClass(errors.name)}
              placeholder="Category name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
            />
            {error(errors.name)}
          </div>
        </div>

        <div>
          <label className="block mb-2 text-gray-700 font-medium">Short Description</label>
          <RichTextField
            value={form.description}
            onChange={(val) => {
              setForm({ ...form, description: val });
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            height={260}
          />
          {error(errors.description)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="benchmark_index_name" className="block mb-2 text-gray-700 font-medium">Benchmark Index Name</label>
            <input
              id="benchmark_index_name"
              className={inputClass(errors.benchmark_index_name)}
              placeholder="Benchmark index"
              value={form.benchmark_index_name}
              onChange={(e) => {
                setForm({ ...form, benchmark_index_name: e.target.value });
                setErrors((prev) => ({ ...prev, benchmark_index_name: "" }));
              }}
            />
            {error(errors.benchmark_index_name)}
          </div>
        </div>

        <div>
          {/* Bug 2: label corrected — these fields store category_returns.trailing, not benchmark data */}
          <label className="block mb-2 text-gray-700 font-medium">Category Returns</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="benchmark_y1" className="block mb-2 text-gray-700 font-medium">1Y</label>
              <input
                id="benchmark_y1"
                className={inputClass(errors.y1)}
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
              <label htmlFor="benchmark_y3" className="block mb-2 text-gray-700 font-medium">3Y</label>
              <input
                id="benchmark_y3"
                className={inputClass(errors.y3)}
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
              <label htmlFor="benchmark_y5" className="block mb-2 text-gray-700 font-medium">5Y</label>
              <input
                id="benchmark_y5"
                className={inputClass(errors.y5)}
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
              <label htmlFor="benchmark_y10" className="block mb-2 text-gray-700 font-medium">10Y</label>
              <input
                id="benchmark_y10"
                className={inputClass(errors.y10)}
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

        <div>
          <label className="block mb-2 text-gray-700 font-medium">Category Average Returns</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="category_avg_y1" className="block mb-2 text-gray-700 font-medium">1Y</label>
              <input
                id="category_avg_y1"
                className={inputClass(errors.category_avg_y1)}
                placeholder="1Y"
                value={form.category_avg_y1}
                onChange={(e) => {
                  setForm({ ...form, category_avg_y1: e.target.value });
                  setErrors((prev) => ({ ...prev, category_avg_y1: "" }));
                }}
              />
              {error(errors.category_avg_y1)}
            </div>
            <div>
              <label htmlFor="category_avg_y3" className="block mb-2 text-gray-700 font-medium">3Y</label>
              <input
                id="category_avg_y3"
                className={inputClass(errors.category_avg_y3)}
                placeholder="3Y"
                value={form.category_avg_y3}
                onChange={(e) => {
                  setForm({ ...form, category_avg_y3: e.target.value });
                  setErrors((prev) => ({ ...prev, category_avg_y3: "" }));
                }}
              />
              {error(errors.category_avg_y3)}
            </div>
            <div>
              <label htmlFor="category_avg_y5" className="block mb-2 text-gray-700 font-medium">5Y</label>
              <input
                id="category_avg_y5"
                className={inputClass(errors.category_avg_y5)}
                placeholder="5Y"
                value={form.category_avg_y5}
                onChange={(e) => {
                  setForm({ ...form, category_avg_y5: e.target.value });
                  setErrors((prev) => ({ ...prev, category_avg_y5: "" }));
                }}
              />
              {error(errors.category_avg_y5)}
            </div>
            <div>
              <label htmlFor="category_avg_y10" className="block mb-2 text-gray-700 font-medium">10Y</label>
              <input
                id="category_avg_y10"
                className={inputClass(errors.category_avg_y10)}
                placeholder="10Y"
                value={form.category_avg_y10}
                onChange={(e) => {
                  setForm({ ...form, category_avg_y10: e.target.value });
                  setErrors((prev) => ({ ...prev, category_avg_y10: "" }));
                }}
              />
              {error(errors.category_avg_y10)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="risk_level" className="block mb-2 text-gray-700 font-medium">Risk Level</label>
            <input
              id="risk_level"
              className={inputClass(errors.risk_level)}
              placeholder="Risk level"
              value={form.risk_level}
              onChange={(e) => {
                setForm({ ...form, risk_level: e.target.value });
                setErrors((prev) => ({ ...prev, risk_level: "" }));
              }}
            />
            {error(errors.risk_level)}
          </div>

          <div>
            <label htmlFor="suggested_use_case" className="block mb-2 text-gray-700 font-medium">Suggested Use Case</label>
            <input
              id="suggested_use_case"
              className={inputClass(errors.suggested_use_case)}
              placeholder="Suggested use case title"
              value={form.suggested_use_case}
              onChange={(e) => {
                setForm({ ...form, suggested_use_case: e.target.value });
                setErrors((prev) => ({ ...prev, suggested_use_case: "" }));
              }}
            />
            {error(errors.suggested_use_case)}
          </div>
        </div>

        <div>
          <label htmlFor="suggested_use_case_note" className="block mb-2 text-gray-700 font-medium">Suggested Use Case Note</label>
          <textarea
            id="suggested_use_case_note"
            className={`${inputClass(errors.suggested_use_case_note)} min-h-[120px] resize-y`}
            placeholder="Add descriptive note for this use case"
            value={form.suggested_use_case_note}
            onChange={(e) => {
              setForm({ ...form, suggested_use_case_note: e.target.value });
              setErrors((prev) => ({ ...prev, suggested_use_case_note: "" }));
            }}
          />
          {error(errors.suggested_use_case_note)}
        </div>

        <label className="flex items-center gap-3 text-gray-700 font-medium">
          <input
            className={mfCheckboxClass}
            type="checkbox"
            checked={form.is_active === 1}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
          />
          Active
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
