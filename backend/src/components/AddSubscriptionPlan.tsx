// "use client";

// import React, { useEffect, useState, ChangeEvent } from "react";
// import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// import { FiSave, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import { useCommonCrud } from "../hooks/useCommonCrud";
// import { RichTextField } from "./PagesComponent/RichTextField";

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

//   const extractPlan = (res: any) => {
//     if (!res) return null;
//     return res.data?.plan || res.data?.data || res.plan || res.data || res;
//   };

//   // Load data in Edit Mode
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
//         console.log(error);
//       }
//     })();
//   }, [id]);

//   // Handle Change
//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
//             ? Number(value)
//             : value,
//     }));

//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   // Reset Form
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

//   // Submit Handler
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

//       //  SEND JSON NOT FORMDATA
//       if (id) {
//         await updateRecord(id, payload);
//         toast.success("Subscription plan updated successfully");
//       } else {
//         await createRecord(payload);
//         toast.success("Subscription plan created successfully");
//       }

//       //  LIFO navigation - return to current page
//       navigate(`/${role}/subscriptionplan`);
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message || "Failed to save subscription plan",
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
//           //  LIFO back button navigation
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

"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FiSave, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";
import { RichTextField } from "./PagesComponent/RichTextField";

// Form Interface
interface SubscriptionPlanForm {
  name: string;
  plan_type: "Free" | "Premium"; // ADDED: plan_type field
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
    plan_type: "Free", // DEFAULT: Set to Free
    description: "",
    price: 0,
    duration_value: 1,
    duration_unit: "day",
    features: [""],
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractPlan = (res: any) => {
    if (!res) return null;
    return res.data?.plan || res.data?.data || res.plan || res.data || res;
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
          plan_type: plan.plan_type ?? "Free", // LOAD plan_type
          description: plan.description ?? "",
          price: plan.price ?? 0,
          duration_value: plan.duration?.value ?? 1,
          duration_unit: plan.duration?.unit ?? "day",
          features: Array.isArray(plan.features) ? plan.features : [""],
          is_active: plan.is_active ?? true,
        });
      } catch (error) {
        toast.error("Failed to load subscription plan");
        console.log(error);
      }
    })();
  }, [id]);

  // Handle Change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    const checked = type === "checkbox" ? target.checked : undefined;

    // Auto-set price to 0 when plan_type changes to Free
    if (name === "plan_type" && value === "Free") {
      setValues((prev) => ({
        ...prev,
        [name]: value as "Free" | "Premium",
        price: 0, // Force price to 0 for Free plans
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : name === "price" || name === "duration_value"
              ? Number(value)
              : value,
      }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle price change with validation
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);

    // Prevent negative prices
    if (value < 0) return;

    // If plan is Free, force price to 0
    if (values.plan_type === "Free") {
      setValues((prev) => ({ ...prev, price: 0 }));
      toast.error("Free plans must have price 0");
      return;
    }

    setValues((prev) => ({ ...prev, price: value }));
    setErrors((prev) => ({ ...prev, price: "" }));
  };

  // Reset Form
  const resetForm = () => {
    setValues({
      name: "",
      plan_type: "Free",
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

    // Validate Free plan price
    if (values.plan_type === "Free" && values.price !== 0) {
      newErrors.price = "Free plans must have price 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: values.name.trim(),
        plan_type: values.plan_type, // ADDED: Include plan_type
        description: values.description.trim(),
        price: values.plan_type === "Free" ? 0 : values.price, // Ensure Free plan price is 0
        currency: "INR",
        duration: {
          value: values.duration_value,
          unit: values.duration_unit,
        },
        features: values.features.filter((f) => f.trim() !== ""),
        is_active: values.is_active,
      };

      console.log("Submitting payload:", payload); // Debug log

      // SEND JSON NOT FORMDATA
      if (id) {
        await updateRecord(id, payload);
        toast.success("Subscription plan updated successfully");
      } else {
        await createRecord(payload);
        toast.success("Subscription plan created successfully");
      }

      // LIFO navigation - return to current page
      navigate(`/${role}/subscriptionplan`);
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save subscription plan",
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
        {/* Name & Plan Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Enter plan name (e.g., Free, Premium)"
              className={`w-full border rounded-md px-4 py-2 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* ADDED: Plan Type Field */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Plan Type *
            </label>
            <select
              name="plan_type"
              value={values.plan_type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            >
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Description *
          </label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            placeholder="Enter plan description"
            className={`w-full border rounded-md px-4 py-2 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Price & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={values.price}
              onChange={handlePriceChange}
              min={0}
              step="0.01"
              disabled={values.plan_type === "Free"}
              className={`w-full border rounded-md px-4 py-2 ${
                errors.price ? "border-red-500" : "border-gray-300"
              } ${values.plan_type === "Free" ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
            {values.plan_type === "Free" && (
              <p className="text-sm text-gray-500 mt-1">
                Free plans have price 0
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Duration *
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="duration_value"
                value={values.duration_value}
                onChange={handleChange}
                min={1}
                className={`w-1/2 border rounded-md px-4 py-2 ${
                  errors.duration_value ? "border-red-500" : "border-gray-300"
                }`}
              />
              <select
                name="duration_unit"
                value={values.duration_unit}
                onChange={handleChange}
                className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="day">Day(s)</option>
                <option value="month">Month(s)</option>
                <option value="year">Year(s)</option>
              </select>
            </div>
            {errors.duration_value && (
              <p className="text-red-500 text-sm mt-1">
                {errors.duration_value}
              </p>
            )}
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
          <p className="text-sm text-gray-500 mt-2">
            Add features separated by commas or new lines
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-300 transition"
          >
            <FiRefreshCw /> Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md hover:bg-[#0654a4] transition disabled:opacity-50"
          >
            <FiSave /> {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
