

"use client";

import React, { useState, useEffect } from "react";
import { FiLock, FiSave, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import { useApiPost } from "@/hooks/useApiPost";
import { toast } from "react-hot-toast";

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched] = useState<{
    currentPassword: boolean;
    newPassword: boolean;
    confirmPassword: boolean;
  }>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const { postData, loading, error, success } = useApiPost<{
    oldPassword: string;
    newPassword: string;
  }>();

  // Password strength validation
  const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
      return "Must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Must contain at least one uppercase letter";
    }
    if (!/\d/.test(password)) {
      return "Must contain at least one number";
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "Must contain at least one special character (!@#$%^&*)";
    }
    return null;
  };

  // Real-time validation
  useEffect(() => {
    const newErrors: typeof errors = {};

    // Validate current password only when touched
    if (touched.currentPassword) {
      if (!currentPassword.trim()) {
        newErrors.currentPassword = "Current password is required";
      }
    }

    // Validate new password only when touched
    if (touched.newPassword) {
      if (!newPassword.trim()) {
        newErrors.newPassword = "New password is required";
      } else {
        const strengthError = validatePasswordStrength(newPassword);
        if (strengthError) {
          newErrors.newPassword = strengthError;
        }
      }
    }

    // Validate confirm password only when touched
    if (touched.confirmPassword) {
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
  }, [currentPassword, newPassword, confirmPassword, touched]);

  useEffect(() => {
    if (success) {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
      setErrors({});
    }

    // Note: We're NOT using toast for errors anymore
    // Errors will be shown inline in the form
  }, [success]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show all errors
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    // Validate all fields
    const validationErrors: typeof errors = {};

    if (!currentPassword.trim()) {
      validationErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      validationErrors.newPassword = "New password is required";
    } else {
      const strengthError = validatePasswordStrength(newPassword);
      if (strengthError) {
        validationErrors.newPassword = strengthError;
      }
    }

    if (!confirmPassword.trim()) {
      validationErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // If all validations pass, submit
    await postData("/api/auth/user/change-password", {
      oldPassword: currentPassword,
      newPassword: newPassword,
    });
  };

  // Helper function to get input border class
  const getInputBorderClass = (fieldName: keyof typeof errors) => {
    if (errors[fieldName]) {
      return "border-red-500 focus:ring-red-500 focus:border-red-500";
    }
    return "border-[#E8E8E8] focus:ring-2 focus:ring-[#043F79] focus:border-[#043F79]";
  };

  // Check if form has any errors
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="bg-[#F7F9FC]">
      <div className="max-w-[1300px] mx-auto px-4 pt-6 pb-3 flex gap-6">
        <main className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-5">
            <FiLock className="text-[#043F79]" />
            <h1 className="text-[18px] font-semibold text-gray-800">
              Change Password
            </h1>
          </div>

          {/* Card */}
          <div className="bg-white max-w-[600px] rounded-xl border border-gray-200 p-6 mb-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-[15px] leading-[26px] mb-1">
                  Current password<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onBlur={() => handleBlur("currentPassword")}
                    className={`w-full h-[40px] border rounded px-3 pr-10 text-[14px]
                               focus:outline-none transition-colors ${getInputBorderClass(
                                 "currentPassword",
                               )}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showCurrent ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && touched.currentPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    <FiAlertCircle className="text-red-500 text-sm" />
                    <p className="text-red-500 text-xs">
                      {errors.currentPassword}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[15px] leading-[26px] mb-1">
                  New password<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => handleBlur("newPassword")}
                    className={`w-full h-[40px] border rounded px-3 pr-10 text-[14px]
                               focus:outline-none transition-colors ${getInputBorderClass(
                                 "newPassword",
                               )}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.newPassword && touched.newPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    <FiAlertCircle className="text-red-500 text-sm" />
                    <p className="text-red-500 text-xs">{errors.newPassword}</p>
                  </div>
                )}
                {/* Password strength hint */}
                {newPassword && !errors.newPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-green-600 text-xs">
                      ✓ Password meets requirements
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[15px] leading-[26px] mb-1">
                  Confirm password<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={`w-full h-[40px] border rounded px-3 pr-10 text-[14px]
                               focus:outline-none transition-colors ${getInputBorderClass(
                                 "confirmPassword",
                               )}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    <FiAlertCircle className="text-red-500 text-sm" />
                    <p className="text-red-500 text-xs">
                      {errors.confirmPassword}
                    </p>
                  </div>
                )}
                {/* Password match indicator */}
                {confirmPassword &&
                  !errors.confirmPassword &&
                  newPassword === confirmPassword && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="text-green-600 text-xs">
                        ✓ Passwords match
                      </p>
                    </div>
                  )}
              </div>

              {/* Server Error Display */}
              {error && !loading && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="text-red-500" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center gap-2 text-white
                             text-[14px] font-semibold px-6 py-[10px] rounded
                             transition-colors ${
                               loading
                                 ? "bg-gray-400 cursor-not-allowed"
                                 : "bg-[#043F79] hover:bg-[#002b6d]"
                             }`}
                >
                  {loading ? "SAVING..." : "SAVE"}
                </button>

                <p className="text-gray-500 text-xs mt-2">
                  Note: Password must be at least 8 characters with uppercase,
                  number & special character
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
