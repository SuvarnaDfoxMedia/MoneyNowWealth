"use client";

import React, { useEffect, useState, ChangeEvent, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiSave,
  FiRefreshCw,
  FiArrowLeft,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";

interface ClusterForm {
  title: string;
  slug: string;
  description: string;
  sort_order: number;
  status: string;
  is_active: number;
  thumbnail?: string;
}

interface ClusterResponse {
  data?: { cluster?: Partial<ClusterForm> };
  cluster?: Partial<ClusterForm>;
}

const API_ORIGIN =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace("/api", "") ||
  "";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
};

export default function AddCluster() {
  const { id, role } = useParams<{ id?: string; role?: string }>();
  const navigate = useNavigate();

  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role: role || "admin",
    module: "cluster",
  });

  const [values, setValues] = useState<ClusterForm>({
    title: "",
    slug: "",
    description: "",
    sort_order: 0,
    status: "draft",
    is_active: 1,
    thumbnail: "",
  });

  const [originalValues, setOriginalValues] = useState<ClusterForm>(values);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-200";
  const labelClass = "block mb-2 text-sm font-medium text-gray-700";

  // Helper to generate slug
  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  // Fetch cluster for editing
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = (await getOne(id)) as ClusterResponse;
        const cluster = (res?.data?.cluster ||
          res?.cluster ||
          {}) as Partial<ClusterForm>;

        if (!cluster) return;

        const thumb = cluster.thumbnail || "";
        const fullUrl = thumb
          ? `${API_ORIGIN}/uploads/thumbnail/${thumb}`
          : null;

        const clusterValues: ClusterForm = {
          title: cluster.title || "",
          slug: cluster.slug || generateSlug(cluster.title || ""),
          description: cluster.description || "",
          sort_order: cluster.sort_order || 0,
          status: cluster.status || "draft",
          is_active: cluster.is_active ?? 1,
          thumbnail: thumb,
        };

        setValues(clusterValues);
        setOriginalValues(clusterValues);

        if (fullUrl) setPreview(fullUrl);
      } catch (error) {
        console.error("Error fetching cluster:", error);
        toast.error("Failed to fetch cluster data");
      }
    })();
  }, [id, getOne]);

  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setThumbnailRemoved(false); // reset removal flag if a new file is selected
      setErrors((prev) => ({ ...prev, thumbnail: "" }));
    }
  };

  // Handle input/select/checkbox
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    if (type === "checkbox") {
      const checked = target.checked ? 1 : 0;
      setValues((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setValues((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "title" && !slugEdited) {
        updated.slug = generateSlug(value); // auto-generate slug
      }
      return updated;
    });

    if (name === "slug") setSlugEdited(true);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!values.title.trim()) newErrors.title = "Title is required";
    if (!values.slug.trim()) newErrors.slug = "Slug is required";
    if (!values.description.trim())
      newErrors.description = "Description is required";
    if (!file && !values.thumbnail && !thumbnailRemoved)
      newErrors.thumbnail = "Thumbnail is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.title && titleRef.current) titleRef.current.focus();
      else if (newErrors.slug && slugRef.current) slugRef.current.focus();
      else if (newErrors.description && descriptionRef.current)
        descriptionRef.current.focus();
      else if (newErrors.thumbnail && thumbnailRef.current)
        thumbnailRef.current.click();
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append all fields except thumbnail
      Object.entries(values).forEach(([key, value]) => {
        if (key === "thumbnail") return;
        formData.append(key, String(value ?? ""));
      });

      // Handle thumbnail properly
      if (file) {
        formData.append("thumbnail", file); // new file
      } else if (id && thumbnailRemoved) {
        formData.append("thumbnail", ""); // delete thumbnail
      } else if (id) {
        formData.append("thumbnail", values.thumbnail || ""); // keep old thumbnail
      }

      if (id) {
        await updateRecord(id, formData);
        toast.success("Cluster updated successfully");
      } else {
        await createRecord(formData);
        toast.success("Cluster created successfully");
      }

      navigate(`/${role || "admin"}/cluster`);
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to save cluster"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (id) {
      setValues(originalValues);
      setPreview(
        originalValues.thumbnail
          ? `${API_ORIGIN}/uploads/thumbnail/${originalValues.thumbnail}`
          : null,
      );
    } else {
      setValues({
        title: "",
        slug: "",
        description: "",
        sort_order: 0,
        status: "draft",
        is_active: 1,
        thumbnail: "",
      });
      setPreview(null);
    }
    setFile(null);
    setThumbnailRemoved(false);
    setErrors({});
    setSlugEdited(false);
  };

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit Cluster" : "Add Cluster"}
        </h2>
        <button
          onClick={() => navigate(`/${role || "admin"}/cluster`)}
          className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title + Slug */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              ref={titleRef}
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange}
              placeholder="Enter cluster title"
              className={`${inputClass} ${
                errors.title ? "border-red-500" : ""
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}

            <label className={`${labelClass} mt-4`}>Slug</label>
            <input
              ref={slugRef}
              type="text"
              name="slug"
              value={values.slug}
              onChange={handleChange}
              placeholder="Auto-generated from title"
              className={`${inputClass} ${errors.slug ? "border-red-500" : ""}`}
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className={labelClass}>Thumbnail</label>
            <label className="flex h-11 border border-gray-300 rounded-lg px-4 text-gray-600 cursor-pointer items-center justify-center gap-2 hover:bg-gray-50 transition">
              <FiUpload className="text-gray-500" />
              <span>Upload Image</span>
              <input
                ref={thumbnailRef}
                type="file"
                name="thumbnail"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {errors.thumbnail && (
              <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>
            )}

            <div className="relative w-[100px] h-[100px] border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center mt-3 bg-gray-50 shadow-sm">
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setFile(null);
                      setValues((prev) => ({ ...prev, thumbnail: "" }));
                      setThumbnailRemoved(true);
                      setErrors((prev) => ({ ...prev, thumbnail: "" }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX size={14} />
                  </button>
                </>
              ) : (
                <span className="text-gray-400 text-sm text-center">
                  No image selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            ref={descriptionRef}
            name="description"
            value={values.description}
            onChange={handleChange}
            placeholder="Enter cluster description"
            className={`w-full min-h-28 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              errors.description ? "border-red-500" : ""
            }`}
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Status + Sort Order */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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

          <div>
            <label className={labelClass}>Sort Order</label>
            <input
              type="number"
              name="sort_order"
              value={values.sort_order}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Active Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            checked={!!values.is_active}
            onChange={handleChange}
            className="w-5 h-5 accent-blue-600"
          />
          <label className="text-gray-700 font-medium">Active</label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 h-11 rounded-lg hover:bg-gray-300 transition"
          >
            <FiRefreshCw /> Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 h-11 rounded-lg hover:bg-[#0654a4] transition"
          >
            <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
