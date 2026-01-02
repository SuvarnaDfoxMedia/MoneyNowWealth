

import React, { useEffect, useState, ChangeEvent, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSave, FiRefreshCw, FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { RichTextField } from "../components/PagesComponent/RichTextField";
import { useCommonCrud } from "../hooks/useCommonCrud";
import { axiosApi } from "../api/axios";

interface Topic { _id: string; title: string; }
interface Section { title: string; content: string; }
interface Faq { question: string; answer: string; }
interface Tool { title: string; content: string; }
interface RelatedRead { title: string; content: string; }

interface ArticleForm {
  topic_id: string;
  title: string;
  slug: string;
  seo_title: string;
  introduction: string;
  seo_description: string;
  hero_image?: File | string;
  focus_keyword: string;
  read_time: number;
  author: string;
  status: string;
  sections: Section[];
  faqs: Faq[];
  tools: Tool[];
  related_reads: RelatedRead[];
}

const UPLOAD_BASE = `${import.meta.env.VITE_API_BASE.replace("/api", "")}/uploads/hero`;

const generateSlug = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export default function AddArticle() {
  const { id, role } = useParams<{ id?: string; role?: string }>();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({ role, module: "article" });

  const [values, setValues] = useState<ArticleForm>({
    topic_id: "",
    title: "",
    slug: "",
    seo_title: "",
    introduction: "",
    seo_description: "",
    focus_keyword: "",
    read_time: 0,
    author: "",
    status: "draft",
    sections: [],
    faqs: [],
    tools: [],
    related_reads: [],
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [slugEdited, setSlugEdited] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState<boolean>(false);
  const topicWrapperRef = useRef<HTMLDivElement>(null);
  const [topicSearch, setTopicSearch] = useState<string>("");
  const [editorKey, setEditorKey] = useState(0);

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await axiosApi.getList<{ data?: Topic[]; topics?: Topic[] }>("/topic-list");
        let topicsFromRes: Topic[] = [];
        if (Array.isArray(res)) topicsFromRes = res;
        else if ("data" in res && Array.isArray(res.data)) topicsFromRes = res.data;
        else if ("topics" in res && Array.isArray(res.topics)) topicsFromRes = res.topics;
        setTopics(topicsFromRes);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load topics");
        setTopics([]);
      }
    };
    fetchTopics();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topicWrapperRef.current && !topicWrapperRef.current.contains(event.target as Node)) {
        setTopicDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load article for edit
  // useEffect(() => {
  //   if (!id) return;
  //   const loadData = async () => {
  //     try {
  //       const raw = await getOne(id);
  //       const data = raw?.data ?? raw;
  //       if (!data) return;

  //       setValues({
  //         topic_id: typeof data.topic_id === "string" ? data.topic_id : data.topic_id?._id ?? "",
  //         title: data.title ?? "",
  //         slug: data.slug ?? "",
  //         seo_title: data.seo_title ?? "",
  //         introduction: data.introduction ?? "",
  //         seo_description: data.seo_description ?? "",
  //         focus_keyword: data.focus_keyword ?? "",
  //         read_time: data.read_time ?? 0,
  //         author: data.author ?? "",
  //         status: data.status ?? "draft",
  //         sections: data.sections ?? [],
  //         faqs: data.faqs ?? [],
  //         tools: (data.tools ?? []).map((t: any) => ({ title: t.title || t.name || "", content: t.content || t.url || "" })),
  //         related_reads: (data.related_reads ?? []).map((r: any) => ({ title: r.title || "", content: r.content || "" })),
  //         hero_image: data.hero_image ?? "",
  //       });

  //       if (data.slug) setSlugEdited(true);

  //       if (data.hero_image) {
  //         setPreviewUrl(
  //           data.hero_image.startsWith("http")
  //             ? data.hero_image
  //             : `${UPLOAD_BASE}/${data.hero_image.replace(/.*[\\/]/, "")}`
  //         );
  //       }
  //     } catch (err) {
  //       toast.error("Failed to load article");
  //     }
  //   };
  //   loadData();
  // }, [id]);

  // Load article for edit
useEffect(() => {
  if (!id) return;

  const loadData = async () => {
    try {
      const raw = await getOne(id);
      const data = (raw?.data ?? raw) as ArticleForm;
      if (!data) return;

      setValues({
        topic_id: typeof data.topic_id === "string" ? data.topic_id : (data.topic_id as Topic)?._id ?? "",
        title: data.title ?? "",
        slug: data.slug ?? "",
        seo_title: data.seo_title ?? "",
        introduction: data.introduction ?? "",
        seo_description: data.seo_description ?? "",
        focus_keyword: data.focus_keyword ?? "",
        read_time: data.read_time ?? 0,
        author: data.author ?? "",
        status: data.status ?? "draft",
        sections: data.sections ?? [],
        faqs: data.faqs ?? [],
        tools: (data.tools ?? []).map((t: any) => ({
          title: t.title || t.name || "",
          content: t.content || t.url || "",
        })),
        related_reads: (data.related_reads ?? []).map((r: any) => ({
          title: r.title || "",
          content: r.content || "",
        })),
        hero_image: data.hero_image ?? "",
      });

      if (data.slug) setSlugEdited(true);

      if (data.hero_image) {
        if (typeof data.hero_image === "string") {
          setPreviewUrl(
            data.hero_image.startsWith("http")
              ? data.hero_image
              : `${UPLOAD_BASE}/${data.hero_image.replace(/.*[\\/]/, "")}`
          );
        } else if (data.hero_image instanceof File) {
          setPreviewUrl(URL.createObjectURL(data.hero_image));
        }
      }
    } catch (err) {
      toast.error("Failed to load article");
    }
  };

  loadData();
}, [id]);



  // Input change
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => {
      const updated = { ...prev, [name]: value } as ArticleForm;
      if (name === "title" && !slugEdited) updated.slug = generateSlug(value);
      if (name === "slug") setSlugEdited(true);
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Hero image
  const handleHeroImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, hero_image: "Only image files allowed" }));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(selectedFile);
    img.onload = () => {
      if (img.width !== 1140 || img.height !== 590) {
        setErrors((p) => ({ ...p, hero_image: "Image must be 1140×590" }));
        URL.revokeObjectURL(objectUrl);
      } else {
        setErrors((p) => ({ ...p, hero_image: "" }));
        setFile(selectedFile);
        setPreviewUrl(objectUrl);
      }
    };
    img.onerror = () => {
      setErrors((p) => ({ ...p, hero_image: "Invalid image file" }));
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  // Dynamic arrays
  const addItem = (key: keyof ArticleForm, item: any) =>
    setValues((prev) => ({ ...prev, [key]: [...(prev[key] as any[]), item] }));
  const removeItem = (key: keyof ArticleForm, index: number) =>
    setValues((prev) => ({ ...prev, [key]: (prev[key] as any[]).filter((_, i) => i !== index) }));

  // Reset form
  const resetForm = () => {
    setValues({
      topic_id: "",
      title: "",
      slug: "",
      seo_title: "",
      introduction: "",
      seo_description: "",
      focus_keyword: "",
      read_time: 0,
      author: "",
      status: "draft",
      sections: [],
      faqs: [],
      tools: [],
      related_reads: [],
    });
    setFile(null);
    setPreviewUrl("");
    setErrors({});
    setSlugEdited(false);
    setEditorKey((prev) => prev + 1); // reset editors
  };

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!values.topic_id) newErrors.topic_id = "Topic required";
    if (!values.title.trim()) newErrors.title = "Title required";
    if (!values.slug.trim()) newErrors.slug = "Slug required";
    if (!file && !previewUrl) newErrors.hero_image = "Hero image required";
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
        else if (value !== undefined && value !== null) formData.append(key, String(value));
      });
      if (file) formData.append("hero_image", file);
      if (id) await updateRecord(id, formData);
      else await createRecord(formData);
      toast.success(`Article ${id ? "updated" : "created"}`);
      navigate(`/${role}/article`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save article");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#043f79]">{id ? "Edit Article" : "Add New Article"}</h2>
        <button
          onClick={() => navigate(`/${role}/article`)}
          className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow hover:opacity-90 flex items-center gap-2"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Topic & Title */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Topic Dropdown */}
          <div ref={topicWrapperRef} className="relative">
            <label className="font-medium text-gray-700">Topic</label>
            <div
              onClick={() => setTopicDropdownOpen((prev) => !prev)}
              className={`w-full mt-2 p-2 rounded-md flex justify-between items-center cursor-pointer border ${
                errors.topic_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <span>
                {topics.length === 0
                  ? "Loading topics..."
                  : topics.find((t) => t._id === values.topic_id)?.title ?? "-- Select Topic --"}
              </span>
              <svg
                className={`w-4 h-4 transform transition-transform ${topicDropdownOpen ? "rotate-180" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {errors.topic_id && <p className="text-red-500 text-sm mt-1">{errors.topic_id}</p>}
            {topicDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-lg">
                <input
                  type="text"
                  placeholder="Search topic..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                />
                {topics.filter((t) => t.title.toLowerCase().includes(topicSearch.toLowerCase())).map((t) => (
                  <div
                    key={t._id}
                    onClick={() => {
                      setValues((prev) => ({ ...prev, topic_id: t._id }));
                      setTopicDropdownOpen(false);
                      setTopicSearch("");
                      setErrors((prev) => ({ ...prev, topic_id: "" }));
                    }}
                    className={`p-2 cursor-pointer hover:bg-blue-100 ${values.topic_id === t._id ? "bg-blue-50 font-medium" : ""}`}
                  >
                    {t.title}
                  </div>
                ))}
                {topics.filter((t) => t.title.toLowerCase().includes(topicSearch.toLowerCase())).length === 0 && (
                  <p className="text-gray-400 text-sm p-2">No topics found.</p>
                )}
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={values.title}
              onChange={onChange}
              placeholder="Enter article title"
              className="w-full border mt-2 p-2 rounded-md"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
        </div>

        {/* Slug & SEO */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="font-medium text-gray-700">Slug</label>
            <input name="slug" value={values.slug} onChange={onChange} placeholder="Enter slug" className="w-full border mt-2 p-2 rounded-md" />
          </div>
          <div>
            <label className="font-medium text-gray-700">SEO Title</label>
            <input name="seo_title" value={values.seo_title} onChange={onChange} placeholder="Enter SEO title" className="w-full border mt-2 p-2 rounded-md" />
          </div>
        </div>

        {/* Introduction */}
        <div>
          <label className="font-medium text-gray-700 block">Introduction</label>
          <div className="mt-2">
            <RichTextField key={`intro-${editorKey}`} value={values.introduction} onChange={(v) => setValues((p) => ({ ...p, introduction: v }))} />
          </div>
        </div>

        {/* SEO Description */}
        <div>
          <label className="font-medium text-gray-700">SEO Description</label>
          <textarea name="seo_description" value={values.seo_description} onChange={onChange} rows={3} className="w-full border mt-2 p-2 rounded-md" />
        </div>

        {/* Hero Image & Keyword */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="font-medium text-gray-700">Hero Image <span className="text-sm text-gray-500">(1140×590)</span></label>
            <input type="file" accept="image/*" onChange={handleHeroImageChange} className="mt-2" />
            {previewUrl && <img src={previewUrl} alt="Hero Preview" className="mt-3 w-64 h-36 object-cover rounded-md border" />}
            {errors.hero_image && <p className="text-red-500 text-sm">{errors.hero_image}</p>}
          </div>
          <div>
            <label className="font-medium text-gray-700">Focus Keyword</label>
            <input name="focus_keyword" value={values.focus_keyword} onChange={onChange} className="w-full border mt-2 p-2 rounded-md" />
          </div>
        </div>

        {/* Status & Author */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="font-medium text-gray-700">Status</label>
            <select name="status" value={values.status} onChange={onChange} className="w-full border mt-2 p-2 rounded-md">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="font-medium text-gray-700">Author</label>
            <input name="author" value={values.author} onChange={onChange} placeholder="Enter author name" className="w-full border mt-2 p-2 rounded-md" />
          </div>
        </div>

        {/* Dynamic Arrays */}
        {(["sections", "faqs", "tools", "related_reads"] as Array<keyof ArticleForm>).map((key) => {
          const items = values[key] as Section[] | Faq[] | Tool[] | RelatedRead[];
          return (
            <div key={key} className="border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-[#043f79] capitalize">{key.replace("_", " ")}</h3>
                <button
                  type="button"
                  onClick={() =>
                    addItem(
                      key,
                      key === "sections" ? { title: "", content: "" } :
                      key === "faqs" ? { question: "", answer: "" } :
                      { title: "", content: "" }
                    )
                  }
                  className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2"
                >
                  <FiPlus /> Add
                </button>
              </div>

              {items.map((item, i) => (
                <div key={i} className="p-3 mb-3 bg-gray-50 border border-gray-200 rounded-md">
                  {"title" in item && (
                    <input
                      placeholder="Title"
                      value={item.title || ""}
                      onChange={(e) => {
                        const arr = [...(values[key] as (Section | Tool | RelatedRead)[])];
                        arr[i].title = e.target.value;
                        setValues((p) => ({ ...p, [key]: arr }));
                      }}
                      className="w-full border p-2 rounded-md mb-2"
                    />
                  )}

                  {"question" in item && (
                    <input
                      placeholder="Question"
                      value={item.question || ""}
                      onChange={(e) => {
                        const arr = [...(values[key] as Faq[])];
                        arr[i].question = e.target.value;
                        setValues((p) => ({ ...p, [key]: arr }));
                      }}
                      className="w-full border p-2 rounded-md mb-2"
                    />
                  )}

                  {"content" in item && (
                    <RichTextField
                      value={item.content}
                      onChange={(v) => {
                        const arr = [...(values[key] as (Section | Tool | RelatedRead)[])];
                        arr[i].content = v;
                        setValues((p) => ({ ...p, [key]: arr }));
                      }}
                    />
                  )}

                  {"answer" in item && (
                    <RichTextField
                      value={item.answer}
                      onChange={(v) => {
                        const arr = [...(values[key] as Faq[])];
                        arr[i].answer = v;
                        setValues((p) => ({ ...p, [key]: arr }));
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(key, i)}
                    className="text-red-600 mt-3 flex items-center gap-1 text-sm"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {/* Submit & Reset */}
        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={resetForm} className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90">
            <FiRefreshCw /> Reset
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90">
            <FiSave /> {id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
