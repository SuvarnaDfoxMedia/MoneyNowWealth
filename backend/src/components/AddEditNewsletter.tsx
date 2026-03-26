
// import React, {
//   useEffect,
//   useState,
//   ChangeEvent,
//   FormEvent,
//   useRef,
// } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   FiSave,
//   FiRefreshCw,
//   FiArrowLeft,
//   FiUpload,
//   FiCalendar,
//   FiFileText,
//   FiX,
// } from "react-icons/fi";
// import { toast } from "react-hot-toast";
// import useCommonCrud from "../hooks/useCommonCrud";
// import { RichTextField } from "./PagesComponent/RichTextField";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

//   // Extract newsletter data from API response
//   const extractNewsletter = (res: any) => {
//     if (!res) return null;
//     return (
//       res.data?.newsletter ||
//       res.data?.data ||
//       res.newsletter ||
//       res.data ||
//       res
//     );
//   };

"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiSave,
  FiRefreshCw,
  FiArrowLeft,
  FiUpload,
  FiCalendar,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import useCommonCrud from "../hooks/useCommonCrud";
import { RichTextField } from "./PagesComponent/RichTextField";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getTodayAtMidnight, isPastDate } from "../utils/dateValidation";

type NewsletterType = "daily" | "weekly" | "monthly";

interface NewsletterForm {
  title: string;
  description: string;
  publish_date: Date | null;
  status: "draft" | "scheduled" | "published";
  newsletter_file: File | null;
  frequency: NewsletterType;
}

export default function AddEditNewsletter() {
  const { id, role } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the same hook for CRUD operations
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "newsletter-publications",
  });

  const [values, setValues] = useState<NewsletterForm>({
    title: "",
    description: "",
    publish_date: new Date(),
    status: "draft",
    newsletter_file: null,
    frequency: "daily",
  });

  const [existingFile, setExistingFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract newsletter data from API response
  const extractNewsletter = (res: any) => {
    if (!res) return null;
    return (
      res.data?.newsletter ||
      res.data?.data ||
      res.newsletter ||
      res.data ||
      res
    );
  };

  // Load data in Edit Mode
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await getOne(id);
        const newsletter = extractNewsletter(res);

        if (!newsletter) {
          toast.error("Newsletter not found");
          return;
        }

        setValues((prev) => ({
          ...prev,
          title: newsletter.title ?? "",
          description: newsletter.description ?? "",
          publish_date: newsletter.publish_date
            ? new Date(newsletter.publish_date)
            : new Date(),
          status: newsletter.status ?? "draft",
          newsletter_file: null,
          frequency: newsletter.frequency ?? "daily",
        }));

        if (newsletter.pdf_file) {
          setExistingFile(newsletter.pdf_file);
        }
      } catch (error: any) {
        toast.error(error?.message || "Failed to load newsletter");
        console.error("Error loading newsletter:", error);
      }
    })();
  }, [id]);

  // Handle Change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle File Change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
    }

    setValues((prev) => ({
      ...prev,
      newsletter_file: file,
    }));

    setErrors((prev) => ({ ...prev, newsletter_file: "" }));
  };

  // Handle Choose File button click
  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Rich Text Editor Change
  const handleDescriptionChange = (value: string) => {
    setValues((prev) => ({
      ...prev,
      description: value,
    }));
  };

  // Reset Form
  const resetForm = () => {
    setValues({
      title: "",
      description: "",
      publish_date: new Date(),
      status: "draft",
      newsletter_file: null,
      frequency: "daily",
    });
    setExistingFile(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toUpperCase() || "";
  };

  // Validate Form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (values.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!values.newsletter_file && !existingFile && !id) {
      newErrors.newsletter_file = "Newsletter file is required";
    }

    if (!values.publish_date) {
      newErrors.publish_date = "Publish date is required";
    }

    // Validate publish date is not in the past for scheduled/published
    if (
      values.publish_date &&
      (values.status === "scheduled" || values.status === "published") &&
      isPastDate(values.publish_date)
    ) {
      newErrors.publish_date =
        "Publish date cannot be in the past for scheduled/published newsletters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler - Fixed response handling
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Prepare FormData
      const formData = new FormData();
      formData.append("title", values.title.trim());
      formData.append("description", values.description.trim());

      // Format date to ISO string
      const publishDateStr = values.publish_date
        ? values.publish_date.toISOString()
        : new Date().toISOString();
      formData.append("publish_date", publishDateStr);

      formData.append("status", values.status);
      formData.append("frequency", values.frequency);

      // Only append new file if uploaded
      if (values.newsletter_file) {
        formData.append("pdf_file", values.newsletter_file);
      }

      let result: any;

      if (id) {
        // Update existing newsletter
        result = await updateRecord(id, formData);
      } else {
        // Create new newsletter
        result = await createRecord(formData);
      }

      const isSuccess =
        result?.success || result?.data?.success || result?.newsletter;

      if (isSuccess) {
        // Navigate back to list page after successful save
        setTimeout(() => {
          navigate(`/${role}/list-newsletter`);
        }, 1000);
      } else {
        // Show error from response
        const errorMessage =
          result?.message ||
          result?.data?.message ||
          "Failed to save newsletter";
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error("Submission error:", err);

      // Handle specific error cases
      if (err.message?.includes("E11000 duplicate key error")) {
        toast.error("Duplicate issue number error. Please try again.");
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err?.message || "Failed to save newsletter");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full h-11 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-[#043f79]">
          {id ? "Edit Newsletter" : "Add Newsletter"}
        </h2>

        <button
          onClick={() => navigate(`/${role}/list-newsletter`)}
          className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Title */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Newsletter Title *
            </label>
            <input
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange}
              placeholder="Enter newsletter title"
              className={inputClass}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Publish Date */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Publish Date *
            </label>
            <div className="relative">
              <DatePicker
                selected={values.publish_date}
                onChange={(date) =>
                  setValues((prev) => ({ ...prev, publish_date: date }))
                }
                minDate={getTodayAtMidnight()}
                dateFormat="dd/MM/yyyy"
                className={`${inputClass} pr-16`}
                placeholderText="DD/MM/YYYY"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {errors.publish_date && (
              <p className="text-red-500 text-sm mt-1">{errors.publish_date}</p>
            )}
          </div>

          {/* Newsletter Type */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Newsletter Type *
            </label>
            <select
              name="frequency"
              value={values.frequency}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Used for admin reference
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Status
            </label>
            <select
              name="status"
              value={values.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>

            <p className="text-sm text-gray-500 mt-1">
              {values.status === "draft" && "Not visible to subscribers"}
              {values.status === "scheduled" &&
                "Will be published on the selected date"}
              {values.status === "published" &&
                "Immediately visible to subscribers and emails will be sent automatically"}
            </p>
          </div>

          {/* Newsletter File Upload */}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Newsletter File *
            </label>

            <div className="space-y-3">
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
              />

              <div className="flex items-center gap-3">
                {values.newsletter_file || existingFile ? (
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiFileText
                        className="text-blue-600 flex-shrink-0"
                        size={20}
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {values.newsletter_file
                            ? values.newsletter_file.name
                            : existingFile || "No file chosen"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {values.newsletter_file
                            ? `${getFileExtension(values.newsletter_file.name)} - ${formatFileSize(values.newsletter_file.size)}`
                            : existingFile
                              ? `Existing file - ${getFileExtension(existingFile)}`
                              : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {existingFile && !values.newsletter_file && (
                        <button
                          type="button"
                          onClick={handleChooseFile}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Replace
                        </button>
                      )}

                      {values.newsletter_file && (
                        <button
                          type="button"
                          onClick={() => {
                            setValues((prev) => ({
                              ...prev,
                              newsletter_file: null,
                            }));
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove file"
                        >
                          <FiX size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No file selected</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleChooseFile}
                  className="bg-[#043f79] text-white px-4 py-2.5 rounded-md hover:bg-[#0654a4] transition flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <FiUpload size={18} />
                  Browse
                </button>
              </div>

              {errors.newsletter_file && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.newsletter_file}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Description
          </label>
          <RichTextField
            value={values.description}
            onChange={handleDescriptionChange}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
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
            className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md hover:bg-[#0654a4] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave />
            {isSubmitting ? "Saving..." : id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
