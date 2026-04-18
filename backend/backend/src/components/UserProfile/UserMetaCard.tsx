

"use client";

import { useState, useEffect, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/useAuth";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";

interface FormData {
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  countryCode?: string;
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, refreshUser } = useAuth();

  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<any>(null);

  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",
    phone: "",
    address: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formRef, scrollToFirstError } = useScrollToFirstError();

  const backendUrl = import.meta.env.VITE_API_BASE;
  const imageUrl = backendUrl.replace("/api", "");

  // Initialize formData and image preview when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setImagePreview(
        user.profileImage
          ? `${imageUrl}${user.profileImage}?v=${Date.now()}`
          : null,
      );
    }
  }, [user]);

  // Reset form and phone input
  const resetForm = () => {
    if (user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setProfileImage(null);
      setImagePreview(
        user.profileImage
          ? `${imageUrl}${user.profileImage}?v=${Date.now()}`
          : null,
      );

      // Reset phone input with full international number
      if (itiRef.current && user.phone && user.countryCode) {
        const allCountries = itiRef.current.getCountryData?.() || [];
        const dialCode = user.countryCode.replace("+", "");
        const matchedCountry = allCountries.find(
          (c: any) => c.dialCode === dialCode,
        );
        if (matchedCountry) itiRef.current.setCountry(matchedCountry.iso2);

        // Set full number with country code prefix
        const fullNumber = user.countryCode + user.phone;
        itiRef.current.setNumber(fullNumber);
      }
    }
  };

  // Initialize intl-tel-input when modal opens
  useEffect(() => {
    if (isOpen && phoneRef.current) {
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }

itiRef.current = intlTelInput(phoneRef.current, {
        separateDialCode: true,
        initialCountry: "auto",
      } as any);

      // load utils manually
      itiRef.current.promise?.then(() => {
        // utils loaded
      });

      setTimeout(() => {
        if (!itiRef.current || !user) return;

        const allCountries = itiRef.current.getCountryData?.() || [];

        console.log(" Current user countryCode:", user.countryCode);

        // Set user's country
        if (user.countryCode && user.countryCode.trim() !== "") {
          const dialCode = user.countryCode.replace("+", "");
          const matchedCountry = allCountries.find(
            (c: any) => c.dialCode === dialCode,
          );
          if (matchedCountry) {
            itiRef.current.setCountry(matchedCountry.iso2);
            console.log(" Set country to:", matchedCountry.iso2);
          } else {
            console.log(" Country code not found:", user.countryCode);
            // Fallback to India if no match found
            itiRef.current.setCountry("in");
            console.log(" Fallback to India");
          }
        } else {
          console.log(" No countryCode, fallback to India");
          itiRef.current.setCountry("in");
        }

        // Set full number with country code prefix
        if (user.phone) {
          let fullNumber;
          if (user.phone.startsWith("+")) {
            fullNumber = user.phone;
          } else {
            fullNumber = (user.countryCode || "+91") + user.phone;
          }
          itiRef.current.setNumber(fullNumber);
          console.log(" Set phone number:", fullNumber);
        }

        // Sync to formData
        setFormData((prev) => ({
          ...prev,
          phone: itiRef.current.getNumber(),
        }));
      }, 100);

      // Sync formData on input/country change
      const onInputChange = () => {
        if (!itiRef.current) return;
        setFormData((prev) => ({
          ...prev,
          phone: itiRef.current.getNumber(),
        }));
      };

      phoneRef.current.addEventListener("input", onInputChange);
      phoneRef.current.addEventListener("countrychange", onInputChange);

      return () => {
        phoneRef.current?.removeEventListener("input", onInputChange);
        phoneRef.current?.removeEventListener("countrychange", onInputChange);
      };
    }
  }, [isOpen, user]);

  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, profileImage: "" }));
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          profileImage: "Only image files are allowed!",
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profileImage: "File size cannot exceed 5MB!",
        }));
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.firstname.trim())
      newErrors.firstname = "First Name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last Name is required";

    let phone = "";
    let country_code = "+91";
    if (itiRef.current) {
      const countryData = itiRef.current.getSelectedCountryData();
      country_code = `+${countryData.dialCode}`;
      phone = phoneRef.current?.value.trim() || "";
    }

    if (!phone) newErrors.phone = "Phone is required";
    if (phone && phone.length < 6) newErrors.phone = "Invalid phone number";

    if (!formData.address.trim()) newErrors.address = "Address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstError(newErrors);
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("name", `${formData.firstname} ${formData.lastname}`);
      submitData.append("mobile", phone);
      submitData.append("countryCode", country_code);
      submitData.append("address", formData.address);
      if (profileImage) submitData.append("profileImage", profileImage);

      const res = await axios.put(`${backendUrl}/admin/profile`, submitData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();

      if (profileImage && res.data.user.profileImage) {
        setImagePreview(
          `${imageUrl}${res.data.user.profileImage}?v=${Date.now()}`,
        );
      }

      closeModal();

      // Show success toast after modal closes
      setTimeout(() => {
        // Create custom toast that renders to document body
        const customToast = document.createElement("div");
        customToast.innerHTML = " Profile Updated Successfully!";
        customToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffffff;
        color: #10b981; /* text color */
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 999999;
        font-size: 16px;
        font-weight: 500;
        box-shadow: 0 4px 6px hsla(155, 53%, 14%, 0.07);
        animation: slideIn 0.3s ease-out;
      `;

        document.body.appendChild(customToast);

        // Remove after 4 seconds
        setTimeout(() => {
          if (customToast.parentNode) {
            customToast.parentNode.removeChild(customToast);
          }
        }, 4000);

        // Also try standard toast
        toast.success("Profile Updated Successfully!", {
          duration: 4000,
          position: "top-right",
        });
      }, 100);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        err.response.data.errors.forEach((e: any) => {
          if (e.param === "name") {
            fieldErrors.firstname = e.msg;
            fieldErrors.lastname = e.msg;
          }
          if (e.param === "phone" || e.param === "mobile")
            fieldErrors.phone = e.msg;
          if (e.param === "address") fieldErrors.address = e.msg;
        });
        setErrors(fieldErrors);
        scrollToFirstError(fieldErrors);
      } else if (err.response?.data?.message) {
        // Map backend errors to fields (NO TOAST for validation errors)
        const errorMsg = err.response.data.message.toLowerCase();

        if (
          errorMsg.includes("name") ||
          errorMsg.includes("firstname") ||
          errorMsg.includes("lastname")
        ) {
          const nextErrors = { firstname: err.response.data.message };
          setErrors(nextErrors);
          scrollToFirstError(nextErrors);
        } else if (errorMsg.includes("phone")) {
          const nextErrors = { phone: err.response.data.message };
          setErrors(nextErrors);
          scrollToFirstError(nextErrors);
        } else if (errorMsg.includes("address")) {
          const nextErrors = { address: err.response.data.message };
          setErrors(nextErrors);
          scrollToFirstError(nextErrors);
        } else {
          // For any other validation-related errors, don't show toast
          const nextErrors = { address: err.response.data.message };
          setErrors(nextErrors);
          scrollToFirstError(nextErrors);
        }

        // Only show toast for genuine server/network errors (not validation)
        const isValidationError =
          errorMsg.includes("invalid") ||
          errorMsg.includes("required") ||
          errorMsg.includes("already") ||
          errorMsg.includes("exists");

        if (!isValidationError) {
          toast.error("Server error. Please try again.");
        }
      } else {
        toast.error("Failed to update profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
      errors[field]
        ? "border-red-500 ring-red-500 dark:border-red-500"
        : "border-gray-300 dark:border-gray-700 ring-blue-500 dark:bg-gray-800"
    }`;

  return (
    <>
      {/* User Card */}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={imagePreview || "/images/user/owner.jpg"}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            </div>

            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {`${formData.firstname} ${formData.lastname}`}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {formData.phone && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.phone}
                    </p>
                  </>
                )}
                {formData.address && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.address}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[650px] m-2">
        <div className="relative w-full max-w-[650px] overflow-y-auto rounded-xl bg-white p-4 dark:bg-gray-900 lg:p-6">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className=" text-sm text-gray-500 dark:text-gray-400 ">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSave} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              {/* Profile Image */}
              <div className="mt-4">
                <h5 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-2">
                  Profile Image
                </h5>
                <div className="flex items-center gap-6 mb-2">
                  <div className="relative w-[100px] h-[100px] border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-gray-400 text-center text-sm">
                        No image selected
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="profileImage">Upload New Image</Label>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={inputClass("profileImage")}
                    />
                    {errors.profileImage && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.profileImage}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG or GIF (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="mt-4">
                <h5 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-2">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label htmlFor="firstname">First Name</Label>
                    <Input
                      id="firstname"
                      name="firstname"
                      type="text"
                      value={formData.firstname}
                      onChange={(e) =>
                        setFormData({ ...formData, firstname: e.target.value })
                      }
                      placeholder="Enter your first name"
                      className={inputClass("firstname")}
                    />
                    {errors.firstname && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstname}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastname">Last Name</Label>
                    <Input
                      id="lastname"
                      name="lastname"
                      type="text"
                      value={formData.lastname}
                      onChange={(e) =>
                        setFormData({ ...formData, lastname: e.target.value })
                      }
                      placeholder="Enter your last name"
                      className={inputClass("lastname")}
                    />
                    {errors.lastname && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastname}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="lg:col-span-2 relative">
                    <Label htmlFor="phone">Phone</Label>
                    <input
                      ref={phoneRef}
                      type="tel"
                      id="phone"
                      placeholder="Enter your phone number"
                      className={`w-full pl-14 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.phone
                          ? "border-red-500 ring-red-500"
                          : "border-gray-300 ring-blue-500"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Enter your address"
                      rows={3}
                      className={inputClass("address")}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button type="button" onClick={resetForm} disabled={loading}>
                Reset
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
