import React, { useState, useEffect, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiSave,
  FiRefreshCw,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { RichTextField } from "../components/PagesComponent/RichTextField";

interface Section {
  title: string;
  content: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface CmsPageForm {
  title: string;
  slug: string;
  sections: Section[];
  faqs: FAQ[];
  status: "draft" | "published" | "archived";
  is_active?: number;
  page_code?: string;
}

type CmsListKey = "sections" | "faqs";
type CmsListItem<K extends CmsListKey> = CmsPageForm[K][number];

const extractCmsPage = (payload: unknown): Partial<CmsPageForm> | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;

  if ("page" in record && record.page && typeof record.page === "object") {
    return record.page as Partial<CmsPageForm>;
  }

  if ("data" in record && record.data && typeof record.data === "object") {
    const dataRecord = record.data as Record<string, unknown>;
    if (
      "page" in dataRecord &&
      dataRecord.page &&
      typeof dataRecord.page === "object"
    ) {
      return dataRecord.page as Partial<CmsPageForm>;
    }
    return record.data as Partial<CmsPageForm>;
  }

  return payload as Partial<CmsPageForm>;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
};

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export default function AddCmsPage() {
  const { role, id } = useParams<{ role?: string; id?: string }>();
  const navigate = useNavigate();

  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "cmspages",
  });

  const [values, setValues] = useState<CmsPageForm>({
    title: "",
    slug: "",
    sections: [],
    faqs: [],
    status: "draft",
    is_active: 1,
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formRef, scrollToFirstError } = useScrollToFirstError();
  const inputClass =
    "w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-200";
  const labelClass = "block mb-2 text-sm font-medium text-gray-700";

  useEffect(() => {
    if (!id) return;

    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = (await getOne(id)) as unknown;
        const page = extractCmsPage(res);

        if (!page || typeof page !== "object") {
          toast.error("CMS page not found");
          navigate(`/${role || "admin"}/cmspages`);
          return;
        }

        setValues({
          title: page.title || "",
          slug: page.slug || "",
          sections: Array.isArray(page.sections) ? page.sections : [],
          faqs: Array.isArray(page.faqs) ? page.faqs : [],
          status: page.status || "draft",
          is_active: page.is_active ?? 1,
          page_code: page.page_code,
        });
      } catch {
        toast.error("Failed to fetch CMS page");
        navigate(`/${role || "admin"}/cmspages`);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id, navigate, getOne, role]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setValues((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "title" && !slugEdited) updated.slug = generateSlug(value);
      if (name === "slug") setSlugEdited(true);
      return updated;
    });

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addItem = <K extends CmsListKey>(key: K, item: CmsListItem<K>) =>
    setValues((prev) => ({ ...prev, [key]: [...prev[key], item] }));

  const removeItem = <K extends CmsListKey>(key: K, index: number) =>
    setValues((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

  const handleSectionChange = (
    index: number,
    field: keyof Section,
    value: string,
  ) =>
    setValues((prev) => {
      const arr = [...prev.sections];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, sections: arr };
    });

  const handleFAQChange = (index: number, field: keyof FAQ, value: string) =>
    setValues((prev) => {
      const arr = [...prev.faqs];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, faqs: arr };
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!values.title.trim()) newErrors.title = "Title required";
    if (!values.slug.trim()) newErrors.slug = "Slug required";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      scrollToFirstError(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      // Backend expects sections and faqs as JSON strings
      const jsonPayload = {
        title: values.title,
        slug: values.slug,
        status: values.status,
        is_active: values.is_active,
        ...(values.page_code && { page_code: values.page_code }),
        ...(values.sections &&
          values.sections.length > 0 && {
            sections: JSON.stringify(values.sections),
          }),
        ...(values.faqs &&
          values.faqs.length > 0 && {
            faqs: JSON.stringify(values.faqs),
          }),
      };

      if (id) await updateRecord(id, jsonPayload);
      else await createRecord(jsonPayload);
      navigate(`/${role || "admin"}/cmspages`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save CMS page"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues({
      title: "",
      slug: "",
      sections: [],
      faqs: [],
      status: "draft",
      is_active: 1,
    });
    setErrors({});
    setSlugEdited(false);
  };

  if (loading) return <div className="p-6">Loading page...</div>;

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit CMS Page" : "Add New CMS Page"}
        </h2>

        <button
          type="button"
          onClick={() => navigate(`/${role || "admin"}/cmspages`)}
          className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        {/* TITLE & SLUG */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Title</label>
            <input
              name="title"
              value={values.title}
              onChange={handleChange}
              className={`${inputClass} ${errors.title ? "border-red-500" : ""}`}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClass}>Slug</label>
            <input
              name="slug"
              value={values.slug}
              onChange={handleChange}
              className={`${inputClass} ${errors.slug ? "border-red-500" : ""}`}
            />
            {errors.slug && <p className="text-red-600 text-sm mt-1">{errors.slug}</p>}
          </div>
        </div>

        {/* SECTIONS */}
        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-[#043f79]">Sections</h3>
            <button
              type="button"
              onClick={() => addItem("sections", { title: "", content: "" })}
              className="bg-[#043f79] text-white px-3 h-10 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Add Section
            </button>
          </div>

          {values.sections.map((section, i) => (
            <div
              key={i}
              className="p-4 mb-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
            >
              <input
                placeholder="Section Title"
                value={section.title}
                onChange={(e) =>
                  handleSectionChange(i, "title", e.target.value)
                }
                className={inputClass}
              />

              <div className="rounded-lg overflow-hidden border">
                <RichTextField
                  value={section.content}
                  onChange={(val) => handleSectionChange(i, "content", val)}
                />
              </div>

              <button
                type="button"
                onClick={() => removeItem("sections", i)}
                className="text-red-600 mt-3 flex items-center gap-1 text-sm hover:text-red-700"
              >
                <FiTrash2 size={16} /> Remove Section
              </button>
            </div>
          ))}
        </div>

        {/* FAQS */}
        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-[#043f79]">FAQs</h3>
            <button
              type="button"
              onClick={() => addItem("faqs", { question: "", answer: "" })}
              className="bg-[#043f79] text-white px-3 h-10 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Add FAQ
            </button>
          </div>

          {values.faqs.map((faq, i) => (
            <div key={i} className="p-3 mb-3 bg-gray-50 border rounded-md">
              <input
                placeholder="Question"
                value={faq.question}
                onChange={(e) => handleFAQChange(i, "question", e.target.value)}
                className={inputClass}
              />

              <RichTextField
                value={faq.answer}
                onChange={(val) => handleFAQChange(i, "answer", val)}
                height={250}
              />

              <button
                type="button"
                onClick={() => removeItem("faqs", i)}
                className="text-red-600 mt-3 flex items-center gap-1 text-sm"
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          ))}
        </div>

        {/* STATUS */}
        <div className="md:w-1/2">
          <label className={labelClass}>Status</label>
          <select
            name="status"
            value={values.status}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-200 text-gray-700 px-5 h-11 rounded-lg flex items-center gap-2"
          >
            <FiRefreshCw /> Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#043f79] text-white px-6 h-11 rounded-lg flex items-center gap-2"
          >
            <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
