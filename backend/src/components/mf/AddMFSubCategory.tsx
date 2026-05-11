import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiSearch } from "react-icons/fi";
import { axiosApi } from "../../api/axios";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
} from "./MFFormShared";
import { RichTextField } from "../PagesComponent/RichTextField";
import {
  getApiMessage,
  isDuplicateEntryMessage,
  toDuplicateFieldMessage,
} from "./mfValidation";

const TRAILING_FIELDS = [
  { key: "1w", label: "1 Week" },
  { key: "1m", label: "1 Month" },
  { key: "3m", label: "3 Months" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
  { key: "3y", label: "3 Years" },
  { key: "5y", label: "5 Years" },
  { key: "10y", label: "10 Years" },
  { key: "since_launch", label: "Since Launch" },
] as const;

const buildAnnualYears = (startYear = new Date().getFullYear() - 1, count = 9) =>
  Array.from({ length: count }, (_, index) => String(startYear - index));

type MainCategoryOption = {
  _id: string;
  name: string;
};

const emptyAnnualValues = (years: string[]) =>
  Object.fromEntries(years.map((year) => [year, ""])) as Record<string, string>;

const emptyTrailingValues = () =>
  Object.fromEntries(TRAILING_FIELDS.map((field) => [field.key, ""])) as Record<
    (typeof TRAILING_FIELDS)[number]["key"],
    string
  >;

export default function AddMFCategory() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/categories",
    listKey: "data",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const [mainCategoryOptions, setMainCategoryOptions] = useState<
    MainCategoryOption[]
  >([]);
  const [mainCategoryDropdownOpen, setMainCategoryDropdownOpen] =
    useState(false);
  const [mainCategorySearch, setMainCategorySearch] = useState("");
  const mainCategoryWrapperRef = useRef<HTMLDivElement>(null);

  const annualYears = useMemo(() => buildAnnualYears(), []);

  const [form, setForm] = useState({
    name: "",
    main_category_id: "",
    description: "",
    categoryTrailing: emptyTrailingValues(),
    categoryAnnual: emptyAnnualValues(annualYears),
    categoryAverageTrailing: emptyTrailingValues(),
    categoryAverageAnnual: emptyAnnualValues(annualYears),
    risk_level: "",
    suggested_use_case: "",
    suggested_use_case_note: "",
    is_active: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
      const category = res?.data || {};

      setForm({
        name: category.name || "",
        main_category_id: category.main_category_id?._id || "",
        description: category.description || "",
        categoryTrailing: {
          ...emptyTrailingValues(),
          ...Object.fromEntries(
            TRAILING_FIELDS.map((field) => [
              field.key,
              category.category_returns?.trailing?.[field.key]?.toString?.() || "",
            ]),
          ),
        },
        categoryAnnual: {
          ...emptyAnnualValues(annualYears),
          ...Object.fromEntries(
            annualYears.map((year) => [
              year,
              category.category_returns?.annual?.yearly_returns?.[year]?.toString?.() || "",
            ]),
          ),
        },
        categoryAverageTrailing: {
          ...emptyTrailingValues(),
          ...Object.fromEntries(
            TRAILING_FIELDS.map((field) => [
              field.key,
              category.category_average_returns?.trailing?.[field.key]?.toString?.() || "",
            ]),
          ),
        },
        categoryAverageAnnual: {
          ...emptyAnnualValues(annualYears),
          ...Object.fromEntries(
            annualYears.map((year) => [
              year,
              category.category_average_returns?.annual?.yearly_returns?.[year]?.toString?.() ||
                "",
            ]),
          ),
        },
        risk_level: category.risk_level || "",
        suggested_use_case: category.suggested_use_case || "",
        suggested_use_case_note: category.suggested_use_case_note || "",
        is_active: category.is_active ?? 1,
      });
    })();
  }, [annualYears, getOne, id]);

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

  const filteredMainCategories = useMemo(
    () =>
      mainCategoryOptions.filter((option) =>
        option.name.toLowerCase().includes(mainCategorySearch.toLowerCase()),
      ),
    [mainCategoryOptions, mainCategorySearch],
  );

  const setField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const setNestedNumberField = (
    group:
      | "categoryTrailing"
      | "categoryAnnual"
      | "categoryAverageTrailing"
      | "categoryAverageAnnual",
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

    if (!form.main_category_id) {
      nextErrors.main_category_id = "Main category is required";
    }
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (form.name.trim().length > 120) {
      nextErrors.name = "Name must be under 120 characters";
    }
    if (form.description.length > 5000) {
      nextErrors.description = "Description must be under 5000 characters";
    }
    if (form.risk_level.length > 200) {
      nextErrors.risk_level = "Risk level must be under 200 characters";
    }
    if (form.suggested_use_case.length > 500) {
      nextErrors.suggested_use_case =
        "Suggested use case must be under 500 characters";
    }
    if (form.suggested_use_case_note.length > 5000) {
      nextErrors.suggested_use_case_note =
        "Suggested use case note must be under 5000 characters";
    }

    for (const field of TRAILING_FIELDS) {
      const categoryError = validateNumber(
        form.categoryTrailing[field.key],
        `Category ${field.label}`,
      );
      if (categoryError) {
        nextErrors[`categoryTrailing.${field.key}`] = categoryError;
      }
    }

    for (const field of TRAILING_FIELDS) {
      const categoryAverageError = validateNumber(
        form.categoryAverageTrailing[field.key],
        `Category average ${field.label}`,
      );
      if (categoryAverageError) {
        nextErrors[`categoryAverageTrailing.${field.key}`] =
          categoryAverageError;
      }
    }

    for (const year of annualYears) {
      const categoryError = validateNumber(
        form.categoryAnnual[year],
        `Category ${year}`,
      );
      if (categoryError) {
        nextErrors[`categoryAnnual.${year}`] = categoryError;
      }
    }

    for (const year of annualYears) {
      const categoryAverageError = validateNumber(
        form.categoryAverageAnnual[year],
        `Category average ${year}`,
      );
      if (categoryAverageError) {
        nextErrors[`categoryAverageAnnual.${year}`] = categoryAverageError;
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
        nextErrors[path] = message;
      });
    }

    const message = getApiMessage(err);
    if (
      !nextErrors.name &&
      isDuplicateEntryMessage(message) &&
      !/e11000.*index:/i.test(message)
    ) {
      nextErrors.name = toDuplicateFieldMessage(message, "Category name");
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
      name: form.name.trim(),
      main_category_id: form.main_category_id,
      description: form.description.trim(),
      category_returns: {
        trailing: toNumberMap(form.categoryTrailing),
        annual: {
          ytd: null,
          yearly_returns: toNumberMap(form.categoryAnnual),
        },
      },
      category_average_returns: {
        trailing: toNumberMap(form.categoryAverageTrailing),
        annual: {
          ytd: null,
          yearly_returns: toNumberMap(form.categoryAverageAnnual),
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
      categoryTrailing: emptyTrailingValues(),
      categoryAnnual: emptyAnnualValues(annualYears),
      categoryAverageTrailing: emptyTrailingValues(),
      categoryAverageAnnual: emptyAnnualValues(annualYears),
      risk_level: "",
      suggested_use_case: "",
      suggested_use_case_note: "",
      is_active: 1,
    });
    setErrors({});
  };

  const inputClass = (message?: string) =>
    `${mfInputClass} ${message ? "!border-red-500 focus:!border-red-500" : ""}`;
  const error = (message?: string) =>
    message ? <p className="mt-1 text-sm text-red-500">{message}</p> : null;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF Category`}
        onBack={() => navigate(`/${role}/mf/categories`)}
      />

      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div ref={mainCategoryWrapperRef} className="relative">
            <label className="mb-2 block font-medium text-gray-700">
              Main Category
            </label>
            <div
              onClick={() => setMainCategoryDropdownOpen((prev) => !prev)}
              className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-md border px-3 ${
                errors.main_category_id
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <span>
                {mainCategoryOptions.length === 0
                  ? "Loading categories..."
                  : mainCategoryOptions.find(
                        (item) => item._id === form.main_category_id,
                      )?.name || "Select Main Category"}
              </span>
              <svg
                className={`h-4 w-4 transform transition-transform ${
                  mainCategoryDropdownOpen ? "rotate-180" : "rotate-0"
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
            {error(errors.main_category_id)}
            {mainCategoryDropdownOpen ? (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
                <div className="relative border-b border-gray-200">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={mainCategorySearch}
                    placeholder="Search main category..."
                    onChange={(event) =>
                      setMainCategorySearch(event.target.value)
                    }
                    className="h-11 w-full rounded-none border-0 pl-9 pr-3 focus:outline-none"
                  />
                </div>
                {filteredMainCategories.map((option) => (
                  <div
                    key={option._id}
                    onClick={() => {
                      setField("main_category_id", option._id);
                      setMainCategoryDropdownOpen(false);
                      setMainCategorySearch("");
                    }}
                    className={`cursor-pointer p-2 hover:bg-blue-100 ${
                      form.main_category_id === option._id
                        ? "bg-blue-50 font-medium"
                        : ""
                    }`}
                  >
                    {option.name}
                  </div>
                ))}
                {filteredMainCategories.length === 0 ? (
                  <p className="p-2 text-sm text-gray-400">
                    No categories found.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">Name</label>
            <input
              className={inputClass(errors.name)}
              placeholder="Category name"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
            />
            {error(errors.name)}
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-gray-700">
            Description
          </label>
          <RichTextField
            value={form.description}
            onChange={(value) => setField("description", value)}
            height={260}
          />
          {error(errors.description)}
        </div>

        <div className="space-y-8">
          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[#043f79]">
                Category Returns
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRAILING_FIELDS.map((field) => (
                <div key={`category-${field.key}`}>
                  <label className="mb-2 block font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    className={inputClass(errors[`categoryTrailing.${field.key}`])}
                    value={form.categoryTrailing[field.key]}
                    onChange={(event) =>
                      setNestedNumberField(
                        "categoryTrailing",
                        field.key,
                        event.target.value,
                      )
                    }
                  />
                  {error(errors[`categoryTrailing.${field.key}`])}
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {annualYears.map((year) => (
                <div key={`category-year-${year}`}>
                  <label className="mb-2 block font-medium text-gray-700">
                    {year}
                  </label>
                  <input
                    className={inputClass(errors[`categoryAnnual.${year}`])}
                    value={form.categoryAnnual[year]}
                    onChange={(event) =>
                      setNestedNumberField("categoryAnnual", year, event.target.value)
                    }
                  />
                  {error(errors[`categoryAnnual.${year}`])}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[#043f79]">
                Category Average Returns
              </h3>
              <p className="text-sm text-gray-500">
                These values are also recalculated from active funds when fund
                data changes.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRAILING_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    className={inputClass(
                      errors[`categoryAverageTrailing.${field.key}`],
                    )}
                    placeholder={field.label}
                    value={form.categoryAverageTrailing[field.key]}
                    onChange={(event) =>
                      setNestedNumberField(
                        "categoryAverageTrailing",
                        field.key,
                        event.target.value,
                      )
                    }
                  />
                  {error(errors[`categoryAverageTrailing.${field.key}`])}
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {annualYears.map((year) => (
                <div key={year}>
                  <label className="mb-2 block font-medium text-gray-700">
                    {year}
                  </label>
                  <input
                    className={inputClass(
                      errors[`categoryAverageAnnual.${year}`],
                    )}
                    placeholder={year}
                    value={form.categoryAverageAnnual[year]}
                    onChange={(event) =>
                      setNestedNumberField(
                        "categoryAverageAnnual",
                        year,
                        event.target.value,
                      )
                    }
                  />
                  {error(errors[`categoryAverageAnnual.${year}`])}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Risk Level
            </label>
            <input
              className={inputClass(errors.risk_level)}
              placeholder="Risk level"
              value={form.risk_level}
              onChange={(event) => setField("risk_level", event.target.value)}
            />
            {error(errors.risk_level)}
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Suggested Use Case
            </label>
            <input
              className={inputClass(errors.suggested_use_case)}
              placeholder="Suggested use case"
              value={form.suggested_use_case}
              onChange={(event) =>
                setField("suggested_use_case", event.target.value)
              }
            />
            {error(errors.suggested_use_case)}
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium text-gray-700">
            Suggested Use Case Note
          </label>
          <textarea
            className={`${inputClass(errors.suggested_use_case_note)} min-h-[120px] resize-y`}
            placeholder="Add suggested use case note"
            value={form.suggested_use_case_note}
            onChange={(event) =>
              setField("suggested_use_case_note", event.target.value)
            }
          />
          {error(errors.suggested_use_case_note)}
        </div>

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

        <MFFormActions
          onReset={resetForm}
          isSubmitting={saving}
          submitLabel={id ? "Update" : "Save"}
        />
      </form>
    </MFFormContainer>
  );
}
