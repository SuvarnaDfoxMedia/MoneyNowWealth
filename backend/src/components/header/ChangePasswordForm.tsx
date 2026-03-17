import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import toast from "react-hot-toast";
import { axiosApi } from "../../api/axios"; // centralized axios instance
import { useAuth } from "../../context/useAuth";

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refreshUser } = useAuth(); // refresh user after password change

  // ---------------- Password Strength ----------------
  const getPasswordStrength = (password: string) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\W])/.test(password))
      return "Strong";
    if (/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/.test(password)) return "Medium";
    return "Weak";
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const passwordStrengthColor = () => {
    switch (passwordStrength) {
      case "Strong":
        return "text-green-600";
      case "Medium":
        return "text-yellow-600";
      case "Weak":
        return "text-red-600";
      default:
        return "";
    }
  };

  // ---------------- Validation ----------------
  const validateFields = () => {
    const newErrors: typeof errors = {};

    if (!oldPassword.trim())
      newErrors.oldPassword = "Old password is required.";
    if (!newPassword.trim())
      newErrors.newPassword = "New password is required.";
    else if (passwordStrength === "Weak")
      newErrors.newPassword =
        "Password is too weak (uppercase, lowercase, numbers, special char required).";

    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Confirm password is required.";
    else if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Handle Submit ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setErrors({});

    if (!validateFields()) return;

    setLoading(true);


    try {
      const res = await axiosApi.post<{ message: string }>(
        "/auth/change-password",
        {
          oldPassword,
          newPassword,
        },
      );

      //  FIX: Handle direct response vs Axios wrapped response
      let message: string;
      if (typeof res === "object" && res !== null && "data" in res) {
        // Axios wrapped response
        message =
          res.data?.message || res.message || "Password changed successfully!";
      } else {
        // Direct response
        message =
          (res as { message?: string })?.message ||
          "Password changed successfully!";
      }

      // Create custom toast that renders to document body
      const customToast = document.createElement("div");
      customToast.innerHTML = ` ${message}`;
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
      toast.success(message, {
        duration: 4000,
        position: "top-right",
      });

      // Clear form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched(false);

      // Refresh user data
      await refreshUser();

      setTimeout(() => navigate(-1), 3000); // Increased to 3 seconds
    } catch (err: unknown) {

      //  FIX: Handle different error formats
      const error = err as {
        response?: { data?: { message?: string } | string };
        message?: string;
      };
      const backendMsg =
        (typeof error.response?.data === "object"
          ? error.response?.data?.message
          : undefined) ||
        error.message ||
        (typeof error.response?.data === "string"
          ? error.response?.data
          : undefined) ||
        "Something went wrong";

      // Map backend errors to fields (NO TOAST for validation errors)
      const errorMsg = backendMsg.toLowerCase();

      if (errorMsg.includes("old password") || errorMsg.includes("incorrect")) {
        setErrors({ oldPassword: backendMsg });
      } else if (
        errorMsg.includes("new password") ||
        errorMsg.includes("weak")
      ) {
        setErrors({ newPassword: backendMsg });
      } else if (errorMsg.includes("confirm") || errorMsg.includes("match")) {
        setErrors({ confirmPassword: backendMsg });
      } else {
        // For any other validation-related errors, don't show toast
        setErrors({ confirmPassword: backendMsg });
      }

      // Only show toast for genuine server/network errors (not validation)
      const isValidationError =
        errorMsg.includes("password") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("required") ||
        errorMsg.includes("incorrect") ||
        errorMsg.includes("weak") ||
        errorMsg.includes("match") ||
        errorMsg.includes("confirm");

      if (!isValidationError) {
        toast.error("Server error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const glowIfEmpty = (value: string, error?: string) =>
    touched && !value.trim() && !error ? "ring-2 ring-red-400" : "";

  // ---------------- Render ----------------
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen pt-20 pb-20 space-y-8"
      style={{ overflow: "visible" }}
    >
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col justify-center w-full mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Change Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your old password and choose a new one
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-6">
              {/* Old Password */}
              <div>
                <Label>
                  Old Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter old password"
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`${errors.oldPassword ? "border-red-500 ring-1 ring-red-500" : glowIfEmpty(oldPassword, errors.oldPassword)}`}
                    autoComplete="current-password"
                  />
                  <span
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showOldPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {errors.oldPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.oldPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <Label>
                  New Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter new password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${errors.newPassword ? "border-red-500 ring-1 ring-red-500" : glowIfEmpty(newPassword, errors.newPassword)}`}
                    autoComplete="new-password"
                  />
                  <span
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showNewPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {newPassword && !errors.newPassword && (
                  <p
                    className={`mt-1 text-sm font-semibold ${passwordStrengthColor()}`}
                  >
                    Password Strength: {passwordStrength}
                  </p>
                )}
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label>
                  Confirm Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${errors.confirmPassword ? "border-red-500 ring-1 ring-red-500" : glowIfEmpty(confirmPassword, errors.confirmPassword)}`}
                    autoComplete="new-password"
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div>
                <Button
                  className="w-full"
                  size="sm"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

