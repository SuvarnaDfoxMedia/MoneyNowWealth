import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
} from "./MFFormShared";
import { RichTextField } from "../PagesComponent/RichTextField";

export default function AddMFMainCategory() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/main-categories",
    listKey: "data",
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    sort_order: 0,
    is_active: 1,
  });
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        name: d.name || "",
        description: d.description || "",
        sort_order: d.sort_order || 0,
        is_active: d.is_active ?? 1,
      });
    })();
  }, [id]);

  const validate = () => {
    const next: { name?: string; description?: string } = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (form.name.trim().length > 120)
      next.name = "Name must be under 120 characters";
    if (form.description && form.description.length > 5000)
      next.description = "Description must be under 5000 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyApiErrors = (err: any) => {
    const apiErrors = err?.response?.data?.errors;
    if (!Array.isArray(apiErrors)) return false;
    const next: { name?: string; description?: string } = {};
    apiErrors.forEach((e: any) => {
      const field = e?.path || e?.param;
      if (field === "name") next.name = e?.msg || "Name is invalid";
      if (field === "description")
        next.description = e?.msg || "Description is invalid";
    });
    setErrors(next);
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (id) await updateRecord(id, form);
      else await createRecord(form);
      navigate(`/${role}/mf/main-categories`);
    } catch (err: any) {
      if (applyApiErrors(err)) return;
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      sort_order: 0,
      is_active: 1,
    });
    setErrors({});
  };

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} MF Main Category`}
        onBack={() => navigate(`/${role}/mf/main-categories`)}
      />
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="main_category_name" className="block mb-2 text-gray-700 font-medium">Name</label>
            <input
              id="main_category_name"
              className={mfInputClass}
              placeholder="Main category name"
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
          <label className="block mb-2 text-gray-700 font-medium">Description</label>
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

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sort_order" className="block mb-2 text-gray-700 font-medium">Sort Order</label>
            <input
              id="sort_order"
              className={mfInputClass}
              type="number"
              placeholder="0"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
        </div> */}

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
