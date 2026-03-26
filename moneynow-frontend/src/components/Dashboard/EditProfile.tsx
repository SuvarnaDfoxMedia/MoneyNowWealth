"use client";

import { useState, useEffect, useRef } from "react";
import { FiCamera, FiX } from "react-icons/fi";
import intlTelInput from "intl-tel-input";
import type { IntlTelInputInstance } from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { useProfileStore } from "@/stores/profileStore";
import { API } from "@/app/api/axios";
import { toast } from "react-hot-toast";

interface EditProfileProps {
  profile: {
    id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    address?: string;
    countryCode?: string;
    profileImage?: string;
  } | null;
  onClose: () => void;
  onSave?: (formData: FormData) => Promise<any>;
}

type ApiFieldError = { param: string; msg: string };
type ApiErrorResponse = {
  errors?: ApiFieldError[];
  message?: string;
};
type ApiError = {
  response?: {
    data?: ApiErrorResponse;
  };
};

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export default function EditProfile({
  profile,
  onClose,
  onSave,
}: EditProfileProps) {
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<IntlTelInputInstance | null>(null);
  const phoneContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    address: "",
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Zustand setters
  const setProfile = useProfileStore((state) => state.setProfile);
  const setProfileImageUrl = useProfileStore(
    (state) => state.setProfileImageUrl,
  );

  const getFullImageUrl = (imgPath?: string) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }

    const normalized = imgPath.replace(/\\/g, "/").replace(/^\/+/, "");

    if (normalized.startsWith("uploads/profiles/")) {
      const fileName = normalized.replace("uploads/profiles/", "");
      return `${IMAGE_BASE_URL}/profiles/${fileName}?v=${Date.now()}`;
    }

    if (normalized.startsWith("profiles/")) {
      const fileName = normalized.replace("profiles/", "");
      return `${IMAGE_BASE_URL}/profiles/${fileName}?v=${Date.now()}`;
    }

    return `${IMAGE_BASE_URL}/profiles/${normalized}?v=${Date.now()}`;
  };

  // ---------------- PREFILL DATA ----------------
  useEffect(() => {
    if (!profile) return;

    setFormData({
      firstname: profile.firstname ?? "",
      lastname: profile.lastname ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    });
    setCountryCode(profile.countryCode ?? "+91");
    setImagePreview(getFullImageUrl(profile.profileImage));
  }, [profile]);

  // ---------------- intl-tel-input ----------------
  useEffect(() => {
    if (!phoneRef.current || !phoneContainerRef.current) return;
    if (isInitializedRef.current) return;

    if (itiRef.current) {
      itiRef.current.destroy();
      itiRef.current = null;
    }

    // Initialize intl-tel-input
    itiRef.current = intlTelInput(phoneRef.current, {
      separateDialCode: true,
      initialCountry: "in",
      utilsScript:
        "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
      customContainer: "w-full",
    });

    isInitializedRef.current = true;

    // Set initial phone number after initialization
    if (profile?.phone) {
      setTimeout(() => {
        if (itiRef.current) {
          const phoneNumber = profile.phone ?? "";
          const code = profile.countryCode || "+91";

          // Format the full number
          let fullNumber = phoneNumber;
          if (!phoneNumber.startsWith("+")) {
            fullNumber = `${code}${phoneNumber}`;
          }

          itiRef.current.setNumber(fullNumber);

          // Update the phone value in formData
          setFormData((prev) => ({
            ...prev,
            phone: phoneNumber,
          }));
        }
      }, 100);
    }

    const handlePhoneChange = () => {
      if (!itiRef.current) return;

      const country = itiRef.current.getSelectedCountryData();
      const dialCode = `+${country.dialCode}`;
      setCountryCode(dialCode);

      // Get the national number (without country code)
      let nationalNumber = "";
      try {
        const fullNumber = itiRef.current.getNumber();
        if (fullNumber && country.dialCode) {
          // Remove the country code from the full number
          nationalNumber = fullNumber
            .replace(`+${country.dialCode}`, "")
            .trim();
          // Remove any non-digit characters except maybe for some formats
          nationalNumber = nationalNumber.replace(/\D/g, "");
        }
      } catch (error) {
        console.error("Error parsing phone number:", error);
        nationalNumber = formData.phone;
      }

      // Only update if we have a valid number
      if (nationalNumber) {
        setFormData((prev) => ({
          ...prev,
          phone: nationalNumber,
        }));
      }

      // Clear phone error when user types
      if (errors.phone) {
        setErrors((prev) => {
          const nextErrors = { ...prev };
          delete nextErrors.phone;
          return nextErrors;
        });
      }
    };

    phoneRef.current.addEventListener("input", handlePhoneChange);
    phoneRef.current.addEventListener("countrychange", handlePhoneChange);

    return () => {
      phoneRef.current?.removeEventListener("input", handlePhoneChange);
      phoneRef.current?.removeEventListener("countrychange", handlePhoneChange);
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [profile?.phone, profile?.countryCode]);

  // ---------------- IMAGE CHANGE ----------------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setProfileImage(file);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ---------------- RESET FORM ----------------
  const handleReset = () => {
    if (!profile) return;
    setFormData({
      firstname: profile.firstname ?? "",
      lastname: profile.lastname ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    });
    setCountryCode(profile.countryCode ?? "+91");
    setProfileImage(null);
    setImagePreview(getFullImageUrl(profile.profileImage));

    if (itiRef.current && profile.phone) {
      const fullNumber = `${profile.countryCode || "+91"}${profile.phone}`;
      itiRef.current.setNumber(fullNumber);
    }
    setErrors({});
  };

  // ---------------- VALIDATION ----------------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstname.trim()) newErrors.firstname = "First name required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name required";
    if (!formData.address.trim()) newErrors.address = "Address required";

    // Phone validation - only if the phone number is provided
    const phoneNumber = formData.phone.trim();

    // Check if phone is empty
    if (!phoneNumber) {
      newErrors.phone = "Phone number is required";
    }
    // Check if it's a valid phone number format (at least 5 digits)
    else if (phoneNumber.length < 5) {
      newErrors.phone = "Phone number must be at least 5 digits";
    }
    else if (!/^\d+$/.test(phoneNumber)) {
      newErrors.phone = "Phone number should contain only digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- SAVE PROFILE ----------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Get phone number - it should already be cleaned
      let phoneNumber = formData.phone.trim();

      phoneNumber = phoneNumber.replace(/\D/g, "");

      // --------- PREPARE FORM DATA ---------
      const data = new FormData();
      data.append("firstname", formData.firstname);
      data.append("lastname", formData.lastname);
      data.append("name", `${formData.firstname} ${formData.lastname}`);

      // IMPORTANT: Use "mobile" field name for backend
      data.append("mobile", phoneNumber);

      // Send COUNTRY CODE separately
      data.append("countryCode", countryCode);

      data.append("address", formData.address);
      if (profileImage) {
        data.append("profileImage", profileImage);
      }

      console.log("Updating profile with data:", {
        firstname: formData.firstname,
        lastname: formData.lastname,
        mobile: phoneNumber,
        countryCode,
        address: formData.address,
      });

      // Check if parent component provided onSave prop
      if (onSave) {
        const result = await onSave(data);

        if (result?.success) {
          onClose();
        } else if (result?.errors) {
          // Handle validation errors from parent
          const backendErrors: Record<string, string> = {};
          (result.errors as ApiFieldError[]).forEach((fieldError) => {
            backendErrors[fieldError.param] = fieldError.msg;
          });
          setErrors(backendErrors);
        } else if (result?.error) {
          setErrors({ general: result.error });
        }
        return;
      }

      // --------- SEND TO BACKEND DIRECTLY ---------
      const res = await API.put("/api/user/profile", data, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Update response:", res.data);

      // --------- HANDLE SUCCESS ---------
      if (res.data.success && res.data.data) {
        const updatedData = res.data.data;

        // Extract phone number from the response (check both mobile and phone fields)
        const updatedPhone =
          updatedData.mobile || updatedData.phone || phoneNumber;

        // Create updated profile object
        const updatedProfile = {
          id: updatedData.id || updatedData._id || profile?.id,
          firstname: updatedData.firstname || formData.firstname,
          lastname: updatedData.lastname || formData.lastname,
          name:
            updatedData.name ||
            `${formData.firstname} ${formData.lastname}`.trim(),
          email: updatedData.email || profile?.email || "",
          phone: updatedPhone,
          address: updatedData.address || formData.address,
          countryCode: updatedData.countryCode || countryCode,
          profileImage: updatedData.profileImage || profile?.profileImage,
        };

        console.log("Updated profile object:", updatedProfile);

        // UPDATE ZUSTAND STORE
        setProfile(updatedProfile);

        // Update profile image URL
        if (updatedData.profileImage) {
          const newImageUrl = getFullImageUrl(updatedData.profileImage);
          console.log("Setting new image URL:", newImageUrl);
          setProfileImageUrl(newImageUrl);
        }

        toast.success("Profile updated successfully");

        // Force a refresh of the profile data by triggering a refetch
        // This ensures the store gets the latest data
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        console.error("Unexpected response:", res.data);
        setErrors({ general: "Unexpected response from server" });
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error("Save failed:", err);

      if (apiError.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        apiError.response.data.errors.forEach((fieldError) => {
          backendErrors[fieldError.param] = fieldError.msg;
        });
        setErrors(backendErrors);
      } else if (apiError.response?.data?.message) {
        setErrors({ general: apiError.response.data.message });
      } else {
        setErrors({ general: "Failed to save profile. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
      errors[field]
        ? "border-red-500 ring-red-500"
        : "border-gray-300 ring-blue-500 dark:bg-gray-800"
    }`;

  // Special class for phone input to handle intl-tel-input styling
  const phoneInputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
    errors.phone
      ? "border-red-500 ring-red-500"
      : "border-gray-300 ring-blue-500 dark:bg-gray-800"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-[650px] rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg">
        <button onClick={onClose} className="absolute right-4 top-4">
          <FiX size={20} />
        </button>

        <form onSubmit={handleSave}>
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errors.general}
            </div>
          )}

          {/* IMAGE */}
          <div className="mb-6 flex justify-center">
            <div className="relative ml-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No Image
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 cursor-pointer bg-[#043F79] p-2 rounded-full shadow-md hover:bg-[#032f5c]">
                <FiCamera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* NAME */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                className={inputClass("firstname")}
              />
              {errors.firstname && (
                <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                value={formData.lastname}
                onChange={(e) =>
                  setFormData({ ...formData, lastname: e.target.value })
                }
                className={inputClass("lastname")}
              />
              {errors.lastname && (
                <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
              )}
            </div>
          </div>

          {/* EMAIL & PHONE */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                disabled
                value={profile?.email ?? ""}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              {/* Container for phone input with proper styling */}
              <div ref={phoneContainerRef} className="relative">
                <input
                  ref={phoneRef}
                  className={phoneInputClass}
                  type="tel"
                  style={{ paddingLeft: "46px" }} // Add padding for flag
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* ADDRESS */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className={inputClass("address")}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#043F79] text-white rounded-full hover:bg-[#032f5c] transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
