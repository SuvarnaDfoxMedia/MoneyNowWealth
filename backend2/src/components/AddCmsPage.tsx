

// // AddCmsPage.tsx
// import React, { useState, useEffect, ChangeEvent } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiSave, FiRefreshCw, FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import { RichTextField } from "../components/PagesComponent/RichTextField";

// interface Section {
//   title: string;
//   content: string;
//   images?: string[];
//   videos?: string[];
//   cta?: { text: string; url: string };
// }

// interface FAQ {
//   question: string;
//   answer: string;
// }

// interface CmsPageForm {
//   title: string;
//   slug: string;
//   sections: Section[];
//   faqs: FAQ[];
//   status: "draft" | "published" | "archived";
//   is_active?: number;
//   page_code?: string;
// }

// const generateSlug = (text: string) =>
//   text
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-");

// export default function AddCmsPage() {
//   const { role, id } = useParams<{ role?: string; id?: string }>();
//   const navigate = useNavigate();

//   const { getOne, createRecord, updateRecord } = useCommonCrud({
//     role: role || "admin",
//     module: "cmspages",
//   });

//   const [values, setValues] = useState<CmsPageForm>({
//     title: "",
//     slug: "",
//     sections: [],
//     faqs: [],
//     status: "draft",
//     is_active: 1,
//   });

//   const [loading, setLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [slugEdited, setSlugEdited] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   // Fetch CMS page for edit
//   useEffect(() => {
//     if (!id) return;

//     const fetchPage = async () => {
//       setLoading(true);
//       try {
//         const res = await getOne(id);
//         const page = res?.data?.page || res?.page || res;

//         if (!page) {
//           toast.error("CMS page not found");
//           navigate("/admin/cmspages");
//           return;
//         }

//         setValues({
//           title: page.title || "",
//           slug: page.slug || "",
//           sections: page.sections?.length ? page.sections : [],
//           faqs: page.faqs?.length ? page.faqs : [],
//           status: page.status || "draft",
//           is_active: page.is_active ?? 1,
//           page_code: page.page_code,
//         });
//       } catch (err) {
//         console.error("Error fetching CMS page:", err);
//         toast.error("Failed to fetch page details");
//         navigate("/admin/cmspages");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPage();
//   }, [id, navigate]);

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setValues((prev) => {
//       const updated = { ...prev, [name]: value };
//       if (name === "title" && !slugEdited) updated.slug = generateSlug(value);
//       if (name === "slug") setSlugEdited(true);
//       return updated;
//     });
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const addItem = (key: keyof CmsPageForm, item: any) =>
//     setValues((prev) => ({ ...prev, [key]: [...(prev[key] as any[]), item] }));

//   const removeItem = (key: keyof CmsPageForm, index: number) =>
//     setValues((prev) => ({
//       ...prev,
//       [key]: (prev[key] as any[]).filter((_, i) => i !== index),
//     }));

//   const handleSectionChange = (index: number, field: keyof Section, value: string) =>
//     setValues((prev) => {
//       const updated = [...prev.sections];
//       updated[index] = { ...updated[index], [field]: value };
//       return { ...prev, sections: updated };
//     });

//   const handleFAQChange = (index: number, field: keyof FAQ, value: string) =>
//     setValues((prev) => {
//       const updated = [...prev.faqs];
//       updated[index] = { ...updated[index], [field]: value };
//       return { ...prev, faqs: updated };
//     });

//   const resetForm = () => {
//     setValues({
//       title: "",
//       slug: "",
//       sections: [],
//       faqs: [],
//       status: "draft",
//       is_active: 1,
//     });
//     setErrors({});
//     setSlugEdited(false);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const newErrors: Record<string, string> = {};
//     if (!values.title.trim()) newErrors.title = "Title required";
//     if (!values.slug.trim()) newErrors.slug = "Slug required";
//     if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

//     try {
//       setIsSubmitting(true);
//       const payload: CmsPageForm = { ...values };
//       if (!id) delete payload.page_code;

//       if (id) {
//         await updateRecord(id, payload);
//         toast.success("CMS page updated successfully");
//       } else {
//         await createRecord(payload);
//         toast.success("CMS page created successfully");
//       }

//       navigate("/admin/cmspages");
//     } catch (error: any) {
//       console.error("Submit error:", error);
//       if (error?.message?.includes("duplicate key")) {
//         toast.error("A CMS page with this code already exists.");
//       } else {
//         toast.error(error?.message || "Failed to save CMS page");
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loading) return <div className="p-6">Loading page data...</div>;

//   return (
//     <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-semibold text-[#043f79]">
//           {id ? "Edit CMS Page" : "Add New CMS Page"}
//         </h2>
//         <button
//           type="button"
//           onClick={() => navigate("/admin/cmspages")}
//           className="bg-[#043f79] text-white px-3 py-1 rounded-md shadow hover:opacity-90 flex items-center gap-2"
//         >
//           <FiArrowLeft /> Back
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Title & Slug */}
//         <div className="grid md:grid-cols-2 gap-6">
//           <div>
//             <label className="font-medium text-gray-700">Title</label>
//             <input
//               name="title"
//               value={values.title}
//               onChange={handleChange}
//               placeholder="Enter page title"
//               className="w-full border mt-2 p-2 rounded-md"
//             />
//             {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
//           </div>
//           <div>
//             <label className="font-medium text-gray-700">Slug</label>
//             <input
//               name="slug"
//               value={values.slug}
//               onChange={handleChange}
//               placeholder="Auto-generated slug"
//               className="w-full border mt-2 p-2 rounded-md"
//             />
//             {errors.slug && <p className="text-red-500 text-sm">{errors.slug}</p>}
//           </div>
//         </div>

//         {/* Sections */}
//         <div className="border-gray-200 rounded-md p-4">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="text-lg font-semibold text-[#043f79]">Sections</h3>
//             <button
//               type="button"
//               onClick={() => addItem("sections", { title: "", content: "" })}
//               className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-90"
//             >
//               <FiPlus /> Add Section
//             </button>
//           </div>
//           {values.sections.length === 0 && (
//             <p className="text-sm text-gray-500 italic">No sections added yet.</p>
//           )}
//           {values.sections.map((section, i) => (
//             <div key={i} className="p-3 mb-3 bg-gray-50 border rounded-md">
//               <input
//                 placeholder="Section Title"
//                 value={section.title}
//                 onChange={(e) => handleSectionChange(i, "title", e.target.value)}
//                 className="w-full border mt-2 p-2 rounded-md mb-2"
//               />
//               <RichTextField
//                 value={section.content}
//                 onChange={(val) => handleSectionChange(i, "content", val)}
                
//               />
//               <button
//                 type="button"
//                 onClick={() => removeItem("sections", i)}
//                 className="text-red-600 mt-3 flex items-center gap-1 text-sm"
//               >
//                 <FiTrash2 /> Remove
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* FAQs */}
//         <div className="border-gray-200 rounded-md p-4">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="text-lg font-semibold text-[#043f79]">FAQs</h3>
//             <button
//               type="button"
//               onClick={() => addItem("faqs", { question: "", answer: "" })}
//               className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-90"
//             >
//               <FiPlus /> Add FAQ
//             </button>
//           </div>
//           {values.faqs.length === 0 && (
//             <p className="text-sm text-gray-500 italic">No FAQs added yet.</p>
//           )}
//           {values.faqs.map((faq, i) => (
//             <div key={i} className="p-3 mb-3 bg-gray-50 border rounded-md">
//               <input
//                 placeholder="Question"
//                 value={faq.question}
//                 onChange={(e) => handleFAQChange(i, "question", e.target.value)}
//                 className="w-full border mt-2 p-2 rounded-md mb-2"
//               />
//               <RichTextField
//                 value={faq.answer}
//                 onChange={(val) => handleFAQChange(i, "answer", val)}
//                 height={250} // Set height for FAQ answer
//               />
//               <button
//                 type="button"
//                 onClick={() => removeItem("faqs", i)}
//                 className="text-red-600 mt-3 flex items-center gap-1 text-sm"
//               >
//                 <FiTrash2 /> Remove
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* Status */}
//         <div className="md:w-1/2">
//           <label className="font-medium text-gray-700">Status</label>
//           <select
//             name="status"
//             value={values.status}
//             onChange={handleChange}
//             className="w-full border mt-2 p-2 rounded-md"
//           >
//             <option value="draft">Draft</option>
//             <option value="published">Published</option>
//             <option value="archived">Archived</option>
//           </select>
//         </div>

//         {/* Buttons */}
//         <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
//           <button
//             type="button"
//             onClick={resetForm}
//             className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90"
//           >
//             <FiRefreshCw /> Reset
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90"
//           >
//             <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }


// AddCmsPage.tsx




// import React, { useState, useEffect, ChangeEvent } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiSave, FiRefreshCw, FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import { RichTextField } from "../components/PagesComponent/RichTextField";

// interface Section {
//   title: string;
//   content: string;
//   images?: string[];
//   videos?: string[];
//   cta?: { text: string; url: string };
// }

// interface FAQ {
//   question: string;
//   answer: string;
// }

// interface CmsPageForm {
//   title: string;
//   slug: string;
//   sections: Section[];
//   faqs: FAQ[];
//   status: "draft" | "published" | "archived";
//   is_active?: number;
//   page_code?: string;
// }

// const generateSlug = (text: string) =>
//   text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

// export default function AddCmsPage() {
//   const { role, id } = useParams<{ role?: string; id?: string }>();
//   const navigate = useNavigate();

//   const { getOne, createRecord, updateRecord } = useCommonCrud({
//     role: role || "admin",
//     module: "cmspages",
//   });

//   const [values, setValues] = useState<CmsPageForm>({
//     title: "",
//     slug: "",
//     sections: [],
//     faqs: [],
//     status: "draft",
//     is_active: 1,
//   });

//   const [loading, setLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [slugEdited, setSlugEdited] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   /** =====================
//    *  FETCH PAGE (EDIT MODE)
//    *  ===================== */
//   useEffect(() => {
//     if (!id) return;

//     const fetchPage = async () => {
//       setLoading(true);
//       try {
//         const res: any = await getOne(id);

//         // safely resolve page data
//         const page = res?.page ?? res?.data ?? res;

//         if (!page || typeof page !== "object") {
//           toast.error("CMS page not found");
//           navigate("/admin/cmspages");
//           return;
//         }

//         setValues({
//           title: page.title || "",
//           slug: page.slug || "",
//           sections: Array.isArray(page.sections) ? page.sections : [],
//           faqs: Array.isArray(page.faqs) ? page.faqs : [],
//           status: page.status || "draft",
//           is_active: page.is_active ?? 1,
//           page_code: page.page_code,
//         });
//       } catch (err) {
//         toast.error("Failed to fetch CMS page");
//         navigate("/admin/cmspages");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPage();
//   }, [id, navigate]);

//   /** =====================
//    *  HELPERS
//    *  ===================== */

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;

//     setValues((prev) => {
//       const updated = { ...prev, [name]: value };
//       if (name === "title" && !slugEdited) updated.slug = generateSlug(value);
//       if (name === "slug") setSlugEdited(true);
//       return updated;
//     });

//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const addItem = (key: keyof CmsPageForm, item: any) =>
//     setValues((prev) => ({ ...prev, [key]: [...(prev[key] as any[]), item] }));

//   const removeItem = (key: keyof CmsPageForm, index: number) =>
//     setValues((prev) => ({
//       ...prev,
//       [key]: (prev[key] as any[]).filter((_, i) => i !== index),
//     }));

//   const handleSectionChange = (index: number, field: keyof Section, value: string) =>
//     setValues((prev) => {
//       const arr = [...prev.sections];
//       arr[index] = { ...arr[index], [field]: value };
//       return { ...prev, sections: arr };
//     });

//   const handleFAQChange = (index: number, field: keyof FAQ, value: string) =>
//     setValues((prev) => {
//       const arr = [...prev.faqs];
//       arr[index] = { ...arr[index], [field]: value };
//       return { ...prev, faqs: arr };
//     });

//   /** =====================
//    *  CREATE FORM-DATA
//    *  ===================== */
//   const toFormData = (data: CmsPageForm): FormData => {
//     const form = new FormData();

//     form.append("title", data.title);
//     form.append("slug", data.slug);
//     form.append("status", data.status);
//     form.append("is_active", String(data.is_active ?? 1));

//     if (data.page_code) form.append("page_code", data.page_code);

//     form.append("sections", JSON.stringify(data.sections));
//     form.append("faqs", JSON.stringify(data.faqs));

//     return form;
//   };

//   /** =====================
//    *  SUBMIT HANDLER
//    *  ===================== */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const newErrors: Record<string, string> = {};
//     if (!values.title.trim()) newErrors.title = "Title required";
//     if (!values.slug.trim()) newErrors.slug = "Slug required";

//     if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

//     try {
//       setIsSubmitting(true);

//       const payload = toFormData(values);

//       if (id) {
//         await updateRecord(id, payload as FormData);
//         toast.success("CMS page updated successfully");
//       } else {
//         await createRecord(payload as FormData);
//         toast.success("CMS page created successfully");
//       }

//       navigate("/admin/cmspages");
//     } catch (error: any) {
//       toast.error(error?.message || "Failed to save CMS page");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   /** =====================
//    *  RESET FORM
//    *  ===================== */
//   const resetForm = () => {
//     setValues({
//       title: "",
//       slug: "",
//       sections: [],
//       faqs: [],
//       status: "draft",
//       is_active: 1,
//     });
//     setErrors({});
//     setSlugEdited(false);
//   };

//   if (loading) return <div className="p-6">Loading page...</div>;

//   /** =====================
//    *  RENDER
//    *  ===================== */
//   return (
//     <div className="p-6 bg-white rounded-xl shadow-md border">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-semibold text-[#043f79]">
//           {id ? "Edit CMS Page" : "Add New CMS Page"}
//         </h2>
//         <button
//           type="button"
//           onClick={() => navigate("/admin/cmspages")}
//           className="bg-[#043f79] text-white px-3 py-1 rounded-md shadow hover:opacity-90 flex items-center gap-2"
//         >
//           <FiArrowLeft /> Back
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* TITLE & SLUG */}
//         <div className="grid md:grid-cols-2 gap-6">
//           <div>
//             <label className="font-medium">Title</label>
//             <input
//               name="title"
//               value={values.title}
//               onChange={handleChange}
//               className="w-full border mt-2 p-2 rounded-md"
//             />
//             {errors.title && <p className="text-red-500">{errors.title}</p>}
//           </div>

//           <div>
//             <label className="font-medium">Slug</label>
//             <input
//               name="slug"
//               value={values.slug}
//               onChange={handleChange}
//               className="w-full border mt-2 p-2 rounded-md"
//             />
//             {errors.slug && <p className="text-red-500">{errors.slug}</p>}
//           </div>
//         </div>

//         {/* SECTIONS */}
//         <div className=" p-2">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="text-lg font-semibold text-[#043f79]">Sections</h3>
//             <button
//               type="button"
//               onClick={() => addItem("sections", { title: "", content: "" })}
//               className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2"
//             >
//               <FiPlus /> Add Section
//             </button>
//           </div>

//           {values.sections.map((section, i) => (
//             <div key={i} className="p-3 mb-3 bg-gray-50 border rounded-md">
//               <input
//                 placeholder="Section Title"
//                 value={section.title}
//                 onChange={(e) => handleSectionChange(i, "title", e.target.value)}
//                 className="w-full border mt-2 p-2 rounded-md mb-2"
//               />

//               <RichTextField
//                 value={section.content}
//                 onChange={(val) => handleSectionChange(i, "content", val)}
//               />

//               <button
//                 type="button"
//                 onClick={() => removeItem("sections", i)}
//                 className="text-red-600 mt-3 flex items-center gap-1 text-sm"
//               >
//                 <FiTrash2 /> Remove
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* FAQS */}
//         <div className="p-2">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="text-lg font-semibold text-[#043f79]">FAQs</h3>
//             <button
//               type="button"
//               onClick={() => addItem("faqs", { question: "", answer: "" })}
//               className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2"
//             >
//               <FiPlus /> Add FAQ
//             </button>
//           </div>

//           {values.faqs.map((faq, i) => (
//             <div key={i} className="p-3 mb-3 bg-gray-50 border rounded-md">
//               <input
//                 placeholder="Question"
//                 value={faq.question}
//                 onChange={(e) => handleFAQChange(i, "question", e.target.value)}
//                 className="w-full border mt-2 p-2 rounded-md mb-2"
//               />

//               <RichTextField
//                 value={faq.answer}
//                 onChange={(val) => handleFAQChange(i, "answer", val)}
//                 height={250}
//               />

//               <button
//                 type="button"
//                 onClick={() => removeItem("faqs", i)}
//                 className="text-red-600 mt-3 flex items-center gap-1 text-sm"
//               >
//                 <FiTrash2 /> Remove
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* STATUS */}
//         <div className="md:w-1/2">
//           <label className="font-medium">Status</label>
//           <select
//             name="status"
//             value={values.status}
//             onChange={handleChange}
//             className="w-full border mt-2 p-2 rounded-md"
//           >
//             <option value="draft">Draft</option>
//             <option value="published">Published</option>
//             <option value="archived">Archived</option>
//           </select>
//         </div>

//         {/* BUTTONS */}
//         <div className="flex justify-end gap-4 pt-4 ">
//           <button
//             type="button"
//             onClick={resetForm}
//             className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2"
//           >
//             <FiRefreshCw /> Reset
//           </button>

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2"
//           >
//             <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }


import React, { useState, useEffect, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSave, FiRefreshCw, FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
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

const generateSlug = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

export default function AddCmsPage() {
  const { role, id } = useParams<{ role?: string; id?: string }>();
  const navigate = useNavigate();

  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role: role || "admin",
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

  useEffect(() => {
    if (!id) return;

    const fetchPage = async () => {
      setLoading(true);
      try {
        const res: any = await getOne(id);
        const page = res?.page ?? res?.data ?? res;

        if (!page || typeof page !== "object") {
          toast.error("CMS page not found");
          navigate("/admin/cmspages");
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
      } catch (err) {
        toast.error("Failed to fetch CMS page");
        navigate("/admin/cmspages");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id, navigate]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  const addItem = (key: keyof CmsPageForm, item: any) =>
    setValues((prev) => ({ ...prev, [key]: [...(prev[key] as any[]), item] }));

  const removeItem = (key: keyof CmsPageForm, index: number) =>
    setValues((prev) => ({
      ...prev,
      [key]: (prev[key] as any[]).filter((_, i) => i !== index),
    }));

  const handleSectionChange = (index: number, field: keyof Section, value: string) =>
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

  const toFormData = (data: CmsPageForm): FormData => {
    const form = new FormData();
    form.append("title", data.title);
    form.append("slug", data.slug);
    form.append("status", data.status);
    form.append("is_active", String(data.is_active ?? 1));

    if (data.page_code) form.append("page_code", data.page_code);

    form.append("sections", JSON.stringify(data.sections));
    form.append("faqs", JSON.stringify(data.faqs));

    return form;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!values.title.trim()) newErrors.title = "Title required";
    if (!values.slug.trim()) newErrors.slug = "Slug required";

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    try {
      setIsSubmitting(true);
      const payload = toFormData(values);

      if (id) {
        await updateRecord(id, payload as FormData);
        toast.success("CMS page updated successfully");
      } else {
        await createRecord(payload as FormData);
        toast.success("CMS page created successfully");
      }

      navigate("/admin/cmspages");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save CMS page");
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
    <div className="p-6 bg-white rounded-xl shadow-md border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit CMS Page" : "Add New CMS Page"}
        </h2>

        <button
          type="button"
          onClick={() => navigate("/admin/cmspages")}
          className="bg-[#043f79] text-white px-3 py-1 rounded-md shadow flex items-center gap-2"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TITLE & SLUG */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="font-medium">Title</label>
            <input
              name="title"
              value={values.title}
              onChange={handleChange}
              className="w-full border mt-2 p-2 rounded-md"
            />
            {errors.title && <p className="text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="font-medium">Slug</label>
            <input
              name="slug"
              value={values.slug}
              onChange={handleChange}
              className="w-full border mt-2 p-2 rounded-md"
            />
            {errors.slug && <p className="text-red-500">{errors.slug}</p>}
          </div>
        </div>

        {/* SECTIONS */}
        <div className="p-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-[#043f79]">Sections</h3>
            <button
              type="button"
              onClick={() => addItem("sections", { title: "", content: "" })}
              className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2"
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
                onChange={(e) => handleSectionChange(i, "title", e.target.value)}
                className="w-full border p-2 rounded-md mb-4 focus:ring focus:ring-blue-200"
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
        <div className="p-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-[#043f79]">FAQs</h3>
            <button
              type="button"
              onClick={() => addItem("faqs", { question: "", answer: "" })}
              className="bg-[#043f79] text-white px-3 py-1 rounded-md flex items-center gap-2"
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
                className="w-full border mt-2 p-2 rounded-md mb-2"
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
          <label className="font-medium">Status</label>
          <select
            name="status"
            value={values.status}
            onChange={handleChange}
            className="w-full border mt-2 p-2 rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-4 pt-4 ">
          <button
            type="button"
            onClick={resetForm}
            className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <FiRefreshCw /> Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#043f79] text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
