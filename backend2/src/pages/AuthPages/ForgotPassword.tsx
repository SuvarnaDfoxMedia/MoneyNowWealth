import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeftIcon } from "../../icons"; // or ChevronLeftIcon

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: { email?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post("http://localhost:5000/api/forgot-password", { email });
      toast.success("Password reset link sent to your email.");
      setEmail("");

      // Redirect after short delay
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error sending reset link.";
      setErrors({ email: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 pt-16 rounded-xl shadow-lg relative">
        
        {/* Back Button */}
        <Link
          to="/signin"
          className="absolute top-4 left-4 flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-8"
          > 
          <ChevronLeftIcon className="w-5 h-5" /> {/* or ChevronLeftIcon */}
          Back
        </Link>

        {/* Logo (rectangular full width) */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/logo/logo.png"
            alt="MoneyNow Wealth"
            className="w-full h-16 object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className="text-center text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Forgot Your Password?
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="text" // removed built-in email validation
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-brand-500"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-brand-600 transition"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}
