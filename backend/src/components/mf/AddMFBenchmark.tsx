import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
} from "./MFFormShared";
import {
  getApiMessage,
  isDuplicateEntryMessage,
  toDuplicateFieldMessage,
} from "./mfValidation";
import { axiosApi } from "../../api/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

const ANNUAL_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"] as const;

export default function AddMFBenchmark() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/benchmarks",
    listKey: "data",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    category_id: "",
    main_category_id: "",
    type: "index",
    is_active: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [returnsForm, setReturnsForm] = useState({
    date: null as Date | null,
    return_1d: "",
    return_1w: "",
    return_1m: "",
    return_3m: "",
    return_6m: "",
    return_ytd: "",
    return_1y: "",
    return_3y: "",
    return_5y: "",
    return_10y: "",
    return_since_inception: "",
    annual: Object.fromEntries(ANNUAL_YEARS.map((year) => [year, ""])) as Record<string, string>,
  });

  useEffect(() => {
    (async () => {
      const response: any = await axiosApi.get(`/${role}/mf/categories`, {
        page: 1,
        limit: 5000,
        sortBy: "name",
        sortOrder: "asc",
      });
      setCategories(Array.isArray(response?.data) ? response.data : []);
    })();
  }, [role]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        name: d.name || "",
        category: d.category || "",
        category_id: d.category_id?._id || d.category_id || "",
        main_category_id: d.main_category_id?._id || d.main_category_id || "",
        type: d.type || "index",
        is_active: d.is_active ?? 1,
      });
      const benchmarkId = d._id || id;
      if (benchmarkId) {
        const returnsRes: any = await axiosApi.get(`/${role}/mf/benchmark-returns/${benchmarkId}`);
        const latest = Array.isArray(returnsRes?.data) ? returnsRes.data[0] : null;
        if (latest) {
          setReturnsForm({
            date: latest.date ? new Date(latest.date) : null,
            return_1d: latest.return_1d?.toString?.() || "",
            return_1w: latest.return_1w?.toString?.() || "",
            return_1m: latest.return_1m?.toString?.() || "",
            return_3m: latest.return_3m?.toString?.() || "",
            return_6m: latest.return_6m?.toString?.() || "",
            return_ytd: latest.return_ytd?.toString?.() || "",
            return_1y: latest.return_1y?.toString?.() || "",
            return_3y: latest.return_3y?.toString?.() || "",
            return_5y: latest.return_5y?.toString?.() || "",
            return_10y: latest.return_10y?.toString?.() || "",
            return_since_inception: latest.return_since_inception?.toString?.() || "",
            annual: Object.fromEntries(
              ANNUAL_YEARS.map((year) => [year, latest?.annual?.[year]?.toString?.() || ""]),
            ) as Record<string, string>,
          });
        }
      }
    })();
  }, [getOne, id]);

  const onCategoryChange = (categoryId: string) => {
    const selected = categories.find((item) => item._id === categoryId);
    setForm((prev) => ({
      ...prev,
      category: selected?.name || "",
      category_id: selected?._id || "",
      main_category_id: selected?.main_category_id?._id || "",
      type: selected?.main_category_id?.name || prev.type || "index",
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Benchmark name is required";
    if (form.name.trim().length > 200)
      next.name = "Benchmark name must be under 200 characters";
    if (form.category.trim().length > 120)
      next.category = "Category must be under 120 characters";
    if (form.type.trim().length > 50)
      next.type = "Type must be under 50 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) scrollToFirstError(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        category_id: form.category_id || null,
        main_category_id: form.main_category_id || null,
        type: form.type.trim() || "index",
        is_active: form.is_active,
      };
      const response: any = id ? await updateRecord(id, payload) : await createRecord(payload);
      const benchmarkId = response?.data?._id || id;
      const hasReturnValues = [
        returnsForm.return_1d,
        returnsForm.return_1w,
        returnsForm.return_1m,
        returnsForm.return_3m,
        returnsForm.return_6m,
        returnsForm.return_ytd,
        returnsForm.return_1y,
        returnsForm.return_3y,
        returnsForm.return_5y,
        returnsForm.return_10y,
        returnsForm.return_since_inception,
        ...ANNUAL_YEARS.map((year) => returnsForm.annual[year]),
      ].some((value) => String(value || "").trim() !== "");
      if (benchmarkId && returnsForm.date && hasReturnValues) {
        await axiosApi.create(`/${role}/mf/benchmark-returns/create`, {
          benchmark_id: benchmarkId,
          date: `${returnsForm.date.getFullYear()}-${String(returnsForm.date.getMonth() + 1).padStart(2, "0")}-${String(returnsForm.date.getDate()).padStart(2, "0")}`,
          return_1d: returnsForm.return_1d === "" ? null : Number(returnsForm.return_1d),
          return_1w: returnsForm.return_1w === "" ? null : Number(returnsForm.return_1w),
          return_1m: returnsForm.return_1m === "" ? null : Number(returnsForm.return_1m),
          return_3m: returnsForm.return_3m === "" ? null : Number(returnsForm.return_3m),
          return_6m: returnsForm.return_6m === "" ? null : Number(returnsForm.return_6m),
          return_ytd: returnsForm.return_ytd === "" ? null : Number(returnsForm.return_ytd),
          return_1y: returnsForm.return_1y === "" ? null : Number(returnsForm.return_1y),
          return_3y: returnsForm.return_3y === "" ? null : Number(returnsForm.return_3y),
          return_5y: returnsForm.return_5y === "" ? null : Number(returnsForm.return_5y),
          return_10y: returnsForm.return_10y === "" ? null : Number(returnsForm.return_10y),
          return_since_inception:
            returnsForm.return_since_inception === "" ? null : Number(returnsForm.return_since_inception),
          annual: Object.fromEntries(
            ANNUAL_YEARS.map((year) => [year, returnsForm.annual[year] === "" ? null : Number(returnsForm.annual[year])]),
          ),
        });
      }
      navigate(`/${role}/benchmark/master`);
    } catch (error: any) {
      const next: Record<string, string> = {};
      const message = getApiMessage(error);
      if (isDuplicateEntryMessage(message)) {
        next.name = toDuplicateFieldMessage(message, "Benchmark name");
      }
      if (Object.keys(next).length > 0) {
        setErrors(next);
        scrollToFirstError(next);
      } else {
        toast.error(message || "Failed to save benchmark");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} Benchmark`}
        onBack={() => navigate(`/${role}/benchmark/master`)}
      />
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Name</label>
            <input
              className={`${mfInputClass} ${errors.name ? "!border-red-500 focus:!border-red-500" : ""}`}
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            {errors.name ? (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            ) : null}
          </div>
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Category
            </label>
            <select
              className={`${mfInputClass} ${errors.category ? "!border-red-500 focus:!border-red-500" : ""}`}
              value={
                categories.find((item) => item.name === form.category)?._id ||
                ""
              }
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category ? (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            ) : null}
          </div>
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Type</label>
            <input
              className={`${mfInputClass} ${errors.type ? "!border-red-500 focus:!border-red-500" : ""}`}
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value }))
              }
            />
            {errors.type ? (
              <p className="text-red-500 text-sm mt-1">{errors.type}</p>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-3 text-gray-700 font-medium">
          <input
            className={mfCheckboxClass}
            type="checkbox"
            checked={form.is_active === 1}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                is_active: event.target.checked ? 1 : 0,
              }))
            }
          />
          Active
        </label>
        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Benchmark Returns</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative">
              <DatePicker
                selected={returnsForm.date}
                onChange={(date) => setReturnsForm((prev) => ({ ...prev, date: date as Date | null }))}
                dateFormat="dd/MM/yyyy"
                className={`${mfInputClass} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {[
              "return_1d","return_1w","return_1m","return_3m","return_6m","return_ytd",
              "return_1y","return_3y","return_5y","return_10y","return_since_inception",
            ].map((key) => (
              <input
                key={key}
                className={mfInputClass}
                placeholder={key.replace("return_", "").toUpperCase().replace("_", " ")}
                value={(returnsForm as any)[key]}
                onChange={(event) =>
                  setReturnsForm((prev) => ({ ...prev, [key]: event.target.value }))
                }
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {ANNUAL_YEARS.map((year) => (
              <input
                key={year}
                className={mfInputClass}
                placeholder={`Annual ${year}`}
                value={returnsForm.annual[year]}
                onChange={(event) =>
                  setReturnsForm((prev) => ({
                    ...prev,
                    annual: { ...prev.annual, [year]: event.target.value },
                  }))
                }
              />
            ))}
          </div>
        </div>
        <MFFormActions
          onReset={() =>
            setForm({
              name: "",
              category: "",
              category_id: "",
              main_category_id: "",
              type: "",
              is_active: 1,
            })
          }
          isSubmitting={saving}
          submitLabel={id ? "Update" : "Save"}
        />
      </form>
    </MFFormContainer>
  );
}
