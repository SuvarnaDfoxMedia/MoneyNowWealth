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
import { getApiMessage, isDuplicateEntryMessage, toDuplicateFieldMessage } from "./mfValidation";

export default function AddMFAmc() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/amcs",
    listKey: "data",
  });

  const [form, setForm] = useState({
    name: "",
    is_active: 1,
  });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [saving, setSaving] = useState(false);
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        name: d.name || "",
        is_active: d.is_active ?? 1,
      });
    })();
  }, [getOne, id]);

  const validate = () => {
    const next: { name?: string } = {};
    if (!form.name.trim()) next.name = "AMC name is required";
    if (form.name.trim().length > 120)
      next.name = "AMC name must be under 120 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) scrollToFirstError(next);
    return Object.keys(next).length === 0;
  };

  const applyApiErrors = (err: any) => {
    const apiErrors = err?.response?.data?.errors;
    const next: { name?: string } = {};

    if (Array.isArray(apiErrors)) {
      apiErrors.forEach((e: any) => {
        const field = e?.path || e?.param;
        if (field === "name") next.name = e?.msg || "AMC name is invalid";
      });
    }

    const message = getApiMessage(err);
    if (!next.name && isDuplicateEntryMessage(message)) {
      next.name = toDuplicateFieldMessage(message, "AMC name");
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
    try {
      const payload = { ...form, name: form.name.trim() };
      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role}/mf/amcs`);
    } catch (err: any) {
      if (applyApiErrors(err)) return;
      toast.error(getApiMessage(err) || "Failed to save AMC");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      is_active: 1,
    });
    setErrors({});
  };

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} AMC`}
        onBack={() => navigate(`/${role}/mf/amcs`)}
      />
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="amc_name" className="block mb-2 text-gray-700 font-medium">AMC Name</label>
            <input
              id="amc_name"
              className={`${mfInputClass} ${errors.name ? "!border-red-500 focus:!border-red-500" : ""}`}
              placeholder="AMC name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
            />
            {error(errors.name)}
          </div>
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
