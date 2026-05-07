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
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
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
