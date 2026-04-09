import React, { ChangeEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";

interface SeoFormValues {
  page_url: string;
  seo_title: string;
  meta_description: string;
  keywords: string;
  page_schema: string;
  og_tag: string;
  status: "draft" | "published" | "archived";
  is_active: number;
}

const defaultValues: SeoFormValues = {
  page_url: "",
  seo_title: "",
  meta_description: "",
  keywords: "",
  page_schema: "",
  og_tag: "",
  status: "published",
  is_active: 1,
};

const extractSeoEntry = (
  payload: unknown,
): Partial<SeoFormValues> | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;

  if ("seo" in record && record.seo && typeof record.seo === "object") {
    return record.seo as Partial<SeoFormValues>;
  }

  if ("data" in record && record.data && typeof record.data === "object") {
    const dataRecord = record.data as Record<string, unknown>;
    if (
      "seo" in dataRecord &&
      dataRecord.seo &&
      typeof dataRecord.seo === "object"
    ) {
      return dataRecord.seo as Partial<SeoFormValues>;
    }
    return record.data as Partial<SeoFormValues>;
  }

  return payload as Partial<SeoFormValues>;
};

export default function AddSeo() {
  const { role, id } = useParams<{ role?: string; id?: string }>();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "seo",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const [values, setValues] = useState<SeoFormValues>(defaultValues);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass =
    "w-full h-11 rounded-md border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1ca3b8]/20";
  const textAreaClass =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1ca3b8]/20";
  const labelClass = "block pt-3 text-sm text-gray-600";

  useEffect(() => {
    if (!id) return;

    const fetchSeo = async () => {
      setLoading(true);
      try {
        const res = await getOne(id);
        const entry = extractSeoEntry(res);
        if (!entry) {
          toast.error("SEO entry not found");
          navigate(`/${role || "admin"}/seo`);
          return;
        }

        setValues({
          ...defaultValues,
          ...entry,
          status: (entry.status as SeoFormValues["status"]) || "published",
          is_active: entry.is_active ?? 1,
        });
      } catch {
        toast.error("Failed to fetch SEO entry");
        navigate(`/${role || "admin"}/seo`);
      } finally {
        setLoading(false);
      }
    };

    fetchSeo();
  }, [getOne, id, navigate, role]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === "is_active" ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!values.page_url.trim()) nextErrors.page_url = "Page url is required";
    if (!values.seo_title.trim()) nextErrors.seo_title = "SEO title is required";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      scrollToFirstError(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        page_url: values.page_url.trim(),
      };

      if (id) await updateRecord(id, payload);
      else await createRecord(payload);
      navigate(`/${role || "admin"}/seo`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save SEO entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(defaultValues);
    setErrors({});
  };

  if (loading) return <div className="p-6">Loading SEO entry...</div>;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit SEO Details" : "Add SEO Details"}
        </h2>

        <button
          type="button"
          onClick={() => navigate(`/${role || "admin"}/seo`)}
          className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={labelClass}>Page Url</label>
          <div>
            <input
              name="page_url"
              value={values.page_url}
              onChange={handleChange}
              className={`${inputClass} ${errors.page_url ? "border-red-500" : ""}`}
              placeholder="Enter page url"
            />
            {errors.page_url && (
              <p className="mt-1 text-sm text-red-600">{errors.page_url}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={labelClass}>SEO Title</label>
          <div>
            <input
              name="seo_title"
              value={values.seo_title}
              onChange={handleChange}
              className={`${inputClass} ${errors.seo_title ? "border-red-500" : ""}`}
              placeholder="Please enter seo title"
            />
            {errors.seo_title && (
              <p className="mt-1 text-sm text-red-600">{errors.seo_title}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={labelClass}>Meta Description</label>
          <textarea
            name="meta_description"
            value={values.meta_description}
            onChange={handleChange}
            rows={3}
            className={textAreaClass}
            placeholder="Please enter meta description"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={labelClass}>Keywords</label>
          <textarea
            name="keywords"
            value={values.keywords}
            onChange={handleChange}
            rows={3}
            className={textAreaClass}
            placeholder="Please enter SEO keyword"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={labelClass}>Page Schema</label>
          <textarea
            name="page_schema"
            value={values.page_schema}
            onChange={handleChange}
            rows={3}
            className={textAreaClass}
            placeholder="Please enter page schema"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={labelClass}>OG Tag</label>
          <textarea
            name="og_tag"
            value={values.og_tag}
            onChange={handleChange}
            rows={3}
            className={textAreaClass}
            placeholder="Please enter OG Tag"
          />
        </div>

        <div className="hidden">
          <select name="status" value={values.status} onChange={handleChange}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            name="is_active"
            value={String(values.is_active)}
            onChange={handleChange}
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="flex justify-start gap-3 border-t border-gray-100 pt-6 md:pl-[180px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 h-11 rounded-lg hover:bg-[#0654a4] transition"
          >
            <FiSave /> {isSubmitting ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-200 text-gray-700 px-5 h-11 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition"
          >
            <FiRefreshCw /> Reset
          </button>
        </div>
      </form>
    </div>
  );
}
