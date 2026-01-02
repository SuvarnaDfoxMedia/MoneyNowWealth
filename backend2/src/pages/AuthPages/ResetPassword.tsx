import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validatePasswordStrength = (pwd: string) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  return passwordRegex.test(pwd);
};

  const validate = () => {
  const newErrors: typeof errors = {};

  if (!email.trim()) newErrors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Enter a valid email";

  if (!password.trim()) {
    newErrors.password = "Password is required";
  } else if (!validatePasswordStrength(password)) {
    newErrors.password =
      "Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 special character.";
  }

  if (!confirmPassword.trim()) {
    newErrors.confirmPassword = "Confirm password is required";
  } else if (password !== confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/reset-password/${token}`, {
        email,
        password,
      });
      toast.success("Password changed successfully!");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/logo/logo.png"
            alt="MoneyNow Wealth"
            className="h-12 object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className="text-center text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Reset Your Password
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition ${
                errors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-brand-500"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition ${
                  errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-brand-500"
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition ${
                  errors.confirmPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-brand-500"
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-sm text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg font-medium text-white transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600"
            }`}
          >
            {loading ? "Processing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
