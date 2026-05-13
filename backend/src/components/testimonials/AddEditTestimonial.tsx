import { useEffect, useMemo, useRef, useState } from "react";
import { FiImage, FiSave, FiUpload, FiX } from "react-icons/fi";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { axiosInstance } from "../../api/axios";
import { RichTextField } from "../PagesComponent/RichTextField";
import ComponentCard from "../common/ComponentCard";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";

export type TestimonialPayload = {
  image: string;
  name: string;
  designation: string;
  description: string;
  rating: number;
  order: number;
  isActive: boolean;
};

type Props = {
  initial?: Partial<TestimonialPayload> & { _id?: string };
  loading?: boolean;
  onSubmit: (payload: TestimonialPayload) => Promise<void> | void;
};

const defaultPayload: TestimonialPayload = {
  image: "",
  name: "",
  designation: "",
  description: "",
  rating: 5,
  order: 0,
  isActive: true,
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function AddEditTestimonial({ initial, loading = false, onSubmit }: Props) {
  const [form, setForm] = useState<TestimonialPayload>(defaultPayload);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  useEffect(() => {
    if (initial) {
      setForm({
        ...defaultPayload,
        ...initial,
        rating: Number(initial.rating ?? 5),
        order: Number(initial.order ?? 0),
      });
    } else {
      setForm(defaultPayload);
    }
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
  }, [initial]);

  const isEdit = Boolean(initial?._id);

  const resetForm = () => {
    if (initial) {
      setForm({
        ...defaultPayload,
        ...initial,
        rating: Number(initial.rating ?? 5),
        order: Number(initial.order ?? 0),
      });
      setErrors({});
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setForm(defaultPayload);
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
  };

  const previewUrl = useMemo(() => {
    const value = String(form.image || "").trim();
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return value;
  }, [form.image]);

  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Only image files are allowed." }));
      return;
    }

    try {
      setUploading(true);
      setErrors((prev) => ({ ...prev, image: "" }));
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axiosInstance.post("/upload-testimonial", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data?.success || !data?.url) {
        setErrors((prev) => ({ ...prev, image: data?.message || "Image upload failed." }));
        return;
      }

      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, image: err?.response?.data?.message || "Image upload failed." }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.designation.trim()) nextErrors.designation = "Designation is required.";
    if (!stripHtml(form.description || "")) nextErrors.description = "Description is required.";
    if (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5) {
      nextErrors.rating = "Rating must be an integer from 1 to 5.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      scrollToFirstError(nextErrors);
      return;
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        designation: form.designation.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        order: Number(form.order) || 0,
      });
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const mappedErrors: Record<string, string> = {};
        backendErrors.forEach((entry: any) => {
          const key = String(entry?.path || entry?.param || "").trim();
          const msg = String(entry?.msg || "").trim();
          if (key && msg && !mappedErrors[key]) mappedErrors[key] = msg;
        });

        if (Object.keys(mappedErrors).length > 0) {
          setErrors(mappedErrors);
          scrollToFirstError(mappedErrors);
          return;
        }
      }

      if (err?.response?.data?.message) {
        setErrors({ name: String(err.response.data.message) });
      }
    }
  };

  const openFilePicker = () => {
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  };

  return (
    <ComponentCard
      title={isEdit ? "Edit Testimonial" : "Add Testimonial"}
      desc="Manage client feedback, profile image, rating, and display priority."
      className="shadow-lg"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2" data-field="image">
            <label className="mb-2 block text-sm font-medium text-gray-700">Profile Image</label>

            {!previewUrl ? (
              <button
                type="button"
                onClick={openFilePicker}
                className={`flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-gray-600 transition hover:border-brand-500 hover:text-brand-500 ${
                  errors.image ? "border-red-500" : "border-gray-300"
                }`}
              >
                <FiImage size={26} />
                <span className="text-sm font-medium">Upload testimonial profile image</span>
                <span className="text-xs text-gray-500">JPG, PNG, WEBP up to 5MB</span>
              </button>
            ) : (
              <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <img src={previewUrl} alt="Testimonial" className="h-14 w-14 rounded-full object-cover" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" startIcon={<FiUpload />} onClick={openFilePicker}>
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    startIcon={<FiX />}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, image: "" }));
                      setErrors((prev) => ({ ...prev, image: "" }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
            />
            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
            <Input
              id="name"
              name="name"
              value={form.name}
              error={Boolean(errors.name)}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Rohit Sharma"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Designation</label>
            <Input
              id="designation"
              name="designation"
              value={form.designation}
              error={Boolean(errors.designation)}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, designation: e.target.value }));
                setErrors((prev) => ({ ...prev, designation: "" }));
              }}
              placeholder="Retail Investor"
            />
            {errors.designation && <p className="mt-1 text-sm text-red-600">{errors.designation}</p>}
          </div>

          <div className="md:col-span-2" data-field="description">
            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <RichTextField
              value={form.description}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, description: value }));
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Display Order</label>
            <Input
              id="order"
              name="order"
              type="number"
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
              min={0}
            />
          </div>

          <div data-field="rating">
            <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${errors.rating ? "border-red-500" : "border-gray-300"}`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, rating: star }));
                    setErrors((prev) => ({ ...prev, rating: "" }));
                  }}
                  className={`text-lg ${form.rating >= star ? "text-[#043f79]" : "text-gray-300"}`}
                  aria-label={`Set rating ${star}`}
                >
                  {"\u2605"}
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">{form.rating}/5</span>
            </div>
            {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <input id="testimonial-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="h-4 w-4" />
            <label htmlFor="testimonial-active" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-300 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md hover:bg-[#0654a4] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave />
            {loading || uploading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
