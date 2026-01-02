




// "use client";

// import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
// import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// import { FiArrowLeft, FiCalendar, FiRefreshCw, FiSave } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import axiosApi from "../api/axios";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useDataTableStore } from "../store/dataTableStore";

// interface TopicForm {
//   cluster_id: string;
//   title: string;
//   slug: string;
//   keywords?: string;
//   summary?: string;
//   status: "draft" | "published" | "archived";
//   author?: string;
//   read_time_minutes?: number;
//   tags?: string;
//   is_active?: number;
//   publish_date?: Date | null;
//   access_type?: "free" | "premium";
// }

// type Errors = Partial<Record<keyof TopicForm, string>>;

// interface ClusterOption {
//   _id: string;
//   title: string;
// }

// export default function AddTopic() {
//   const { id } = useParams<{ id?: string }>();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const page = searchParams.get("page") || "1";
//   const limit = searchParams.get("limit") || "10";

//   const { getOne, createRecord, updateRecord } = useCommonCrud({
//     role: "admin",
//     module: "topic",
//   });

//   const { setPage } = useDataTableStore();

//   const [values, setValues] = useState<TopicForm>({
//     cluster_id: "",
//     title: "",
//     slug: "",
//     keywords: "",
//     summary: "",
//     status: "draft",
//     author: "",
//     read_time_minutes: 0,
//     tags: "",
//     is_active: 0,
//     publish_date: null,
//     access_type: "free",
//   });

//   const [errors, setErrors] = useState<Errors>({});
//   const [clusters, setClusters] = useState<ClusterOption[]>([]);
//   const [slugEdited, setSlugEdited] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Fetch clusters
//   useEffect(() => {
//     axiosApi
//       .get(`/cluster?limit=1000`)
//       .then((res) => setClusters(res.data?.clusters || []))
//       .catch(() => toast.error("Failed to load clusters"));
//   }, []);

//   // Fetch topic for edit
//   useEffect(() => {
//     if (!id) return;

//     getOne(id).then((res: any) => {
//       if (res?.topic) {
//         setValues({
//           ...res.topic,
//           cluster_id:
//             typeof res.topic.cluster_id === "object"
//               ? res.topic.cluster_id._id
//               : res.topic.cluster_id,
//           keywords: res.topic.keywords?.join(", ") || "",
//           tags: res.topic.tags?.join(", ") || "",
//           publish_date: res.topic.publish_date
//             ? new Date(res.topic.publish_date)
//             : null,
//         });
//         if (res.topic.slug) setSlugEdited(true);
//       }
//     });
//   }, [id]);

//   // Slug generator
//   const generateSlug = (text: string) =>
//     text
//       .toLowerCase()
//       .trim()
//       .replace(/[^\w\s-]/g, "")
//       .replace(/\s+/g, "-");

//   // Handle input changes
//   const handleInputChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;

//     setValues((prev) => {
//       const updated = { ...prev, [name]: value };
//       if (name === "title" && !slugEdited) updated.slug = generateSlug(value);
//       return updated;
//     });

//     setErrors((prev) => ({ ...prev, [name]: "" }));
//     if (name === "slug") setSlugEdited(true);
//   };

//   // Validation
//   const validate = () => {
//     const e: Errors = {};
//     if (!values.cluster_id) e.cluster_id = "Cluster is required";
//     if (!values.title?.trim()) e.title = "Title is required";
//     if (!values.slug?.trim()) e.slug = "Slug is required";
//     if (!/^[a-z0-9-]+$/.test(values.slug))
//       e.slug = "Slug must be lowercase and hyphen only";
//     if (values.read_time_minutes! < 0)
//       e.read_time_minutes = "Read time cannot be negative";
//     if (values.status === "published" && !values.publish_date)
//       e.publish_date = "Publish date required";

//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   // Submit
//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setIsSubmitting(true);
//     try {
//       const payload = {
//         ...values,
//         keywords: values.keywords?.split(",").map((k) => k.trim()),
//         tags: values.tags?.split(",").map((t) => t.trim()),
//         publish_date: values.publish_date
//           ? values.publish_date.toISOString()
//           : "",
//       };

//       const formData = new FormData();
//       Object.entries(payload).forEach(([k, v]) =>
//         Array.isArray(v)
//           ? v.forEach((i) => formData.append(`${k}[]`, i))
//           : formData.append(k, v ?? "")
//       );

//       id ? await updateRecord(id, formData) : await createRecord(formData);

//       toast.success(id ? "Topic updated successfully" : "Topic created successfully");
//       navigate(`/admin/topic?page=${page}&limit=${limit}`);
//       setPage(1);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Reset
//   const handleReset = () => {
//     setValues({
//       cluster_id: "",
//       title: "",
//       slug: "",
//       keywords: "",
//       summary: "",
//       status: "draft",
//       author: "",
//       read_time_minutes: 0,
//       tags: "",
//       is_active: 0,
//       publish_date: null,
//       access_type: "free",
//     });
//     setSlugEdited(false);
//     setErrors({});
//   };

//   // Input class
//   const inputClass =
//     "w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200";

//   const error = (m?: string) =>
//     m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

//   return (
//     <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-8">
//         <h2 className="text-2xl font-semibold text-gray-800">{id ? "Edit Topic" : "Add Topic"}</h2>
//         <button
//           onClick={() => navigate(`/admin/topic?page=${page}&limit=${limit}`)}
//           className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
//         >
//           <FiArrowLeft /> Back
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Cluster */}
//         <div>
//           <label className="block mb-2 font-medium text-gray-700">Cluster</label>
//           <select
//             name="cluster_id"
//             value={values.cluster_id}
//             onChange={handleInputChange}
//             className={inputClass}
//           >
//             <option value="">Select Cluster</option>
//             {clusters.map((c) => (
//               <option key={c._id} value={c._id}>
//                 {c.title}
//               </option>
//             ))}
//           </select>
//           {error(errors.cluster_id)}
//         </div>

//         {/* Title + Slug */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Title</label>
//             <input
//               name="title"
//               value={values.title}
//               onChange={handleInputChange}
//               className={inputClass}
//             />
//             {error(errors.title)}
//           </div>
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Slug</label>
//             <input
//               name="slug"
//               value={values.slug}
//               onChange={handleInputChange}
//               className={inputClass}
//             />
//             {error(errors.slug)}
//           </div>
//         </div>

//         {/* Access Type */}
//         <div>
//           <label className="block mb-2 font-medium text-gray-700">Topic Type</label>
//           <select
//             name="access_type"
//             value={values.access_type}
//             onChange={handleInputChange}
//             className={inputClass}
//           >
//             <option value="free">Free</option>
//             <option value="premium">Premium</option>
//           </select>
//         </div>

//         {/* Summary */}
//         <div>
//           <label className="block mb-2 font-medium text-gray-700">Summary</label>
//           <textarea
//             name="summary"
//             value={values.summary}
//             onChange={handleInputChange}
//             className={inputClass}
//             rows={3}
//           />
//         </div>

//         {/* Keywords + Tags */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Keywords</label>
//             <input
//               name="keywords"
//               value={values.keywords}
//               onChange={handleInputChange}
//               className={inputClass}
//             />
//           </div>
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Tags</label>
//             <input
//               name="tags"
//               value={values.tags}
//               onChange={handleInputChange}
//               className={inputClass}
//             />
//           </div>
//         </div>

//         {/* Author + Read Time */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Author</label>
//             <input
//               name="author"
//               value={values.author}
//               onChange={handleInputChange}
//               className={inputClass}
//             />
//           </div>
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Read Time (minutes)</label>
//             <input
//               type="number"
//               name="read_time_minutes"
//               value={values.read_time_minutes}
//               onChange={handleInputChange}
//               className={inputClass}
//             />
//             {error(errors.read_time_minutes)}
//           </div>
//         </div>

//         {/* Status + Publish Date */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Status</label>
//             <select
//               name="status"
//               value={values.status}
//               onChange={handleInputChange}
//               className={inputClass}
//             >
//               <option value="draft">Draft</option>
//               <option value="published">Published</option>
//               <option value="archived">Archived</option>
//             </select>
//           </div>
//           <div>
//             <label className="block mb-2 font-medium text-gray-700">Publish Date</label>
//             <div className="relative">
//               <DatePicker
//                 selected={values.publish_date}
//                 onChange={(d) => setValues((p) => ({ ...p, publish_date: d }))}
//                 dateFormat="yyyy-MM-dd"
//                 className={`${inputClass} pr-10`}
//                 placeholderText="Select date"
//               />
//               <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
//             </div>
//             {error(errors.publish_date)}
//           </div>
//         </div>

//         {/* Buttons */}
//         <div className="flex justify-end gap-4 pt-6  border-gray-100">
//           <button
//             type="button"
//             onClick={handleReset}
//             className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-300 transition"
//           >
//             <FiRefreshCw /> Reset
//           </button>

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md hover:bg-[#0654a4] transition"
//           >
//             <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }



"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiRefreshCw, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import axiosApi from "../api/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDataTableStore } from "../store/dataTableStore";

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

/* ================= COMPONENT ================= */

export default function AddTopic() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role: "admin",
    module: "topic",
  });

  const { setPage } = useDataTableStore();

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

  /* ================= EFFECTS ================= */

  // Load clusters
  useEffect(() => {
    axiosApi
      .get("/cluster?limit=1000")
      .then((res) => setClusters(res.data?.clusters || []))
      .catch(() => toast.error("Failed to load clusters"));
  }, []);

  // Load topic for edit
  useEffect(() => {
    if (!id) return;

    getOne(id).then((res: any) => {
      if (!res?.topic) return;

      setValues({
        cluster_id:
          typeof res.topic.cluster_id === "object"
            ? res.topic.cluster_id._id
            : res.topic.cluster_id,
        title: res.topic.title || "",
        slug: res.topic.slug || "",
        keywords: res.topic.keywords?.join(", ") || "",
        summary: res.topic.summary || "",
        status: res.topic.status || "draft",
        author: res.topic.author || "",
        read_time_minutes: res.topic.read_time_minutes || 0,
        tags: res.topic.tags?.join(", ") || "",
        is_active: res.topic.is_active ?? 0,
        publish_date: res.topic.publish_date
          ? new Date(res.topic.publish_date)
          : null,
        access_type: res.topic.access_type || "free",
      });

      setSlugEdited(true);
    });
  }, [id]);

  /* ================= HELPERS ================= */

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
          ? values.keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [],
        tags: values.tags
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        publish_date: values.publish_date
          ? values.publish_date.toISOString()
          : null,
      };

      id
        ? await updateRecord(id, payload)
        : await createRecord(payload);

      toast.success(id ? "Topic updated successfully" : "Topic created successfully");
      navigate(`/admin/topic?page=${page}&limit=${limit}`);
      setPage(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
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

  const inputClass =
    "w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200";

  const error = (m?: string) =>
    m ? <p className="text-red-500 text-sm mt-1">{m}</p> : null;

  /* ================= JSX ================= */

  return (
    <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">
          {id ? "Edit Topic" : "Add Topic"}
        </h2>
        <button
          onClick={() => navigate(`/admin/topic?page=${page}&limit=${limit}`)}
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cluster */}
        <div>
          <label className="block mb-2 font-medium">Cluster</label>
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
            <label className="block mb-2 font-medium">Title</label>
            <input
              name="title"
              value={values.title}
              onChange={handleInputChange}
              className={inputClass}
            />
            {error(errors.title)}
          </div>
          <div>
            <label className="block mb-2 font-medium">Slug</label>
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
          <label className="block mb-2 font-medium">Topic Type</label>
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
          <label className="block mb-2 font-medium">Summary</label>
          <textarea
            name="summary"
            value={values.summary}
            onChange={handleInputChange}
            className={inputClass}
            rows={3}
          />
        </div>

        {/* Keywords + Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium">Keywords</label>
            <input
              name="keywords"
              value={values.keywords}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Tags</label>
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
            <label className="block mb-2 font-medium">Author</label>
            <input
              name="author"
              value={values.author}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Read Time (minutes)</label>
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
            <label className="block mb-2 font-medium">Status</label>
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
            <label className="block mb-2 font-medium">Publish Date</label>
            <div className="relative">
              <DatePicker
                selected={values.publish_date}
                onChange={(d) =>
                  setValues((p) => ({ ...p, publish_date: d }))
                }
                dateFormat="yyyy-MM-dd"
                className={`${inputClass} pr-10`}
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {error(errors.publish_date)}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-200 px-5 py-2.5 rounded-md"
          >
            <FiRefreshCw /> Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md"
          >
            <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
