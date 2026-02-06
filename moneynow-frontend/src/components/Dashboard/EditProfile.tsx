// // "use client";

// // import { useState, useEffect, useRef } from "react";
// // import { FiCamera, FiX } from "react-icons/fi";
// // import intlTelInput from "intl-tel-input";
// // import "intl-tel-input/build/css/intlTelInput.css";
// // import { useProfileStore } from "@/stores/profileStore";

// // interface EditProfileProps {
// //   profile: {
// //     firstname?: string;
// //     lastname?: string;
// //     email?: string;
// //     phone?: string;
// //     address?: string;
// //     countryCode?: string;
// //     profileImage?: string;
// //   } | null;
// //   onClose: () => void;
// // }

// // const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// // export default function EditProfile({ profile, onClose }: EditProfileProps) {
// //   const phoneRef = useRef<HTMLInputElement | null>(null);
// //   const itiRef = useRef<any>(null);

// //   const [formData, setFormData] = useState({
// //     firstname: "",
// //     lastname: "",
// //     phone: "",
// //     address: "",
// //   });
// //   const [countryCode, setCountryCode] = useState("+91");
// //   const [profileImage, setProfileImage] = useState<File | null>(null);
// //   const [imagePreview, setImagePreview] = useState<string | null>(null);
// //   const [errors, setErrors] = useState<Record<string, string>>({});
// //   const [loading, setLoading] = useState(false);

// //   // Zustand setters
// //   const setProfile = useProfileStore((state) => state.setProfile);
// //   const setProfileImageUrl = useProfileStore(
// //     (state) => state.setProfileImageUrl,
// //   );

// //   // ---------------- IMAGE URL ----------------
// //   const getFullImageUrl = (imgPath?: string) => {
// //     if (!imgPath) return null;
// //     if (imgPath.startsWith("http")) return imgPath;
// //     const cleanedPath = imgPath.replace(/^\/uploads/, "");
// //     return `${IMAGE_BASE_URL}${cleanedPath}?v=${Date.now()}`;
// //   };

// //   // ---------------- PREFILL DATA ----------------
// //   useEffect(() => {
// //     if (!profile) return;

// //     setFormData({
// //       firstname: profile.firstname ?? "",
// //       lastname: profile.lastname ?? "",
// //       phone: profile.phone ?? "",
// //       address: profile.address ?? "",
// //     });
// //     setCountryCode(profile.countryCode ?? "+91");
// //     setImagePreview(getFullImageUrl(profile.profileImage));
// //   }, [profile]);

// //   // ---------------- intl-tel-input ----------------
// //   useEffect(() => {
// //     if (!phoneRef.current) return;

// //     if (itiRef.current) {
// //       itiRef.current.destroy();
// //       itiRef.current = null;
// //     }

// //     itiRef.current = intlTelInput(phoneRef.current, {
// //       separateDialCode: true,
// //       initialCountry: "in",
// //       utilsScript:
// //         "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
// //     });

// //     if (profile?.phone) {
// //       const fullNumber = `${profile.countryCode ?? "+91"}${profile.phone}`;
// //       itiRef.current.setNumber(fullNumber);
// //     }

// //     const onChange = () => {
// //       if (!itiRef.current) return;

// //       const country = itiRef.current.getSelectedCountryData();
// //       setCountryCode(`+${country.dialCode}`);

// //       if (typeof window !== "undefined" && window.intlTelInputUtils) {
// //         setFormData((prev) => ({
// //           ...prev,
// //           phone: itiRef.current.getNumber(
// //             window.intlTelInputUtils.numberFormat.NATIONAL,
// //           ),
// //         }));
// //       } else {
// //         setFormData((prev) => ({
// //           ...prev,
// //           phone: itiRef.current.getNumber(),
// //         }));
// //       }
// //     };

// //     phoneRef.current.addEventListener("input", onChange);
// //     phoneRef.current.addEventListener("countrychange", onChange);

// //     return () => {
// //       phoneRef.current?.removeEventListener("input", onChange);
// //       phoneRef.current?.removeEventListener("countrychange", onChange);
// //     };
// //   }, [profile]);

// //   // ---------------- IMAGE CHANGE ----------------
// //   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     if (!e.target.files?.[0]) return;
// //     const file = e.target.files[0];
// //     setProfileImage(file);

// //     const reader = new FileReader();
// //     reader.onload = () => setImagePreview(reader.result as string);
// //     reader.readAsDataURL(file);
// //   };

// //   // ---------------- RESET FORM ----------------
// //   const handleReset = () => {
// //     if (!profile) return;
// //     setFormData({
// //       firstname: profile.firstname ?? "",
// //       lastname: profile.lastname ?? "",
// //       phone: profile.phone ?? "",
// //       address: profile.address ?? "",
// //     });
// //     setCountryCode(profile.countryCode ?? "+91");
// //     setProfileImage(null);
// //     setImagePreview(getFullImageUrl(profile.profileImage));

// //     if (itiRef.current && profile.phone) {
// //       const fullNumber = `${profile.countryCode ?? "+91"}${profile.phone}`;
// //       itiRef.current.setNumber(fullNumber);
// //     }
// //     setErrors({});
// //   };

// //   // ---------------- SAVE PROFILE ----------------
// //   const handleSave = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     setErrors({});

// //     try {
// //       // --------- FRONTEND VALIDATION ---------
// //       const newErrors: Record<string, string> = {};
// //       if (!formData.firstname.trim())
// //         newErrors.firstname = "First name required";
// //       if (!formData.lastname.trim()) newErrors.lastname = "Last name required";
// //       if (!formData.address.trim()) newErrors.address = "Address required";

// //       let phone = formData.phone;
// //       let country_code = countryCode;

// //       if (itiRef.current && typeof itiRef.current.getNumber === "function") {
// //         phone = itiRef.current.getNumber();
// //         const selected = itiRef.current.getSelectedCountryData();
// //         if (selected?.dialCode) country_code = `+${selected.dialCode}`;
// //       }

// //       if (!phone || phone.length < 6) newErrors.phone = "Phone number required";

// //       if (Object.keys(newErrors).length) {
// //         setErrors(newErrors);
// //         setLoading(false);
// //         return;
// //       }

// //       // --------- PREPARE FORM DATA ---------
// //       const data = new FormData();
// //       data.append("firstname", formData.firstname);
// //       data.append("lastname", formData.lastname);
// //       data.append("name", `${formData.firstname} ${formData.lastname}`);
// //       data.append("phone", phone);
// //       data.append("countryCode", country_code);
// //       data.append("address", formData.address);
// //       if (profileImage) data.append("profileImage", profileImage);

// //       // --------- SEND TO BACKEND ---------
// //       const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// //       const res = await fetch(`${API_BASE}/api/profile`, {
// //         method: "PUT",
// //         body: data,
// //         credentials: "include",
// //       });

// //       const text = await res.text();
// //       let result: any = {};
// //       try {
// //         result = JSON.parse(text);
// //       } catch {
// //         result = { message: text };
// //       }

// //       // --------- HANDLE SUCCESS / ERROR ---------
// //       if (
// //         (result.message && result.message.toLowerCase().includes("success")) ||
// //         result.user
// //       ) {
// //         const updatedUser = result.user;

// //         //  UPDATE ZUSTAND STORE IMMEDIATELY
// //         setProfile({
// //           firstname: updatedUser.firstname,
// //           lastname: updatedUser.lastname,
// //           email: updatedUser.email,
// //           phone: updatedUser.phone,
// //           address: updatedUser.address,
// //           countryCode: updatedUser.countryCode,
// //           profileImage: updatedUser.profileImage,
// //         });
// //         setProfileImageUrl(
// //           updatedUser.profileImageUrl ??
// //             getFullImageUrl(updatedUser.profileImage),
// //         );

// //         onClose();
// //       } else {
// //         console.error("Server returned failure:", result);

// //         if (result.errors) {
// //           const backendErrors: Record<string, string> = {};
// //           result.errors.forEach((err: any) => {
// //             backendErrors[err.param] = err.msg;
// //           });
// //           setErrors(backendErrors);
// //         }
// //       }
// //     } catch (err) {
// //       console.error("Save failed:", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // ---------------- STYLES ----------------
// //   const inputClass = (field: string) =>
// //     `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
// //       errors[field]
// //         ? "border-red-500 ring-red-500"
// //         : "border-gray-300 ring-blue-500 dark:bg-gray-800"
// //     }`;

// //   // ---------------- UI ----------------
// //   return (
// //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
// //       <div className="relative w-full max-w-[650px] rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg">
// //         <button onClick={onClose} className="absolute right-4 top-4">
// //           <FiX size={20} />
// //         </button>

// //         <form onSubmit={handleSave}>
// //           {/* IMAGE */}
// //           {/* IMAGE */}
// //           <div className="mb-6 flex justify-center">
// //             {/* Shift image slightly to the right */}
// //             <div className="relative ml-6">
// //               {/* IMAGE CIRCLE */}
// //               <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
// //                 {imagePreview ? (
// //                   <img
// //                     src={imagePreview}
// //                     alt="Profile"
// //                     className="w-full h-full object-cover"
// //                   />
// //                 ) : (
// //                   <div className="flex items-center justify-center h-full text-gray-400 text-sm">
// //                     No Image
// //                   </div>
// //                 )}
// //               </div>

// //               {/* CAMERA ICON */}
// //               <label className="absolute bottom-1 right-1 cursor-pointer bg-[#043F79] p-2 rounded-full shadow-md hover:bg-[#032f5c]">
// //                 <FiCamera size={16} className="text-white" />
// //                 <input
// //                   type="file"
// //                   accept="image/*"
// //                   onChange={handleImageChange}
// //                   className="hidden"
// //                 />
// //               </label>
// //             </div>
// //           </div>

// //           {/* NAME */}
// //           <div className="grid grid-cols-2 gap-4 mb-4">
// //             <div>
// //               <label>First Name</label>
// //               <input
// //                 value={formData.firstname}
// //                 onChange={(e) =>
// //                   setFormData({ ...formData, firstname: e.target.value })
// //                 }
// //                 className={inputClass("firstname")}
// //               />
// //             </div>
// //             <div>
// //               <label>Last Name</label>
// //               <input
// //                 value={formData.lastname}
// //                 onChange={(e) =>
// //                   setFormData({ ...formData, lastname: e.target.value })
// //                 }
// //                 className={inputClass("lastname")}
// //               />
// //             </div>
// //           </div>

// //           {/* EMAIL & PHONE */}
// //           <div className="grid grid-cols-2 gap-4 mb-4">
// //             <div>
// //               <label>Email</label>
// //               <input
// //                 disabled
// //                 value={profile?.email ?? ""}
// //                 className="w-full px-3 py-2 bg-gray-100 rounded"
// //               />
// //             </div>
// //             <div>
// //               <label>Phone</label>
// //               <input ref={phoneRef} className={inputClass("phone")} />
// //             </div>
// //           </div>

// //           {/* ADDRESS */}
// //           <div className="mb-4">
// //             <label>Address</label>
// //             <textarea
// //               rows={3}
// //               value={formData.address}
// //               onChange={(e) =>
// //                 setFormData({ ...formData, address: e.target.value })
// //               }
// //               className={inputClass("address")}
// //             />
// //           </div>

// //           {/* BUTTONS */}
// //           <div className="flex justify-end gap-3">
// //             <button
// //               type="button"
// //               onClick={handleReset}
// //               className="px-4 py-2 border rounded-full"
// //             >
// //               Reset
// //             </button>
// //             <button
// //               type="submit"
// //               disabled={loading}
// //               className="px-4 py-2 bg-[#043F79] text-white rounded-full"
// //             >
// //               {loading ? "Saving..." : "Save Changes"}
// //             </button>
// //           </div>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useState, useEffect, useRef } from "react";
// import { FiCamera, FiX } from "react-icons/fi";
// import intlTelInput from "intl-tel-input";
// import "intl-tel-input/build/css/intlTelInput.css";
// import { useProfileStore } from "@/stores/profileStore";

// interface EditProfileProps {
//   profile: {
//     firstname?: string;
//     lastname?: string;
//     email?: string;
//     phone?: string;
//     address?: string;
//     countryCode?: string;
//     profileImage?: string;
//   } | null;
//   onClose: () => void;
// }

// const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// export default function EditProfile({ profile, onClose }: EditProfileProps) {
//   const phoneRef = useRef<HTMLInputElement | null>(null);
//   const itiRef = useRef<any>(null);

//   const [formData, setFormData] = useState({
//     firstname: "",
//     lastname: "",
//     phone: "",
//     address: "",
//   });
//   const [countryCode, setCountryCode] = useState("+91");
//   const [profileImage, setProfileImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);

//   // Zustand setters
//   const setProfile = useProfileStore((state) => state.setProfile);
//   const setProfileImageUrl = useProfileStore(
//     (state) => state.setProfileImageUrl,
//   );

//   const getFullImageUrl = (imgPath?: string) => {
//     if (!imgPath) return null;
//     if (imgPath.startsWith("http")) return imgPath;
//     const cleanedPath = imgPath.replace(/^\/uploads/, "");
//     return `${IMAGE_BASE_URL}${cleanedPath}?v=${Date.now()}`;
//   };

//   // ---------------- PREFILL DATA ----------------
//   useEffect(() => {
//     if (!profile) return;

//     setFormData({
//       firstname: profile.firstname ?? "",
//       lastname: profile.lastname ?? "",
//       phone: profile.phone ?? "",
//       address: profile.address ?? "",
//     });
//     setCountryCode(profile.countryCode ?? "+91");
//     setImagePreview(getFullImageUrl(profile.profileImage));
//   }, [profile]);

//   // ---------------- intl-tel-input ----------------
//   useEffect(() => {
//     if (!phoneRef.current) return;

//     if (itiRef.current) {
//       itiRef.current.destroy();
//       itiRef.current = null;
//     }

//     itiRef.current = intlTelInput(phoneRef.current, {
//       separateDialCode: true,
//       initialCountry: "in",
//       utilsScript:
//         "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
//     });

//     if (profile?.phone && profile?.countryCode) {
//       const fullNumber = `${profile.countryCode}${profile.phone}`;
//       itiRef.current.setNumber(fullNumber);
//     }

//     const handlePhoneChange = () => {
//       if (!itiRef.current) return;

//       const country = itiRef.current.getSelectedCountryData();
//       const dialCode = `+${country.dialCode}`;
//       setCountryCode(dialCode);

//       // Get the national number (without country code)
//       let nationalNumber = "";
//       if (typeof window !== "undefined" && window.intlTelInputUtils) {
//         nationalNumber = itiRef.current.getNumber(
//           window.intlTelInputUtils.numberFormat.NATIONAL,
//         );
//       } else {
//         const fullNumber = itiRef.current.getNumber();
//         if (fullNumber && country.dialCode) {
//           nationalNumber = fullNumber
//             .replace(`+${country.dialCode}`, "")
//             .trim();
//         }
//       }

//       // Clean the national number - remove non-digits and leading zeros
//       nationalNumber = nationalNumber.replace(/\D/g, "");
//       if (nationalNumber.startsWith("0")) {
//         nationalNumber = nationalNumber.substring(1);
//       }

//       setFormData((prev) => ({
//         ...prev,
//         phone: nationalNumber || "",
//       }));
//     };

//     phoneRef.current.addEventListener("input", handlePhoneChange);
//     phoneRef.current.addEventListener("countrychange", handlePhoneChange);

//     // Initial call
//     setTimeout(handlePhoneChange, 100);

//     return () => {
//       phoneRef.current?.removeEventListener("input", handlePhoneChange);
//       phoneRef.current?.removeEventListener("countrychange", handlePhoneChange);
//       if (itiRef.current) {
//         itiRef.current.destroy();
//       }
//     };
//   }, [profile]);

//   // ---------------- IMAGE CHANGE ----------------
//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files?.[0]) return;
//     const file = e.target.files[0];
//     setProfileImage(file);

//     const reader = new FileReader();
//     reader.onload = () => setImagePreview(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   // ---------------- RESET FORM ----------------
//   const handleReset = () => {
//     if (!profile) return;
//     setFormData({
//       firstname: profile.firstname ?? "",
//       lastname: profile.lastname ?? "",
//       phone: profile.phone ?? "",
//       address: profile.address ?? "",
//     });
//     setCountryCode(profile.countryCode ?? "+91");
//     setProfileImage(null);
//     setImagePreview(getFullImageUrl(profile.profileImage));

//     if (itiRef.current && profile.phone && profile.countryCode) {
//       const fullNumber = `${profile.countryCode}${profile.phone}`;
//       itiRef.current.setNumber(fullNumber);
//     }
//     setErrors({});
//   };

//   // ---------------- SAVE PROFILE ----------------
//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrors({});

//     try {
//       // --------- FRONTEND VALIDATION ---------
//       const newErrors: Record<string, string> = {};
//       if (!formData.firstname.trim())
//         newErrors.firstname = "First name required";
//       if (!formData.lastname.trim()) newErrors.lastname = "Last name required";
//       if (!formData.address.trim()) newErrors.address = "Address required";

//       // Get phone number and country code
//       let phoneNumber = formData.phone.trim();
//       let selectedCountryCode = countryCode;

//       // Validate phone
//       if (!phoneNumber || phoneNumber.length < 5) {
//         newErrors.phone = "Valid phone number required";
//       }

//       if (Object.keys(newErrors).length) {
//         setErrors(newErrors);
//         setLoading(false);
//         return;
//       }

//       // --------- PREPARE FORM DATA ---------
//       // IMPORTANT: Send them SEPARATELY to backend
//       const data = new FormData();
//       data.append("firstname", formData.firstname);
//       data.append("lastname", formData.lastname);
//       data.append("name", `${formData.firstname} ${formData.lastname}`);

//       // Send PHONE NUMBER WITHOUT country code
//       data.append("phone", phoneNumber);

//       // Send COUNTRY CODE separately
//       data.append("countryCode", selectedCountryCode);

//       data.append("address", formData.address);
//       if (profileImage) data.append("profileImage", profileImage);

//       // --------- SEND TO BACKEND ---------
//       const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//       const res = await fetch(`${API_BASE}/api/profile`, {
//         method: "PUT",
//         body: data,
//         credentials: "include",
//       });

//       const text = await res.text();
//       let result: any = {};
//       try {
//         result = JSON.parse(text);
//       } catch {
//         result = { message: text };
//       }

//       // --------- HANDLE SUCCESS / ERROR ---------
//       if (
//         (result.message && result.message.toLowerCase().includes("success")) ||
//         result.user
//       ) {
//         const updatedUser = result.user;

//         // UPDATE ZUSTAND STORE IMMEDIATELY
//         setProfile({
//           firstname: updatedUser.firstname,
//           lastname: updatedUser.lastname,
//           email: updatedUser.email,
//           phone: updatedUser.phone, // This should be just the number
//           address: updatedUser.address,
//           countryCode: updatedUser.countryCode, // This should be just the country code
//           profileImage: updatedUser.profileImage,
//         });
//         setProfileImageUrl(
//           updatedUser.profileImageUrl ??
//             getFullImageUrl(updatedUser.profileImage),
//         );

//         onClose();
//       } else {
//         console.error("Server returned failure:", result);
//         if (result.errors) {
//           const backendErrors: Record<string, string> = {};
//           result.errors.forEach((err: any) => {
//             backendErrors[err.param] = err.msg;
//           });
//           setErrors(backendErrors);
//         }
//       }
//     } catch (err) {
//       console.error("Save failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputClass = (field: string) =>
//     `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
//       errors[field]
//         ? "border-red-500 ring-red-500"
//         : "border-gray-300 ring-blue-500 dark:bg-gray-800"
//     }`;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//       <div className="relative w-full max-w-[650px] rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg">
//         <button onClick={onClose} className="absolute right-4 top-4">
//           <FiX size={20} />
//         </button>

//         <form onSubmit={handleSave}>
//           {/* IMAGE */}
//           <div className="mb-6 flex justify-center">
//             <div className="relative ml-6">
//               <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
//                 {imagePreview ? (
//                   <img
//                     src={imagePreview}
//                     alt="Profile"
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-gray-400 text-sm">
//                     No Image
//                   </div>
//                 )}
//               </div>
//               <label className="absolute bottom-1 right-1 cursor-pointer bg-[#043F79] p-2 rounded-full shadow-md hover:bg-[#032f5c]">
//                 <FiCamera size={16} className="text-white" />
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           </div>

//           {/* NAME */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 First Name
//               </label>
//               <input
//                 value={formData.firstname}
//                 onChange={(e) =>
//                   setFormData({ ...formData, firstname: e.target.value })
//                 }
//                 className={inputClass("firstname")}
//               />
//               {errors.firstname && (
//                 <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Last Name
//               </label>
//               <input
//                 value={formData.lastname}
//                 onChange={(e) =>
//                   setFormData({ ...formData, lastname: e.target.value })
//                 }
//                 className={inputClass("lastname")}
//               />
//               {errors.lastname && (
//                 <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
//               )}
//             </div>
//           </div>

//           {/* EMAIL & PHONE */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Email
//               </label>
//               <input
//                 disabled
//                 value={profile?.email ?? ""}
//                 className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Phone
//               </label>
//               <input
//                 ref={phoneRef}
//                 className={inputClass("phone")}
//                 type="tel"
//               />
//               {errors.phone && (
//                 <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
//               )}
//               <p className="text-xs text-gray-500 mt-1">
//                 Country code: {countryCode} | Number: {formData.phone}
//               </p>
//             </div>
//           </div>

//           {/* ADDRESS */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Address
//             </label>
//             <textarea
//               rows={3}
//               value={formData.address}
//               onChange={(e) =>
//                 setFormData({ ...formData, address: e.target.value })
//               }
//               className={inputClass("address")}
//             />
//             {errors.address && (
//               <p className="text-red-500 text-xs mt-1">{errors.address}</p>
//             )}
//           </div>

//           {/* BUTTONS */}
//           <div className="flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={handleReset}
//               className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//             >
//               Reset
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-[#043F79] text-white rounded-full hover:bg-[#032f5c] transition disabled:opacity-50"
//             >
//               {loading ? "Saving..." : "Save Changes"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useRef } from "react";
// import { FiCamera, FiX } from "react-icons/fi";
// import intlTelInput from "intl-tel-input";
// import "intl-tel-input/build/css/intlTelInput.css";
// import { useProfileStore } from "@/stores/profileStore";

// interface EditProfileProps {
//   profile: {
//     firstname?: string;
//     lastname?: string;
//     email?: string;
//     phone?: string;
//     address?: string;
//     countryCode?: string;
//     profileImage?: string;
//   } | null;
//   onClose: () => void;
//   onSave?: (formData: FormData) => Promise<void>; // Add this prop
// }

// const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// export default function EditProfile({
//   profile,
//   onClose,
//   onSave,
// }: EditProfileProps) {
//   const phoneRef = useRef<HTMLInputElement | null>(null);
//   const itiRef = useRef<any>(null);

//   const [formData, setFormData] = useState({
//     firstname: "",
//     lastname: "",
//     phone: "",
//     address: "",
//   });
//   const [countryCode, setCountryCode] = useState("+91");
//   const [profileImage, setProfileImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);

//   // Zustand setters
//   const setProfile = useProfileStore((state) => state.setProfile);
//   const setProfileImageUrl = useProfileStore(
//     (state) => state.setProfileImageUrl,
//   );

//   const getFullImageUrl = (imgPath?: string) => {
//     if (!imgPath) return null;
//     if (imgPath.startsWith("http")) return imgPath;
//     const cleanedPath = imgPath.replace(/^\/uploads/, "");
//     return `${IMAGE_BASE_URL}${cleanedPath}?v=${Date.now()}`;
//   };

//   // ---------------- PREFILL DATA ----------------
//   useEffect(() => {
//     if (!profile) return;

//     setFormData({
//       firstname: profile.firstname ?? "",
//       lastname: profile.lastname ?? "",
//       phone: profile.phone ?? "",
//       address: profile.address ?? "",
//     });
//     setCountryCode(profile.countryCode ?? "+91");
//     setImagePreview(getFullImageUrl(profile.profileImage));
//   }, [profile]);

//   // ---------------- intl-tel-input ----------------
//   useEffect(() => {
//     if (!phoneRef.current) return;

//     if (itiRef.current) {
//       itiRef.current.destroy();
//       itiRef.current = null;
//     }

//     itiRef.current = intlTelInput(phoneRef.current, {
//       separateDialCode: true,
//       initialCountry: "in",
//       utilsScript:
//         "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
//     });

//     if (profile?.phone && profile?.countryCode) {
//       const fullNumber = `${profile.countryCode}${profile.phone}`;
//       itiRef.current.setNumber(fullNumber);
//     }

//     const handlePhoneChange = () => {
//       if (!itiRef.current) return;

//       const country = itiRef.current.getSelectedCountryData();
//       const dialCode = `+${country.dialCode}`;
//       setCountryCode(dialCode);

//       // Get the national number (without country code)
//       let nationalNumber = "";
//       if (typeof window !== "undefined" && window.intlTelInputUtils) {
//         nationalNumber = itiRef.current.getNumber(
//           window.intlTelInputUtils.numberFormat.NATIONAL,
//         );
//       } else {
//         const fullNumber = itiRef.current.getNumber();
//         if (fullNumber && country.dialCode) {
//           nationalNumber = fullNumber
//             .replace(`+${country.dialCode}`, "")
//             .trim();
//         }
//       }

//       // Clean the national number - remove non-digits and leading zeros
//       nationalNumber = nationalNumber.replace(/\D/g, "");
//       if (nationalNumber.startsWith("0")) {
//         nationalNumber = nationalNumber.substring(1);
//       }

//       setFormData((prev) => ({
//         ...prev,
//         phone: nationalNumber || "",
//       }));
//     };

//     phoneRef.current.addEventListener("input", handlePhoneChange);
//     phoneRef.current.addEventListener("countrychange", handlePhoneChange);

//     // Initial call
//     setTimeout(handlePhoneChange, 100);

//     return () => {
//       phoneRef.current?.removeEventListener("input", handlePhoneChange);
//       phoneRef.current?.removeEventListener("countrychange", handlePhoneChange);
//       if (itiRef.current) {
//         itiRef.current.destroy();
//       }
//     };
//   }, [profile]);

//   // ---------------- IMAGE CHANGE ----------------
//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files?.[0]) return;
//     const file = e.target.files[0];
//     setProfileImage(file);

//     const reader = new FileReader();
//     reader.onload = () => setImagePreview(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   // ---------------- RESET FORM ----------------
//   const handleReset = () => {
//     if (!profile) return;
//     setFormData({
//       firstname: profile.firstname ?? "",
//       lastname: profile.lastname ?? "",
//       phone: profile.phone ?? "",
//       address: profile.address ?? "",
//     });
//     setCountryCode(profile.countryCode ?? "+91");
//     setProfileImage(null);
//     setImagePreview(getFullImageUrl(profile.profileImage));

//     if (itiRef.current && profile.phone && profile.countryCode) {
//       const fullNumber = `${profile.countryCode}${profile.phone}`;
//       itiRef.current.setNumber(fullNumber);
//     }
//     setErrors({});
//   };

//   // ---------------- SAVE PROFILE ----------------
//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrors({});

//     try {
//       // --------- FRONTEND VALIDATION ---------
//       const newErrors: Record<string, string> = {};
//       if (!formData.firstname.trim())
//         newErrors.firstname = "First name required";
//       if (!formData.lastname.trim()) newErrors.lastname = "Last name required";
//       if (!formData.address.trim()) newErrors.address = "Address required";

//       // Get phone number
//       let phoneNumber = formData.phone.trim();

//       // Validate phone
//       if (!phoneNumber || phoneNumber.length < 5) {
//         newErrors.phone = "Valid phone number required";
//       }

//       if (Object.keys(newErrors).length) {
//         setErrors(newErrors);
//         setLoading(false);
//         return;
//       }

//       // --------- PREPARE FORM DATA ---------
//       const data = new FormData();
//       data.append("firstname", formData.firstname);
//       data.append("lastname", formData.lastname);
//       data.append("name", `${formData.firstname} ${formData.lastname}`);

//       // Send PHONE NUMBER WITHOUT country code (backend expects just the number)
//       data.append("phone", phoneNumber);

//       // Send COUNTRY CODE separately
//       data.append("countryCode", countryCode);

//       data.append("address", formData.address);
//       if (profileImage) data.append("profileImage", profileImage);

//       // Check if parent component provided onSave prop
//       if (onSave) {
//         // Use parent's save function
//         await onSave(data);
//         onClose();
//         return;
//       }

//       // --------- SEND TO BACKEND ---------
//       const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//       const res = await fetch(`${API_BASE}/api/profile`, {
//         method: "PUT",
//         body: data,
//         credentials: "include",
//       });

//       const text = await res.text();
//       let result: any = {};
//       try {
//         result = JSON.parse(text);
//       } catch {
//         result = { message: text };
//       }

//       // --------- HANDLE SUCCESS / ERROR ---------
//       if (
//         (result.message && result.message.toLowerCase().includes("success")) ||
//         result.user
//       ) {
//         const updatedUser = result.user;

//         // DEBUG: Log the response to see what's being returned
//         console.log("Profile update response:", updatedUser);

//         // UPDATE ZUSTAND STORE IMMEDIATELY
//         // Make sure we're extracting phone and countryCode correctly
//         setProfile({
//           firstname: updatedUser.firstname || formData.firstname,
//           lastname: updatedUser.lastname || formData.lastname,
//           email: updatedUser.email || profile?.email,
//           phone: updatedUser.phone || phoneNumber, // Use updatedUser.phone or fallback
//           address: updatedUser.address || formData.address,
//           countryCode: updatedUser.countryCode || countryCode, // Use updatedUser.countryCode or fallback
//           profileImage: updatedUser.profileImage || profile?.profileImage,
//         });

//         // Update profile image URL
//         const newImageUrl =
//           updatedUser.profileImageUrl ||
//           getFullImageUrl(updatedUser.profileImage);
//         setProfileImageUrl(newImageUrl);

//         onClose();
//       } else {
//         console.error("Server returned failure:", result);
//         if (result.errors) {
//           const backendErrors: Record<string, string> = {};
//           result.errors.forEach((err: any) => {
//             backendErrors[err.param] = err.msg;
//           });
//           setErrors(backendErrors);
//         }
//       }
//     } catch (err) {
//       console.error("Save failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputClass = (field: string) =>
//     `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
//       errors[field]
//         ? "border-red-500 ring-red-500"
//         : "border-gray-300 ring-blue-500 dark:bg-gray-800"
//     }`;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//       <div className="relative w-full max-w-[650px] rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg">
//         <button onClick={onClose} className="absolute right-4 top-4">
//           <FiX size={20} />
//         </button>

//         <form onSubmit={handleSave}>
//           {/* IMAGE */}
//           <div className="mb-6 flex justify-center">
//             <div className="relative ml-6">
//               <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
//                 {imagePreview ? (
//                   <img
//                     src={imagePreview}
//                     alt="Profile"
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-gray-400 text-sm">
//                     No Image
//                   </div>
//                 )}
//               </div>
//               <label className="absolute bottom-1 right-1 cursor-pointer bg-[#043F79] p-2 rounded-full shadow-md hover:bg-[#032f5c]">
//                 <FiCamera size={16} className="text-white" />
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           </div>

//           {/* NAME */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 First Name
//               </label>
//               <input
//                 value={formData.firstname}
//                 onChange={(e) =>
//                   setFormData({ ...formData, firstname: e.target.value })
//                 }
//                 className={inputClass("firstname")}
//               />
//               {errors.firstname && (
//                 <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Last Name
//               </label>
//               <input
//                 value={formData.lastname}
//                 onChange={(e) =>
//                   setFormData({ ...formData, lastname: e.target.value })
//                 }
//                 className={inputClass("lastname")}
//               />
//               {errors.lastname && (
//                 <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
//               )}
//             </div>
//           </div>

//           {/* EMAIL & PHONE */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Email
//               </label>
//               <input
//                 disabled
//                 value={profile?.email ?? ""}
//                 className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Phone
//               </label>
//               <input
//                 ref={phoneRef}
//                 className={inputClass("phone")}
//                 type="tel"
//               />
//               {errors.phone && (
//                 <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
//               )}
//               <p className="text-xs text-gray-500 mt-1">
//                 Country code: {countryCode} | Number: {formData.phone}
//               </p>
//             </div>
//           </div>

//           {/* ADDRESS */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Address
//             </label>
//             <textarea
//               rows={3}
//               value={formData.address}
//               onChange={(e) =>
//                 setFormData({ ...formData, address: e.target.value })
//               }
//               className={inputClass("address")}
//             />
//             {errors.address && (
//               <p className="text-red-500 text-xs mt-1">{errors.address}</p>
//             )}
//           </div>

//           {/* BUTTONS */}
//           <div className="flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={handleReset}
//               className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//             >
//               Reset
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-[#043F79] text-white rounded-full hover:bg-[#032f5c] transition disabled:opacity-50"
//             >
//               {loading ? "Saving..." : "Save Changes"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useRef } from "react";
// import { FiCamera, FiX } from "react-icons/fi";
// import intlTelInput from "intl-tel-input";
// import "intl-tel-input/build/css/intlTelInput.css";
// import { useProfileStore } from "@/stores/profileStore";
// import { API } from "@/app/api/axios";
// import { toast } from "react-toastify";

// interface EditProfileProps {
//   profile: {
//     firstname?: string;
//     lastname?: string;
//     email?: string;
//     phone?: string;
//     address?: string;
//     countryCode?: string;
//     profileImage?: string;
//   } | null;
//   onClose: () => void;
//   onSave?: (formData: FormData) => Promise<any>; // Updated return type
// }

// const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// export default function EditProfile({
//   profile,
//   onClose,
//   onSave,
// }: EditProfileProps) {
//   const phoneRef = useRef<HTMLInputElement | null>(null);
//   const itiRef = useRef<any>(null);

//   const [formData, setFormData] = useState({
//     firstname: "",
//     lastname: "",
//     phone: "",
//     address: "",
//   });
//   const [countryCode, setCountryCode] = useState("+91");
//   const [profileImage, setProfileImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);

//   // Zustand setters
//   const { setProfile, setProfileImageUrl } = useProfileStore();

//   const getFullImageUrl = (imgPath?: string) => {
//     if (!imgPath) return null;
//     if (imgPath.startsWith("http")) return imgPath;

//     // Clean the path
//     let cleanPath = imgPath.replace(/^\/+/, "");
//     if (cleanPath.startsWith("uploads/profiles/")) {
//       cleanPath = cleanPath.replace("uploads/profiles/", "");
//     } else if (cleanPath.startsWith("profiles/")) {
//       cleanPath = cleanPath.replace("profiles/", "");
//     }

//     return `${IMAGE_BASE_URL}/profiles/${cleanPath}?v=${Date.now()}`;
//   };

//   // ---------------- PREFILL DATA ----------------
//   useEffect(() => {
//     if (!profile) return;

//     console.log("Prefilling with profile:", profile);

//     setFormData({
//       firstname: profile.firstname ?? "",
//       lastname: profile.lastname ?? "",
//       phone: profile.phone ?? "",
//       address: profile.address ?? "",
//     });
//     setCountryCode(profile.countryCode ?? "+91");

//     const imgUrl = getFullImageUrl(profile.profileImage);
//     console.log("Setting image preview:", imgUrl);
//     setImagePreview(imgUrl);
//   }, [profile]);

//   // ---------------- intl-tel-input ----------------
//   useEffect(() => {
//     if (!phoneRef.current) return;

//     if (itiRef.current) {
//       itiRef.current.destroy();
//       itiRef.current = null;
//     }

//     itiRef.current = intlTelInput(phoneRef.current, {
//       separateDialCode: true,
//       initialCountry: "in",
//       utilsScript:
//         "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
//     });

//     // Set initial phone number
//     if (profile?.phone && profile?.countryCode) {
//       const fullNumber = `${profile.countryCode}${profile.phone}`;
//       console.log("Setting phone number:", fullNumber);
//       itiRef.current.setNumber(fullNumber);
//     } else if (profile?.phone) {
//       itiRef.current.setNumber(profile.phone);
//     }

//     const handlePhoneChange = () => {
//       if (!itiRef.current) return;

//       const country = itiRef.current.getSelectedCountryData();
//       const dialCode = `+${country.dialCode}`;
//       setCountryCode(dialCode);

//       // Get the national number (without country code)
//       let nationalNumber = "";
//       if (typeof window !== "undefined" && window.intlTelInputUtils) {
//         nationalNumber = itiRef.current.getNumber(
//           window.intlTelInputUtils.numberFormat.NATIONAL,
//         );
//       } else {
//         const fullNumber = itiRef.current.getNumber();
//         if (fullNumber && country.dialCode) {
//           nationalNumber = fullNumber
//             .replace(`+${country.dialCode}`, "")
//             .trim();
//         }
//       }

//       // Clean the national number - remove non-digits and leading zeros
//       nationalNumber = nationalNumber.replace(/\D/g, "");
//       if (nationalNumber.startsWith("0")) {
//         nationalNumber = nationalNumber.substring(1);
//       }

//       console.log(
//         "Phone changed - Country:",
//         dialCode,
//         "Number:",
//         nationalNumber,
//       );
//       setFormData((prev) => ({
//         ...prev,
//         phone: nationalNumber || "",
//       }));
//     };

//     phoneRef.current.addEventListener("input", handlePhoneChange);
//     phoneRef.current.addEventListener("countrychange", handlePhoneChange);

//     // Initial call
//     setTimeout(handlePhoneChange, 100);

//     return () => {
//       phoneRef.current?.removeEventListener("input", handlePhoneChange);
//       phoneRef.current?.removeEventListener("countrychange", handlePhoneChange);
//       if (itiRef.current) {
//         itiRef.current.destroy();
//       }
//     };
//   }, [profile]);

//   // ---------------- IMAGE CHANGE ----------------
//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files?.[0]) return;
//     const file = e.target.files[0];
//     setProfileImage(file);

//     const reader = new FileReader();
//     reader.onload = () => setImagePreview(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   // ---------------- RESET FORM ----------------
//   const handleReset = () => {
//     if (!profile) return;
//     setFormData({
//       firstname: profile.firstname ?? "",
//       lastname: profile.lastname ?? "",
//       phone: profile.phone ?? "",
//       address: profile.address ?? "",
//     });
//     setCountryCode(profile.countryCode ?? "+91");
//     setProfileImage(null);
//     setImagePreview(getFullImageUrl(profile.profileImage));

//     if (itiRef.current && profile.phone && profile.countryCode) {
//       const fullNumber = `${profile.countryCode}${profile.phone}`;
//       itiRef.current.setNumber(fullNumber);
//     }
//     setErrors({});
//   };

//   // ---------------- SAVE PROFILE ----------------
//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrors({});

//     try {
//       // --------- FRONTEND VALIDATION ---------
//       const newErrors: Record<string, string> = {};
//       if (!formData.firstname.trim())
//         newErrors.firstname = "First name required";
//       if (!formData.lastname.trim()) newErrors.lastname = "Last name required";
//       if (!formData.address.trim()) newErrors.address = "Address required";

//       // Get phone number
//       const phoneNumber = formData.phone.trim();

//       // Validate phone
//       if (!phoneNumber || phoneNumber.length < 5) {
//         newErrors.phone = "Valid phone number required";
//       }

//       if (Object.keys(newErrors).length) {
//         setErrors(newErrors);
//         setLoading(false);
//         return;
//       }

//       // --------- PREPARE FORM DATA ---------
//       const data = new FormData();
//       data.append("firstname", formData.firstname);
//       data.append("lastname", formData.lastname);
//       data.append("name", `${formData.firstname} ${formData.lastname}`);

//       // IMPORTANT: Use "mobile" field name for backend
//       data.append("mobile", phoneNumber);

//       // Send COUNTRY CODE separately
//       data.append("countryCode", countryCode);

//       data.append("address", formData.address);
//       if (profileImage) {
//         data.append("profileImage", profileImage);
//       }

//       console.log("Form data prepared:");
//       for (let [key, value] of data.entries()) {
//         console.log(key, value instanceof File ? value.name : value);
//       }

//       // Check if parent component provided onSave prop
//       if (onSave) {
//         console.log("Using parent's onSave function");
//         const result = await onSave(data);

//         if (result?.success) {
//           // Update local store with the returned profile
//           if (result.profile) {
//             setProfile(result.profile);

//             // Update image URL
//             if (result.profile.profileImage) {
//               const imgUrl = getFullImageUrl(result.profile.profileImage);
//               setProfileImageUrl(imgUrl);
//             }
//           }

//           toast.success("Profile updated successfully");
//           onClose();
//         } else if (result?.errors) {
//           // Handle validation errors from parent
//           const backendErrors: Record<string, string> = {};
//           result.errors.forEach((err: any) => {
//             backendErrors[err.param] = err.msg;
//           });
//           setErrors(backendErrors);
//         } else if (result?.error) {
//           setErrors({ general: result.error });
//         }
//         return;
//       }

//       // --------- SEND TO BACKEND DIRECTLY ---------
//       console.log("Sending PUT request to /api/profile");

//       const res = await API.put("/api/profile", data, {
//         withCredentials: true,
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       console.log("Response received:", res.data);

//       // --------- HANDLE SUCCESS ---------
//       if (res.data.user) {
//         const updatedUser = res.data.user;

//         // Create updated profile object
//         const updatedProfile = {
//           id: updatedUser.id || updatedUser._id || profile?.id,
//           firstname: updatedUser.firstname || formData.firstname,
//           lastname: updatedUser.lastname || formData.lastname,
//           name: `${updatedUser.firstname || formData.firstname} ${updatedUser.lastname || formData.lastname}`.trim(),
//           email: updatedUser.email || profile?.email || "",
//           phone: updatedUser.mobile || phoneNumber,
//           address: updatedUser.address || formData.address,
//           countryCode: updatedUser.countryCode || countryCode,
//           profileImage: updatedUser.profileImage || profile?.profileImage,
//         };

//         console.log("Updating store with:", updatedProfile);

//         // UPDATE ZUSTAND STORE
//         setProfile(updatedProfile);

//         // Update profile image URL
//         const newImageUrl = getFullImageUrl(updatedUser.profileImage);
//         console.log("Setting new image URL:", newImageUrl);
//         setProfileImageUrl(newImageUrl);

//         toast.success("Profile updated successfully");
//         onClose();
//       } else {
//         console.error("Unexpected response:", res.data);
//         setErrors({ general: "Unexpected response from server" });
//       }
//     } catch (err: any) {
//       console.error("Save failed:", err);

//       if (err.response?.data?.errors) {
//         const backendErrors: Record<string, string> = {};
//         err.response.data.errors.forEach((err: any) => {
//           backendErrors[err.param] = err.msg;
//         });
//         setErrors(backendErrors);
//       } else if (err.response?.data?.message) {
//         setErrors({ general: err.response.data.message });
//       } else {
//         setErrors({ general: "Failed to save profile. Please try again." });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputClass = (field: string) =>
//     `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
//       errors[field]
//         ? "border-red-500 ring-red-500"
//         : "border-gray-300 ring-blue-500 dark:bg-gray-800"
//     }`;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//       <div className="relative w-full max-w-[650px] rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg">
//         <button
//           onClick={onClose}
//           className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
//           type="button"
//         >
//           <FiX size={20} />
//         </button>

//         <form onSubmit={handleSave}>
//           {errors.general && (
//             <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
//               {errors.general}
//             </div>
//           )}

//           {/* IMAGE */}
//           <div className="mb-6 flex justify-center">
//             <div className="relative ml-6">
//               <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
//                 {imagePreview ? (
//                   <img
//                     src={imagePreview}
//                     alt="Profile"
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-gray-400 text-sm">
//                     No Image
//                   </div>
//                 )}
//               </div>
//               <label className="absolute bottom-1 right-1 cursor-pointer bg-[#043F79] p-2 rounded-full shadow-md hover:bg-[#032f5c]">
//                 <FiCamera size={16} className="text-white" />
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           </div>

//           {/* NAME */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 First Name *
//               </label>
//               <input
//                 value={formData.firstname}
//                 onChange={(e) =>
//                   setFormData({ ...formData, firstname: e.target.value })
//                 }
//                 className={inputClass("firstname")}
//               />
//               {errors.firstname && (
//                 <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Last Name *
//               </label>
//               <input
//                 value={formData.lastname}
//                 onChange={(e) =>
//                   setFormData({ ...formData, lastname: e.target.value })
//                 }
//                 className={inputClass("lastname")}
//               />
//               {errors.lastname && (
//                 <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
//               )}
//             </div>
//           </div>

//           {/* EMAIL & PHONE */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Email
//               </label>
//               <input
//                 disabled
//                 value={profile?.email ?? ""}
//                 className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 text-gray-600"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Phone *
//               </label>
//               <input
//                 ref={phoneRef}
//                 className={inputClass("phone")}
//                 type="tel"
//               />
//               {errors.phone && (
//                 <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
//               )}
//               <p className="text-xs text-gray-500 mt-1">
//                 Country code: {countryCode} | Number: {formData.phone}
//               </p>
//             </div>
//           </div>

//           {/* ADDRESS */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Address *
//             </label>
//             <textarea
//               rows={3}
//               value={formData.address}
//               onChange={(e) =>
//                 setFormData({ ...formData, address: e.target.value })
//               }
//               className={inputClass("address")}
//             />
//             {errors.address && (
//               <p className="text-red-500 text-xs mt-1">{errors.address}</p>
//             )}
//           </div>

//           {/* BUTTONS */}
//           <div className="flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={handleReset}
//               className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//               disabled={loading}
//             >
//               Reset
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-[#043F79] text-white rounded-full hover:bg-[#032f5c] transition disabled:opacity-50 flex items-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
//                   Saving...
//                 </>
//               ) : (
//                 "Save Changes"
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
import { FiCamera, FiX } from "react-icons/fi";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { useProfileStore } from "@/stores/profileStore";
import { API } from "@/app/api/axios";
import { toast } from "react-toastify";

interface EditProfileProps {
  profile: {
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

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export default function EditProfile({
  profile,
  onClose,
  onSave,
}: EditProfileProps) {
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<any>(null);
  const phoneContainerRef = useRef<HTMLDivElement>(null);

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
    if (imgPath.startsWith("http")) return imgPath;
    const cleanedPath = imgPath.replace(/^\/uploads/, "");
    return `${IMAGE_BASE_URL}${cleanedPath}?v=${Date.now()}`;
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

    if (itiRef.current) {
      itiRef.current.destroy();
      itiRef.current = null;
    }

    // Create a container for the phone input
    const container = phoneContainerRef.current;

    // Initialize intl-tel-input
    itiRef.current = intlTelInput(phoneRef.current, {
      separateDialCode: true,
      initialCountry: "in",
      utilsScript:
        "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js",
      customContainer: "w-full", // Make it full width
    });

    // Set initial phone number
    if (profile?.phone && profile?.countryCode) {
      const fullNumber = `${profile.countryCode}${profile.phone}`;
      itiRef.current.setNumber(fullNumber);
    } else if (profile?.phone) {
      itiRef.current.setNumber(profile.phone);
    }

    const handlePhoneChange = () => {
      if (!itiRef.current) return;

      const country = itiRef.current.getSelectedCountryData();
      const dialCode = `+${country.dialCode}`;
      setCountryCode(dialCode);

      // Get the national number (without country code)
      let nationalNumber = "";
      if (typeof window !== "undefined" && window.intlTelInputUtils) {
        nationalNumber = itiRef.current.getNumber(
          window.intlTelInputUtils.numberFormat.NATIONAL,
        );
      } else {
        const fullNumber = itiRef.current.getNumber();
        if (fullNumber && country.dialCode) {
          nationalNumber = fullNumber
            .replace(`+${country.dialCode}`, "")
            .trim();
        }
      }

      // Clean the national number - remove non-digits and leading zeros
      nationalNumber = nationalNumber.replace(/\D/g, "");
      if (nationalNumber.startsWith("0")) {
        nationalNumber = nationalNumber.substring(1);
      }

      setFormData((prev) => ({
        ...prev,
        phone: nationalNumber || "",
      }));
    };

    phoneRef.current.addEventListener("input", handlePhoneChange);
    phoneRef.current.addEventListener("countrychange", handlePhoneChange);

    // Initial call
    setTimeout(handlePhoneChange, 100);

    return () => {
      phoneRef.current?.removeEventListener("input", handlePhoneChange);
      phoneRef.current?.removeEventListener("countrychange", handlePhoneChange);
      if (itiRef.current) {
        itiRef.current.destroy();
      }
    };
  }, [profile]);

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

    if (itiRef.current && profile.phone && profile.countryCode) {
      const fullNumber = `${profile.countryCode}${profile.phone}`;
      itiRef.current.setNumber(fullNumber);
    }
    setErrors({});
  };

  // ---------------- SAVE PROFILE ----------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // --------- FRONTEND VALIDATION ---------
      const newErrors: Record<string, string> = {};
      if (!formData.firstname.trim())
        newErrors.firstname = "First name required";
      if (!formData.lastname.trim()) newErrors.lastname = "Last name required";
      if (!formData.address.trim()) newErrors.address = "Address required";

      // Get phone number
      let phoneNumber = formData.phone.trim();

      // Validate phone
      if (!phoneNumber || phoneNumber.length < 5) {
        newErrors.phone = "Valid phone number required";
      }

      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

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

      // Check if parent component provided onSave prop
      if (onSave) {
        const result = await onSave(data);

        if (result?.success) {
          // Update local store with the returned profile
          if (result.profile) {
            setProfile(result.profile);

            // Update image URL
            if (result.profile.profileImage) {
              const imgUrl = getFullImageUrl(result.profile.profileImage);
              setProfileImageUrl(imgUrl);
            }
          }

          toast.success("Profile updated successfully");
          onClose();
        } else if (result?.errors) {
          // Handle validation errors from parent
          const backendErrors: Record<string, string> = {};
          result.errors.forEach((err: any) => {
            backendErrors[err.param] = err.msg;
          });
          setErrors(backendErrors);
        } else if (result?.error) {
          setErrors({ general: result.error });
        }
        return;
      }

      // --------- SEND TO BACKEND DIRECTLY ---------
      const res = await API.put("/api/profile", data, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // --------- HANDLE SUCCESS ---------
      if (res.data.user) {
        const updatedUser = res.data.user;

        // Create updated profile object
        const updatedProfile = {
          id: updatedUser.id || updatedUser._id || profile?.id,
          firstname: updatedUser.firstname || formData.firstname,
          lastname: updatedUser.lastname || formData.lastname,
          name: `${updatedUser.firstname || formData.firstname} ${updatedUser.lastname || formData.lastname}`.trim(),
          email: updatedUser.email || profile?.email || "",
          phone: updatedUser.mobile || phoneNumber,
          address: updatedUser.address || formData.address,
          countryCode: updatedUser.countryCode || countryCode,
          profileImage: updatedUser.profileImage || profile?.profileImage,
        };

        // UPDATE ZUSTAND STORE
        setProfile(updatedProfile);

        // Update profile image URL
        const newImageUrl = getFullImageUrl(updatedUser.profileImage);
        setProfileImageUrl(newImageUrl);

        toast.success("Profile updated successfully");
        onClose();
      } else {
        console.error("Unexpected response:", res.data);
        setErrors({ general: "Unexpected response from server" });
      }
    } catch (err: any) {
      console.error("Save failed:", err);

      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((err: any) => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
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
