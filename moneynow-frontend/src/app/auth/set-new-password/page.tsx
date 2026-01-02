// // "use client";

// // import React, { useState } from "react";
// // import Image from "next/image";
// // import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

// // const SetNewPassword = () => {
// //   const [showPassword, setShowPassword] = useState(false);
// //   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

// //   return (
// //     <section
// //       className="
// //         min-h-screen flex flex-col items-center justify-center 
// //         bg-no-repeat bg-center bg-cover
// //         md:bg-[url('/images/set-new-pass-bg.png')]
// //         md:h-[980px]
// //         font-poppins
// //       "
// //       style={{ backgroundSize: "cover" }}
// //     >
// //       {/* Logo */}
// //       <div className="mb-6">
// //         <Image
// //           src="/images/moneynow-logo2.png"
// //           alt="MoneyNow Logo"
// //           width={200}
// //           height={60}
// //           className="h-14 w-auto mx-auto"
// //           priority
// //         />
// //       </div>

// //       {/* Card */}
// //       <div className="bg-white pb-8 rounded-lg shadow-lg max-w-md w-full">
        
// //         {/* Header */}
// //         <div className="border-b border-gray-300 p-4 sm:p-6 mb-6">
// //           <h2 className="text-center text-[22px] sm:text-[32px] font-bold">
// //             Set New Password
// //           </h2>
// //           <p className="text-center text-[12px] sm:text-[14px]">
// //             For better security, choose a strong and unique password.
// //           </p>
// //         </div>

// //         {/* Form */}
// //         <form className="space-y-6 px-6 sm:px-8">

// //           {/* New Password */}
// //           <div>
// //             <label className="block mb-1 text-[16px] font-semibold text-gray-700">
// //               New Password<span className="text-red-500">*</span>
// //             </label>

// //             <div className="relative">
// //               <input
// //                 type={showPassword ? "text" : "password"}
// //                 className="w-full border border-gray-300 rounded h-[50px] px-3 pr-10
// //                            focus:outline-none focus:ring-2 focus:ring-blue-600 
// //                            focus:border-blue-600"
// //                 placeholder="Enter new password"
// //               />

// //               <button
// //                 type="button"
// //                 onClick={() => setShowPassword(!showPassword)}
// //                 className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
// //               >
// //                 {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
// //               </button>
// //             </div>
// //           </div>

// //           {/* Confirm Password */}
// //           <div>
// //             <label className="block mb-1 text-[16px] font-semibold text-gray-700">
// //               Confirm New Password<span className="text-red-500">*</span>
// //             </label>

// //             <div className="relative">
// //               <input
// //                 type={showConfirmPassword ? "text" : "password"}
// //                 className="w-full border border-gray-300 rounded h-[50px] px-3 pr-10
// //                            focus:outline-none focus:ring-2 focus:ring-blue-600 
// //                            focus:border-blue-600"
// //                 placeholder="Confirm new password"
// //               />

// //               <button
// //                 type="button"
// //                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
// //                 className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
// //               >
// //                 {showConfirmPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
// //               </button>
// //             </div>
// //           </div>

// //           {/* Requirement Text */}
// //           <p className="text-[12px] sm:text-[14px] text-gray-700">
// //             Your password must be at least 10 characters. Include multiple words
// //             and phrases to make it more secure.
// //           </p>

// //           {/* Button */}
// //           <button
// //             type="submit"
// //             className="bg-[#043F79] hover:bg-[#002b6d] text-white py-[14px] px-[30px]
// //                        rounded text-[18px] font-semibold transition-colors "
// //           >
// //             UPDATE PASSWORD
// //           </button>
// //         </form>
// //       </div>
// //     </section>
// //   );
// // };

// // export default SetNewPassword;



// "use client";

// import React, { useState } from "react";
// import Image from "next/image";
// import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
// import { toast, Toaster } from "react-hot-toast";
// import { useRouter } from "next/navigation";

// const SetNewPassword = () => {
//   const router = useRouter();

//   const token =
//     typeof window !== "undefined"
//       ? window.location.pathname.split("/").pop()
//       : "";

//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Inline errors
//   const [errors, setErrors] = useState<{
//     newPassword?: string;
//     confirmPassword?: string;
//     server?: string;
//   }>({});

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const newErrors: typeof errors = {};

//     if (!newPassword) {
//       newErrors.newPassword = "New password is required";
//     } else if (newPassword.length < 10) {
//       newErrors.newPassword = "Password must be at least 10 characters";
//     }

//     if (!confirmPassword) {
//       newErrors.confirmPassword = "Confirm password is required";
//     } else if (newPassword !== confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     if (!token) {
//       newErrors.server = "Invalid or expired reset link";
//     }

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length > 0) return;

//     setLoading(true);

//     try {
//       const response = await fetch(
//         `http://localhost:5000/api/auth/reset-password/${token}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             password: newPassword,
//             confirmPassword,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         setErrors({ server: result.message || "Failed to reset password" });
//         return;
//       }

//       // ✅ SUCCESS TOAST ONLY
//       toast.success("Password reset successfully!");
//       setTimeout(() => router.push("/auth/login"), 1500);

//     } catch (error) {
//       setErrors({ server: "Server error. Try again later." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <section
//       className="
//         w-full min-h-[115dvh] flex flex-col justify-center items-center
//         font-poppins bg-white
//         md:bg-[url('/images/set-new-pass-bg2.png')]
//         md:bg-no-repeat md:bg-center md:bg-cover
//       "
//     >
//       <Toaster position="top-right" />

//       {/* Logo */}
//       <div className="mb-4 sm:mb-6">
//         <Image
//           src="/images/moneynow-logo2.png"
//           alt="MoneyNow Logo"
//           width={180}
//           height={60}
//           className="h-14 w-auto mx-auto"
//           priority
//         />
//       </div>

//       {/* Card */}
//       <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 sm:mx-6 px-4 sm:px-6 py-6 sm:py-8">

//         <div className="border-b border-gray-300 pb-3 mb-4 sm:pb-4 sm:mb-6">
//           <h2 className="text-center text-[24px] sm:text-[32px] font-bold">
//             Set New Password
//           </h2>
//           <p className="text-center text-[13px] sm:text-[14px] mt-1">
//             Create a strong new password.
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

//           {/* New Password */}
//           <div>
//             <label className="block mb-1 text-[14px]">
//               New Password<span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <input
//                 type={showNewPassword ? "text" : "password"}
//                 className={`w-full border rounded h-[40px] px-3 pr-10 text-[15px]
//                   focus:outline-none focus:ring-2
//                   ${errors.newPassword
//                     ? "border-red-500 focus:ring-red-500"
//                     : "border-gray-300 focus:ring-blue-600"
//                   }`}
//                 value={newPassword}
//                 onChange={(e) => {
//                   setNewPassword(e.target.value);
//                   setErrors({ ...errors, newPassword: undefined });
//                 }}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowNewPassword(!showNewPassword)}
//                 className="absolute right-3 top-2 text-gray-500"
//               >
//                 {showNewPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
//               </button>
//             </div>
//             {errors.newPassword && (
//               <p className="text-red-500 text-[12px] mt-1">
//                 {errors.newPassword}
//               </p>
//             )}
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <label className="block mb-1 text-[14px]">
//               Confirm Password<span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <input
//                 type={showConfirmPassword ? "text" : "password"}
//                 className={`w-full border rounded h-[40px] px-3 pr-10 text-[15px]
//                   focus:outline-none focus:ring-2
//                   ${errors.confirmPassword
//                     ? "border-red-500 focus:ring-red-500"
//                     : "border-gray-300 focus:ring-blue-600"
//                   }`}
//                 value={confirmPassword}
//                 onChange={(e) => {
//                   setConfirmPassword(e.target.value);
//                   setErrors({ ...errors, confirmPassword: undefined });
//                 }}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="absolute right-3 top-2 text-gray-500"
//               >
//                 {showConfirmPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
//               </button>
//             </div>
//             {errors.confirmPassword && (
//               <p className="text-red-500 text-[12px] mt-1">
//                 {errors.confirmPassword}
//               </p>
//             )}
//           </div>

//           {errors.server && (
//             <p className="text-red-600 text-[13px] text-center">
//               {errors.server}
//             </p>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="bg-[#043F79] hover:bg-[#002b6d] text-white py-[10px] sm:py-[12px]
//               rounded text-[15px] sm:text-[16px] font-semibold transition-colors w-full"
//           >
//             {loading ? "Updating..." : "Update Password"}
//           </button>
//         </form>
//       </div>
//     </section>
//   );
// };

// export default SetNewPassword;




// "use client";

// import React, { useState } from "react";
// import Image from "next/image";
// import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
// import { toast, Toaster } from "react-hot-toast";
// import { useRouter, useSearchParams } from "next/navigation";

// const SetNewPassword = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const token = searchParams.get("token");

//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [errors, setErrors] = useState<{
//     newPassword?: string;
//     confirmPassword?: string;
//     server?: string;
//   }>({});

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const newErrors: typeof errors = {};

//     if (!newPassword) {
//       newErrors.newPassword = "New password is required";
//     } else if (newPassword.length < 10) {
//       newErrors.newPassword = "Password must be at least 10 characters";
//     }

//     if (!confirmPassword) {
//       newErrors.confirmPassword = "Confirm password is required";
//     } else if (newPassword !== confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     if (!token) {
//       newErrors.server = "Invalid or expired reset link";
//     }

//     setErrors(newErrors);
//     if (Object.keys(newErrors).length > 0) return;

//     setLoading(true);

//     try {
//       const response = await fetch(
//         `http://localhost:5000/api/auth/reset-password/${token}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             password: newPassword,
//             confirmPassword,
//           }),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         setErrors({ server: result.message || "Failed to reset password" });
//         return;
//       }

//       toast.success("Password reset successfully!");
//       setTimeout(() => router.push("/auth/login"), 1500);

//     } catch {
//       setErrors({ server: "Server error. Try again later." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <section className="w-full min-h-[115dvh] flex flex-col justify-center items-center font-poppins bg-white md:bg-[url('/images/set-new-pass-bg2.png')] md:bg-no-repeat md:bg-center md:bg-cover">
//       <Toaster position="top-right" />

//       <div className="mb-4">
//         <Image
//           src="/images/moneynow-logo2.png"
//           alt="MoneyNow Logo"
//           width={260}
//           height={60}
//           priority
//         />
//       </div>

//       <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 px-6 py-8">
//         <h2 className="text-center text-[24px] font-bold mb-2">
//           Set New Password
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">

//           {/* New Password */}
//           <div>
//             <label className="text-sm">New Password *</label>
//             <div className="relative">
//               <input
//                 type={showNewPassword ? "text" : "password"}
//                 className="w-full border rounded h-[40px] px-3 pr-10"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowNewPassword(!showNewPassword)}
//                 className="absolute right-3 top-2"
//               >
//                 {showNewPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
//               </button>
//             </div>
//             {errors.newPassword && (
//               <p className="text-red-500 text-xs">{errors.newPassword}</p>
//             )}
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <label className="text-sm">Confirm Password *</label>
//             <div className="relative">
//               <input
//                 type={showConfirmPassword ? "text" : "password"}
//                 className="w-full border rounded h-[40px] px-3 pr-10"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="absolute right-3 top-2"
//               >
//                 {showConfirmPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
//               </button>
//             </div>
//             {errors.confirmPassword && (
//               <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
//             )}
//             {/* New informational line */}
//             <p className="text-gray-500 text-xs mt-4">
//               Your password must be at least 10 characters. Include multiple words and phrases to make it more secure
//             </p>
//           </div>

//           {errors.server && (
//             <p className="text-red-600 text-sm text-center">{errors.server}</p>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="px-[15px] bg-[#043F79] text-white py-2 rounded"
//           >
//             {loading ? "Updating..." : "Update Password"}
//           </button>
//         </form>
//       </div>
//     </section>
//   );
// };

// export default SetNewPassword;


"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast, Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

const SetNewPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    server?: string;
  }>({});

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 10) {
      newErrors.newPassword =
        "Password must be at least 10 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!token) {
      newErrors.server = "Invalid or expired reset link";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: newPassword,
            confirmPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErrors({
          server: result.message || "Failed to reset password",
        });
        return;
      }

      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch {
      setErrors({ server: "Server error. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full min-h-[115dvh] flex flex-col justify-center items-center font-poppins bg-white md:bg-[url('/images/set-new-pass-bg2.png')] md:bg-no-repeat md:bg-center md:bg-cover">
      <Toaster position="top-right" />

      <div className="mb-4">
        <Image
          src="/images/moneynow-logo2.png"
          alt="MoneyNow Logo"
          width={260}
          height={60}
          priority
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 px-6 py-8">
        <h2 className="text-center text-[24px] font-bold mb-2">
          Set New Password
        </h2>

       
<form onSubmit={handleSubmit} className="space-y-4">

  {/* New Password */}
  <div>
    <label className="text-sm">
      New Password<span className="text-red-500">*</span>
    </label>

    <div className="relative">
      <input
        type={showNewPassword ? "text" : "password"}
        className={`w-full border rounded h-[40px] px-3 pr-10
          focus:outline-none focus:ring-2 focus:ring-blue-600
          ${errors.newPassword ? "border-red-500" : "border-gray-300"}`}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <button
        type="button"
        onClick={() => setShowNewPassword(!showNewPassword)}
        className="absolute right-3 top-2 text-gray-500"
      >
        {showNewPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
      </button>
    </div>

    {errors.newPassword && (
      <p className="text-red-500 text-xs mt-1">
        {errors.newPassword}
      </p>
    )}
  </div>

  {/* Confirm Password */}
  <div>
    <label className="text-sm">
      Confirm Password<span className="text-red-500">*</span>
    </label>

    <div className="relative">
      <input
        type={showConfirmPassword ? "text" : "password"}
        className={`w-full border rounded h-[40px] px-3 pr-10
          focus:outline-none focus:ring-2 focus:ring-blue-600
          ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        type="button"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        className="absolute right-3 top-2 text-gray-500"
      >
        {showConfirmPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
      </button>
    </div>

    {errors.confirmPassword && (
      <p className="text-red-500 text-xs mt-1">
        {errors.confirmPassword}
      </p>
    )}

    <p className="text-gray-500 text-xs mt-4">
      Your password must be at least 10 characters. Include multiple words and phrases to make it more secure
    </p>
  </div>

  {errors.server && (
    <p className="text-red-600 text-sm text-center">
      {errors.server}
    </p>
  )}

  <button
    type="submit"
    disabled={loading}
    className="px-[15px] bg-[#043F79] text-white py-2 rounded"
  >
    {loading ? "Updating..." : "Update Password"}
  </button>

</form>


      </div>
    </section>
  );
};

export default SetNewPassword;
