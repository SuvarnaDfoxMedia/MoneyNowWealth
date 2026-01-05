// // AddSubscriptionPlan.tsx
// import React, { useEffect, useState, ChangeEvent } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiSave, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import { RichTextField } from "../components/PagesComponent/RichTextField";

// interface SubscriptionPlanForm {
//   name: string;
//   description: string;
//   price: number;
//   duration_value: number;
//   duration_unit: "day" | "month" | "year";
//   features: string[];
//   is_active: boolean;
// }

// export default function AddSubscriptionPlan() {
//   const { id, role } = useParams();
//   const navigate = useNavigate();

//   const { getOne, createRecord, updateRecord } = useCommonCrud({
//     role,
//     module: "subscription-plan",
//   });

//   const [values, setValues] = useState<SubscriptionPlanForm>({
//     name: "",
//     description: "",
//     price: 0,
//     duration_value: 1,
//     duration_unit: "day",
//     features: [""],
//     is_active: true,
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (!id) return;
//     (async () => {
//       try {
//         const res = await getOne(id);
//         const plan = res?.data?.plan || res?.plan || res;

//         if (!plan) {
//           toast.error("Subscription plan not found");
//           return;
//         }

//         setValues({
//           name: plan.name || "",
//           description: plan.description || "",
//           price: plan.price || 0,
//           duration_value: plan.duration?.value || 1,
//           duration_unit: plan.duration?.unit || "day",
//           features: plan.features?.length ? plan.features : [""],
//           is_active: plan.is_active ?? true,
//         });
//       } catch (error) {
//         toast.error("Failed to load subscription plan");
//       }
//     })();
//   }, [id]);

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type, checked } = e.target;

//     setValues((prev) => ({
//       ...prev,
//       [name]:
//         type === "checkbox"
//           ? checked
//           : name === "price" || name === "duration_value"
//           ? Number(value)
//           : value,
//     }));

//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const resetForm = () => {
//     setValues({
//       name: "",
//       description: "",
//       price: 0,
//       duration_value: 1,
//       duration_unit: "day",
//       features: [""],
//       is_active: true,
//     });
//     setErrors({});
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const newErrors: Record<string, string> = {};
//     if (!values.name.trim()) newErrors.name = "Name is required";
//     if (!values.description.trim()) newErrors.description = "Description is required";
//     if (values.duration_value <= 0) newErrors.duration_value = "Duration must be at least 1";

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       const payload = {
//         name: values.name.trim(),
//         description: values.description.trim(),
//         price: values.price,
//         currency: "INR",
//         duration: {
//           value: values.duration_value,
//           unit: values.duration_unit, // day | month | year
//         },
//         features: values.features.filter((f) => f.trim() !== ""),
//         is_active: values.is_active,
//       };

//       if (id) {
//         await updateRecord(id, payload);
//         toast.success("Subscription plan updated successfully");
//       } else {
//         await createRecord(payload);
//         toast.success("Subscription plan created successfully");
//       }

//       navigate(`/${role}/subscriptionplan`);
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message || "Failed to save subscription plan"
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
//       <div className="flex justify-between items-center mb-8">
//         <h2 className="text-2xl font-semibold text-[#043f79]">
//           {id ? "Edit Subscription Plan" : "Add Subscription Plan"}
//         </h2>
//         <button
//           onClick={() => navigate(`/${role}/subscriptionplan`)}
//           className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
//         >
//           <FiArrowLeft /> Back
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-8">
//         <div>
//           <label className="block mb-2 text-gray-700 font-medium">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={values.name}
//             onChange={handleChange}
//             placeholder="Enter plan name"
//             className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
//           />
//           {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
//         </div>

//         <div>
//           <label className="block mb-2 text-gray-700 font-medium">Description</label>
//           <textarea
//             name="description"
//             value={values.description}
//             onChange={handleChange}
//             rows={3}
//             placeholder="Enter plan description"
//             className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
//           />
//           {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div>
//             <label className="block mb-2 text-gray-700 font-medium">Price (₹)</label>
//             <input
//               type="number"
//               name="price"
//               value={values.price}
//               onChange={handleChange}
//               className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
//               min={0}
//             />
//             {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-700 font-medium">Duration</label>
//             <div className="flex gap-3">
//               <input
//                 type="number"
//                 name="duration_value"
//                 value={values.duration_value}
//                 onChange={handleChange}
//                 className="w-1/2 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
//                 min={1}
//               />
//               <select
//                 name="duration_unit"
//                 value={values.duration_unit}
//                 onChange={handleChange}
//                 className="w-1/2 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
//               >
//                 <option value="day">Day</option>
//                 <option value="month">Month</option>
//                 <option value="year">Year</option>
//               </select>
//             </div>
//             {errors.duration_value && <p className="text-red-500 text-sm">{errors.duration_value}</p>}
//           </div>
//         </div>

//         <div>
//           <label className="flex items-center gap-3 text-gray-700 font-medium">
//             <input
//               type="checkbox"
//               name="is_active"
//               checked={values.is_active}
//               onChange={handleChange}
//               className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//             />
//             Active Plan
//           </label>
//         </div>

//         <div>
//           <label className="block mb-3 text-gray-700 font-medium">Features</label>
//           <div className="border border-gray-200 rounded-lg shadow-sm bg-gray-50">
//             <div className="p-4">
//               <RichTextField
//                 value={values.features[0] || ""}
//                 onChange={(value) =>
//                   setValues((prev) => ({ ...prev, features: [value] }))
//                 }
//               />
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
//           <button
//             type="button"
//             onClick={resetForm}
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




// // AddSubscriptionPlan.tsx
// "use client";

// import React, { useEffect, useState, ChangeEvent } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { FiSave, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import { RichTextField } from "../components/PagesComponent/RichTextField";

// // Form Interface
// interface SubscriptionPlanForm {
//   name: string;
//   description: string;
//   price: number;
//   duration_value: number;
//   duration_unit: "day" | "month" | "year";
//   features: string[];
//   is_active: boolean;
// }

// // API Response Interface
// interface ApiResponse<T> {
//   message?: string;
//   data?: any;
//   plan?: any;
//   [key: string]: any;
// }

// export default function AddSubscriptionPlan() {
//   const { id, role } = useParams();
//   const navigate = useNavigate();

//   const { getOne, createRecord, updateRecord } = useCommonCrud({
//     role,
//     module: "subscription-plan",
//   });

//   const [values, setValues] = useState<SubscriptionPlanForm>({
//     name: "",
//     description: "",
//     price: 0,
//     duration_value: 1,
//     duration_unit: "day",
//     features: [""],
//     is_active: true,
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Extract Plan function for multiple API formats
//   const extractPlan = (res: any) => {
//     if (!res) return null;

//     return (
//       res.data?.plan ||
//       res.data?.data ||
//       res.plan ||
//       res.data ||
//       res
//     );
//   };

//   // Load data if editing
//   useEffect(() => {
//     if (!id) return;

//     (async () => {
//       try {
//         const res: ApiResponse<any> = await getOne(id);
//         const plan = extractPlan(res);

//         if (!plan) {
//           toast.error("Subscription plan not found");
//           return;
//         }

//         setValues({
//           name: plan.name ?? "",
//           description: plan.description ?? "",
//           price: plan.price ?? 0,
//           duration_value: plan.duration?.value ?? 1,
//           duration_unit: plan.duration?.unit ?? "day",
//           features: Array.isArray(plan.features) ? plan.features : [""],
//           is_active: plan.is_active ?? true,
//         });
//       } catch (error) {
//         toast.error("Failed to load subscription plan");
//       }
//     })();
//   }, [id]);

//   // Handle field changes
//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const target = e.target as HTMLInputElement;
//     const { name, value, type } = target;

//     const checked = type === "checkbox" ? target.checked : undefined;

//     setValues((prev) => ({
//       ...prev,
//       [name]:
//         type === "checkbox"
//           ? checked
//           : name === "price" || name === "duration_value"
//           ? Number(value)
//           : value,
//     }));

//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   // Reset form
//   const resetForm = () => {
//     setValues({
//       name: "",
//       description: "",
//       price: 0,
//       duration_value: 1,
//       duration_unit: "day",
//       features: [""],
//       is_active: true,
//     });
//     setErrors({});
//   };

//   // Handle submit
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const newErrors: Record<string, string> = {};
//     if (!values.name.trim()) newErrors.name = "Name is required";
//     if (!values.description.trim())
//       newErrors.description = "Description is required";
//     if (values.duration_value <= 0)
//       newErrors.duration_value = "Duration must be at least 1";

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       const payload = {
//         name: values.name.trim(),
//         description: values.description.trim(),
//         price: values.price,
//         currency: "INR",
//         duration: {
//           value: values.duration_value,
//           unit: values.duration_unit,
//         },
//         features: values.features.filter((f) => f.trim() !== ""),
//         is_active: values.is_active,
//       };

//       // Convert to FormData (because CRUD expects FormData)
//       const formData = new FormData();
//       formData.append("name", payload.name);
//       formData.append("description", payload.description);
//       formData.append("price", String(payload.price));
//       formData.append("currency", payload.currency);
//       formData.append("is_active", String(payload.is_active));
//       formData.append("duration", JSON.stringify(payload.duration));
//       formData.append("features", JSON.stringify(payload.features));

//       if (id) {
//         await updateRecord(id, formData);
//         toast.success("Subscription plan updated successfully");
//       } else {
//         await createRecord(formData);
//         toast.success("Subscription plan created successfully");
//       }

//       navigate(`/${role}/subscriptionplan`);
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message || "Failed to save subscription plan"
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
//       <div className="flex justify-between items-center mb-8">
//         <h2 className="text-2xl font-semibold text-[#043f79]">
//           {id ? "Edit Subscription Plan" : "Add Subscription Plan"}
//         </h2>
//         <button
//           onClick={() => navigate(`/${role}/subscriptionplan`)}
//           className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
//         >
//           <FiArrowLeft /> Back
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-8">
//         {/* Name */}
//         <div>
//           <label className="block mb-2 text-gray-700 font-medium">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={values.name}
//             onChange={handleChange}
//             placeholder="Enter plan name"
//             className="w-full border border-gray-300 rounded-md px-4 py-2"
//           />
//           {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
//         </div>

//         {/* Description */}
//         <div>
//           <label className="block mb-2 text-gray-700 font-medium">
//             Description
//           </label>
//           <textarea
//             name="description"
//             value={values.description}
//             onChange={handleChange}
//             rows={3}
//             placeholder="Enter plan description"
//             className="w-full border border-gray-300 rounded-md px-4 py-2"
//           />
//           {errors.description && (
//             <p className="text-red-500 text-sm">{errors.description}</p>
//           )}
//         </div>

//         {/* Price & Duration */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div>
//             <label className="block mb-2 text-gray-700 font-medium">
//               Price (₹)
//             </label>
//             <input
//               type="number"
//               name="price"
//               value={values.price}
//               onChange={handleChange}
//               min={0}
//               className="w-full border border-gray-300 rounded-md px-4 py-2"
//             />
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-700 font-medium">
//               Duration
//             </label>
//             <div className="flex gap-3">
//               <input
//                 type="number"
//                 name="duration_value"
//                 value={values.duration_value}
//                 onChange={handleChange}
//                 min={1}
//                 className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
//               />
//               <select
//                 name="duration_unit"
//                 value={values.duration_unit}
//                 onChange={handleChange}
//                 className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
//               >
//                 <option value="day">Day</option>
//                 <option value="month">Month</option>
//                 <option value="year">Year</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Active Toggle */}
//         <div>
//           <label className="flex items-center gap-3 text-gray-700 font-medium">
//             <input
//               type="checkbox"
//               name="is_active"
//               checked={values.is_active}
//               onChange={handleChange}
//               className="w-5 h-5"
//             />
//             Active Plan
//           </label>
//         </div>

//         {/* Features */}
//         <div>
//           <label className="block mb-3 text-gray-700 font-medium">
//             Features
//           </label>
//           <RichTextField
//             value={values.features[0] || ""}
//             onChange={(value) =>
//               setValues((prev) => ({ ...prev, features: [value] }))
//             }
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
//           <button
//             type="button"
//             onClick={resetForm}
//             className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2.5 rounded-md"
//           >
//             <FiRefreshCw /> Reset
//           </button>

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md"
//           >
//             <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }


// AddSubscriptionPlan.tsx
"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSave, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import { RichTextField } from "../components/PagesComponent/RichTextField";

// Form Interface
interface SubscriptionPlanForm {
  name: string;
  description: string;
  price: number;
  duration_value: number;
  duration_unit: "day" | "month" | "year";
  features: string[];
  is_active: boolean;
}

// API Response Interface
interface ApiResponse<T> {
  message?: string;
  data?: any;
  plan?: any;
  [key: string]: any;
}

export default function AddSubscriptionPlan() {
  const { id, role } = useParams();
  const navigate = useNavigate();

  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "subscription-plan",
  });

  const [values, setValues] = useState<SubscriptionPlanForm>({
    name: "",
    description: "",
    price: 0,
    duration_value: 1,
    duration_unit: "day",
    features: [""],
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract Plan (handles many API formats)
  const extractPlan = (res: any) => {
    if (!res) return null;
    return (
      res.data?.plan ||
      res.data?.data ||
      res.plan ||
      res.data ||
      res
    );
  };

  // Load data in Edit Mode
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res: ApiResponse<any> = await getOne(id);
        const plan = extractPlan(res);

        if (!plan) {
          toast.error("Subscription plan not found");
          return;
        }

        setValues({
          name: plan.name ?? "",
          description: plan.description ?? "",
          price: plan.price ?? 0,
          duration_value: plan.duration?.value ?? 1,
          duration_unit: plan.duration?.unit ?? "day",
          features: Array.isArray(plan.features) ? plan.features : [""],
          is_active: plan.is_active ?? true,
        });
      } catch (error) {
        toast.error("Failed to load subscription plan");
      }
    })();
  }, [id]);

  // Handle Change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    const checked = type === "checkbox" ? target.checked : undefined;

    setValues((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price" || name === "duration_value"
          ? Number(value)
          : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Reset Form
  const resetForm = () => {
    setValues({
      name: "",
      description: "",
      price: 0,
      duration_value: 1,
      duration_unit: "day",
      features: [""],
      is_active: true,
    });
    setErrors({});
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!values.name.trim()) newErrors.name = "Name is required";
    if (!values.description.trim())
      newErrors.description = "Description is required";
    if (values.duration_value <= 0)
      newErrors.duration_value = "Duration must be at least 1";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        price: values.price,
        currency: "INR",
        duration: {
          value: values.duration_value,
          unit: values.duration_unit,
        },
        features: values.features.filter((f) => f.trim() !== ""),
        is_active: values.is_active,
      };

      // 🌟 FIX — SEND JSON NOT FORMDATA
      if (id) {
        await updateRecord(id, payload);
        toast.success("Subscription plan updated successfully");
      } else {
        await createRecord(payload);
        toast.success("Subscription plan created successfully");
      }

      navigate(`/${role}/subscriptionplan`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to save subscription plan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit Subscription Plan" : "Add Subscription Plan"}
        </h2>

        <button
          onClick={() => navigate(`/${role}/subscriptionplan`)}
          className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name */}
        <div>
          <label className="block mb-2 text-gray-700 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Enter plan name"
            className="w-full border border-gray-300 rounded-md px-4 py-2"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Description
          </label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            placeholder="Enter plan description"
            className="w-full border border-gray-300 rounded-md px-4 py-2"
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>

        {/* Price & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Price (₹)
            </label>
            <input
              type="number"
              name="price"
              value={values.price}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Duration
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="duration_value"
                value={values.duration_value}
                onChange={handleChange}
                min={1}
                className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
              />
              <select
                name="duration_unit"
                value={values.duration_unit}
                onChange={handleChange}
                className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div>
          <label className="flex items-center gap-3 text-gray-700 font-medium">
            <input
              type="checkbox"
              name="is_active"
              checked={values.is_active}
              onChange={handleChange}
              className="w-5 h-5"
            />
            Active Plan
          </label>
        </div>

        {/* Features */}
        <div>
          <label className="block mb-3 text-gray-700 font-medium">
            Features
          </label>
          <RichTextField
            value={values.features[0] || ""}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, features: [value] }))
            }
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2.5 rounded-md"
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
