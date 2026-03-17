"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiRefreshCw, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import { axiosApi } from "../api/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ================= TYPES ================= */

interface TopicForm {
  cluster_id: string;
  title: string;
  slug: string;
  keywords: string;
  summary: string;
  status: "draft" | "published" | "archived";
  author: string;
  read_time_minutes: number;
  tags: string;
  is_active: number;
  publish_date: Date | null;
  access_type: "free" | "premium";
}

type Errors = Partial<Record<keyof TopicForm, string>>;

interface ClusterOption {
  _id: string;
  title: string;
}

interface TopicDetail {
  cluster_id: string | { _id: string };
  title?: string;
  slug?: string;
  keywords?: string[];
  summary?: string;
  status?: "draft" | "published" | "archived";
  author?: string;
  read_time_minutes?: number;
  tags?: string[];
  is_active?: number;
  publish_date?: string;
  access_type?: "free" | "premium";
}

const extractTopic = (payload: unknown): TopicDetail | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  if ("topic" in record && record.topic && typeof record.topic === "object") {
    return record.topic as TopicDetail;
  }
  if ("data" in record && record.data && typeof record.data === "object") {
    const dataRecord = record.data as Record<string, unknown>;
    if (
      "topic" in dataRecord &&
      dataRecord.topic &&
      typeof dataRecord.topic === "object"
    ) {
      return dataRecord.topic as TopicDetail;
    }
  }
  return undefined;
};

const extractClusters = (payload: unknown): ClusterOption[] => {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  const candidates = [
    record.data,
    record.clusters,
    (record.data as Record<string, unknown> | undefined)?.clusters,
    (record.data as Record<string, unknown> | undefined)?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as ClusterOption[];
    }
  }

  return [];
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

/* ================= COMPONENT ================= */

export default function AddTopic() {
  const { id, role } = useParams<{ id?: string; role?: string }>();
  const navigate = useNavigate();

  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role: role || "admin",
    module: "topic",
  });

  /* ================= STATE ================= */

  const [values, setValues] = useState<TopicForm>({
    cluster_id: "",
    title: "",
    slug: "",
    keywords: "",
    summary: "",
    status: "draft",
    author: "",
    read_time_minutes: 0,
    tags: "",
    is_active: 0,
    publish_date: null,
    access_type: "free",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [clusters, setClusters] = useState<ClusterOption[]>([]);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass =
    "w-full h-11 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-200";
  const labelClass = "block mb-2 text-sm font-medium text-gray-700";

  /* ================= EFFECTS ================= */

  // Load clusters
  useEffect(() => {
    const currentRole = role || "admin";
    axiosApi
      .get(`/${currentRole}/cluster`, { limit: 1000, page: 1 })
      .then((res) => setClusters(extractClusters(res)))
      .catch(() => toast.error("Failed to load clusters"));
  }, [role]);

  // Load topic for edit
  useEffect(() => {
    if (!id) return;

    (async () => {
      const res = (await getOne(id)) as unknown;
      const topic = extractTopic(res);
      if (!topic) return;

      setValues({
        cluster_id:
          topic.cluster_id &&
          typeof topic.cluster_id === "object" &&
          "_id" in topic.cluster_id
            ? topic.cluster_id._id
            : (topic.cluster_id as string) || "",
        title: topic.title || "",
        slug: topic.slug || "",
        keywords: topic.keywords?.join(", ") || "",
        summary: topic.summary || "",
        status: topic.status || "draft",
        author: topic.author || "",
        read_time_minutes: topic.read_time_minutes || 0,
        tags: topic.tags?.join(", ") || "",
        is_active: topic.is_active ?? 0,
        publish_date: topic.publish_date
          ? new Date(topic.publish_date)
          : null,
        access_type: topic.access_type || "free",
      });

      setSlugEdited(false); // IMPORTANT
    })();
  }, [id, getOne]);

  /* ================= HELPERS ================= */

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setValues((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "title" && !slugEdited) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });

    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "slug") setSlugEdited(true);
  };

  /* ================= VALIDATION ================= */

  const validate = () => {
    const e: Errors = {};

    if (!values.cluster_id) e.cluster_id = "Cluster is required";
    if (!values.title.trim()) e.title = "Title is required";
    if (!values.slug.trim()) e.slug = "Slug is required";
    if (!/^[a-z0-9-]+$/.test(values.slug))
      e.slug = "Slug must be lowercase and hyphen only";
    if (values.read_time_minutes < 0)
      e.read_time_minutes = "Read time cannot be negative";
    if (values.status === "published" && !values.publish_date)
      e.publish_date = "Publish date required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT (JSON ONLY) ================= */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        keywords: values.keywords
          ? values.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        publish_date: values.publish_date
          ? values.publish_date.toISOString()
          : null,
      };

      if (id) {
        await updateRecord(id, payload);
      } else {
        await createRecord(payload);
      }

      toast.success(
        id ? "Topic updated successfully" : "Topic created successfully",
      );
      navigate(`/${role || "admin"}/topic`);
      // setPage(1);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= RESET ================= */

  const handleReset = () => {
    setValues({
      cluster_id: "",
      title: "",
      slug: "",
      keywords: "",
      summary: "",
      status: "draft",
      author: "",
      read_time_minutes: 0,
      tags: "",
      is_active: 0,
      publish_date: null,
      access_type: "free",
    });
    setErrors({});
    setSlugEdited(false);
  };

  /* ================= UI HELPERS ================= */

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  /* ================= JSX ================= */

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit Topic" : "Add Topic"}
        </h2>
        <button
          onClick={() => navigate(`/${role || "admin"}/topic`)}
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cluster */}
        <div>
          <label className={labelClass}>Cluster</label>
          <select
            name="cluster_id"
            value={values.cluster_id}
            onChange={handleInputChange}
            className={inputClass}
          >
            <option value="">Select Cluster</option>
            {clusters.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          {error(errors.cluster_id)}
        </div>

        {/* Title + Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Title</label>
            <input
              name="title"
              value={values.title}
              onChange={handleInputChange}
              className={inputClass}
            />
            {error(errors.title)}
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input
              name="slug"
              value={values.slug}
              onChange={handleInputChange}
              className={inputClass}
            />
            {error(errors.slug)}
          </div>
        </div>

        {/* Access Type */}
        <div>
          <label className={labelClass}>Topic Type</label>
          <select
            name="access_type"
            value={values.access_type}
            onChange={handleInputChange}
            className={inputClass}
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Summary */}
        <div>
          <label className={labelClass}>Summary</label>
          <textarea
            name="summary"
            value={values.summary}
            onChange={handleInputChange}
            className="w-full min-h-28 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows={3}
          />
        </div>

        {/* Keywords + Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Keywords</label>
            <input
              name="keywords"
              value={values.keywords}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input
              name="tags"
              value={values.tags}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Author + Read Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Author</label>
            <input
              name="author"
              value={values.author}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Read Time (minutes)
            </label>
            <input
              type="number"
              name="read_time_minutes"
              value={values.read_time_minutes}
              onChange={handleInputChange}
              className={inputClass}
            />
            {error(errors.read_time_minutes)}
          </div>
        </div>

        {/* Status + Publish Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              value={values.status}
              onChange={handleInputChange}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Publish Date</label>
            <div className="relative">
              <DatePicker
                selected={values.publish_date}
                onChange={(d) => setValues((p) => ({ ...p, publish_date: d }))}
                dateFormat="dd/MM/yyyy"
                className={`${inputClass} pr-10`}
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.publish_date)}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-200 px-5 h-11 rounded-lg"
          >
            <FiRefreshCw /> Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 h-11 rounded-lg"
          >
            <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

