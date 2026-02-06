// import { useEffect, useState } from "react";
// import { API } from "@/app/api/axios";

// export interface UserProfile {
//   firstname: string;
//   lastname: string;
//   name: string;        // full name for display
//   email: string;
//   phone: string;       // phone number without country code
//   address?: string;
//   profileImage?: string;
//   countryCode?: string; // +91, +1 etc.
// }

// const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// /**
//  * Normalize backend profile image path to full URL
//  */
// const normalizeProfileImage = (image?: string): string | null => {
//   if (!image) return null;

//   let cleanImage = image.replace(/\\/g, "/");   // replace backslashes with slashes
//   cleanImage = cleanImage.replace(/^\/+/, "");  // remove leading slashes

//   // Remove redundant folders
//   if (cleanImage.startsWith("uploads/")) cleanImage = cleanImage.replace("uploads/", "");
//   if (cleanImage.startsWith("profiles/")) cleanImage = cleanImage.replace("profiles/", "");

//   return `${IMAGE_BASE}/profiles/${cleanImage}?v=${Date.now()}`;
// };

// /**
//  * Custom hook to fetch user profile
//  */
// export const useFetchProfile = () => {
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const { data } = await API.get("/api/get-profile", {
//           withCredentials: true,
//         });

//         // Ensure phone is separate from country code for easier editing
//         const rawPhone = data.phone ?? "";
//         const countryCode = data.countryCode ?? "+91";

//         const userProfile: UserProfile = {
//           firstname: data.firstname ?? "",
//           lastname: data.lastname ?? "",
//           name: `${data.firstname ?? ""} ${data.lastname ?? ""}`.trim(),
//           email: data.email ?? "",
//           phone: rawPhone, // only number, without country code
//           address: data.address ?? "",
//           profileImage: data.profileImage ?? undefined,
//           countryCode,
//         };

//         setProfile(userProfile);
//         setProfileImageUrl(normalizeProfileImage(data.profileImage));
//       } catch (err: any) {
//         console.error("Failed to fetch profile:", err);
//         setError(err?.message || "Failed to fetch profile");
//         setProfile(null);
//         setProfileImageUrl(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, []);

//   return {
//     profile,
//     profileImageUrl,
//     loading,
//     error,
//   };
// };

// hooks/useProfile.ts

// import { useEffect, useCallback, useState } from "react";
// import { API } from "@/app/api/axios";
// import { useProfileStore } from "@/stores/profileStore";

// export interface UserProfile {
//   firstname: string;
//   lastname: string;
//   name: string;        // full name for display
//   email: string;
//   phone: string;       // phone number without country code
//   address?: string;
//   profileImage?: string;
//   countryCode?: string; // +91, +1 etc.
// }

// const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// /**
//  * Normalize backend profile image path to full URL
//  */
// const normalizeProfileImage = (image?: string): string | null => {
//   if (!image) return null;

//   let cleanImage = image.replace(/\\/g, "/");   // replace backslashes
//   cleanImage = cleanImage.replace(/^\/+/, "");  // remove leading slashes

//   if (cleanImage.startsWith("uploads/")) cleanImage = cleanImage.replace("uploads/", "");
//   if (cleanImage.startsWith("profiles/")) cleanImage = cleanImage.replace("profiles/", "");

//   return `${IMAGE_BASE}/profiles/${cleanImage}?v=${Date.now()}`;
// };

// /**
//  * Custom hook to fetch user profile and populate Zustand store
//  */
// export const useFetchProfile = () => {
//   const {
//     profile,
//     profileImageUrl,
//     setProfile,
//     setProfileImageUrl,
//   } = useProfileStore();

//   const [loading, setLoading] = useState(!profile);
//   const [error, setError] = useState<string | null>(null);

//   const fetchProfile = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data } = await API.get("/api/get-profile", { withCredentials: true });

//       const rawPhone = data.phone ?? "";
//       const countryCode = data.countryCode ?? "+91";

//     const userProfile = {
//   firstname: data.firstname ?? "",
//   lastname: data.lastname ?? "",
//   email: data.email ?? "",
//   phone: rawPhone,
//   address: data.address ?? "",
//   profileImage: data.profileImage ?? undefined,
//   countryCode,
// };

// setProfile(userProfile);
// setProfileImageUrl(normalizeProfileImage(data.profileImage));

//       setError(null);
//     } catch (err: any) {
//       console.error("Failed to fetch profile:", err);
//       setError(err?.message || "Failed to fetch profile");
//       setProfile(null);
//       setProfileImageUrl(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [setProfile, setProfileImageUrl]);

//   useEffect(() => {
//     if (!profile) fetchProfile(); // only fetch if store is empty
//   }, [fetchProfile, profile]);

//   return {
//     profile,
//     profileImageUrl,
//     loading,
//     error,
//     refetch: fetchProfile, // allow manual refresh
//   };
// };

// hooks/useProfile.ts (updated)
// import { useEffect, useCallback, useState } from "react";
// import { API } from "@/app/api/axios";
// import { useProfileStore } from "@/stores/profileStore";

// export interface UserProfile {
//   id?: string; // Add user ID here
//   firstname: string;
//   lastname: string;
//   name: string;
//   email: string;
//   phone: string;
//   address?: string;
//   profileImage?: string;
//   countryCode?: string;
// }

// const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// const normalizeProfileImage = (image?: string): string | null => {
//   if (!image) return null;
//   let cleanImage = image.replace(/\\/g, "/");
//   cleanImage = cleanImage.replace(/^\/+/, "");
//   if (cleanImage.startsWith("uploads/"))
//     cleanImage = cleanImage.replace("uploads/", "");
//   if (cleanImage.startsWith("profiles/"))
//     cleanImage = cleanImage.replace("profiles/", "");
//   return `${IMAGE_BASE}/profiles/${cleanImage}?v=${Date.now()}`;
// };

// export const useFetchProfile = () => {
//   const { profile, profileImageUrl, setProfile, setProfileImageUrl } =
//     useProfileStore();

//   const [loading, setLoading] = useState(!profile);
//   const [error, setError] = useState<string | null>(null);

//   const fetchProfile = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data } = await API.get("/api/get-profile", {
//         withCredentials: true,
//       });

//       const rawPhone = data.phone ?? "";
//       const countryCode = data.countryCode ?? "+91";

//       const userProfile: UserProfile = {
//         id: data.id || data._id, // Include user ID
//         firstname: data.firstname ?? "",
//         lastname: data.lastname ?? "",
//         name: `${data.firstname ?? ""} ${data.lastname ?? ""}`.trim(),
//         email: data.email ?? "",
//         phone: rawPhone,
//         address: data.address ?? "",
//         profileImage: data.profileImage ?? undefined,
//         countryCode,
//       };

//       setProfile(userProfile);
//       setProfileImageUrl(normalizeProfileImage(data.profileImage));
//       setError(null);
//     } catch (err: any) {
//       console.error("Failed to fetch profile:", err);
//       setError(err?.message || "Failed to fetch profile");
//       setProfile(null);
//       setProfileImageUrl(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [setProfile, setProfileImageUrl]);

//   useEffect(() => {
//     if (!profile) fetchProfile();
//   }, [fetchProfile, profile]);

//   return {
//     profile,
//     profileImageUrl,
//     loading,
//     error,
//     refetch: fetchProfile,
//   };
// };

// import { useEffect, useCallback, useState } from "react";
// import { API } from "@/app/api/axios";
// import { useProfileStore } from "@/stores/profileStore";

// export interface UserProfile {
//   id?: string;
//   firstname: string;
//   lastname: string;
//   name: string;
//   email: string;
//   phone: string;
//   address?: string;
//   profileImage?: string;
//   countryCode?: string;
// }

// const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// const normalizeProfileImage = (image?: string): string | null => {
//   if (!image) return null;

//   // Remove backslashes and normalize slashes
//   let cleanImage = image.replace(/\\/g, "/");

//   // Remove leading slashes
//   cleanImage = cleanImage.replace(/^\/+/, "");

//   // Remove uploads/profiles prefixes if present
//   if (cleanImage.startsWith("uploads/profiles/")) {
//     cleanImage = cleanImage.replace("uploads/profiles/", "");
//   } else if (cleanImage.startsWith("uploads/")) {
//     cleanImage = cleanImage.replace("uploads/", "");
//   } else if (cleanImage.startsWith("profiles/")) {
//     cleanImage = cleanImage.replace("profiles/", "");
//   }

//   // Return full URL with cache busting
//   return `${IMAGE_BASE}/profiles/${cleanImage}?v=${Date.now()}`;
// };

// export const useFetchProfile = () => {
//   const { profile, profileImageUrl, setProfile, setProfileImageUrl } =
//     useProfileStore();

//   const [loading, setLoading] = useState(!profile);
//   const [error, setError] = useState<string | null>(null);

//   const fetchProfile = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data } = await API.get("/api/get-profile", {
//         withCredentials: true,
//       });

//       console.log("Fetched profile data:", data);

//       const rawPhone = data.mobile || data.phone || "";
//       const countryCode = data.countryCode || "+91";

//       const userProfile: UserProfile = {
//         id: data.id || data._id,
//         firstname: data.firstname || "",
//         lastname: data.lastname || "",
//         name: `${data.firstname || ""} ${data.lastname || ""}`.trim(),
//         email: data.email || "",
//         phone: rawPhone,
//         address: data.address || "",
//         profileImage: data.profileImage || undefined,
//         countryCode,
//       };

//       console.log("Setting profile in store:", userProfile);

//       setProfile(userProfile);

//       // Set image URL
//       const imageUrl = normalizeProfileImage(data.profileImage);
//       console.log("Setting profile image URL:", imageUrl);
//       setProfileImageUrl(imageUrl);

//       setError(null);
//     } catch (err: any) {
//       console.error("Failed to fetch profile:", err);
//       setError(err?.message || "Failed to fetch profile");
//       setProfile(null);
//       setProfileImageUrl(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [setProfile, setProfileImageUrl]);

//   useEffect(() => {
//     fetchProfile();
//   }, [fetchProfile]);

//   return {
//     profile,
//     profileImageUrl,
//     loading,
//     error,
//     refetch: fetchProfile,
//   };
// };

// // Custom hook for updating profile
// export const useUpdateProfile = () => {
//   const { setProfile, setProfileImageUrl, profile, updateProfile } =
//     useProfileStore();

//   const updateProfileData = async (formData: FormData) => {
//     try {
//       console.log("Updating profile with data:");
//       for (let [key, value] of formData.entries()) {
//         console.log(key, value);
//       }

//       const res = await API.put("/api/profile", formData, {
//         withCredentials: true,
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       console.log("Update response:", res.data);

//       const updatedUser = res.data.user;

//       // Create updated profile object
//       const updatedProfile: UserProfile = {
//         id: updatedUser.id || updatedUser._id || profile?.id,
//         firstname: updatedUser.firstname || "",
//         lastname: updatedUser.lastname || "",
//         name: `${updatedUser.firstname || ""} ${updatedUser.lastname || ""}`.trim(),
//         email: updatedUser.email || profile?.email || "",
//         phone: updatedUser.mobile || updatedUser.phone || "",
//         address: updatedUser.address || "",
//         countryCode: updatedUser.countryCode || "+91",
//         profileImage: updatedUser.profileImage || profile?.profileImage,
//       };

//       console.log("Updated profile object:", updatedProfile);

//       // Update the store
//       setProfile(updatedProfile);

//       // Update image URL
//       const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
//       let imageUrl = null;
//       if (updatedUser.profileImage) {
//         if (updatedUser.profileImage.startsWith("http")) {
//           imageUrl = updatedUser.profileImage;
//         } else {
//           // Clean the image path
//           let cleanPath = updatedUser.profileImage.replace(/^\/+/, "");
//           if (cleanPath.startsWith("uploads/profiles/")) {
//             cleanPath = cleanPath.replace("uploads/profiles/", "");
//           } else if (cleanPath.startsWith("profiles/")) {
//             cleanPath = cleanPath.replace("profiles/", "");
//           }
//           imageUrl = `${IMAGE_BASE}/profiles/${cleanPath}?v=${Date.now()}`;
//         }
//       }
//       console.log("Setting new image URL:", imageUrl);
//       setProfileImageUrl(imageUrl);

//       return { success: true, data: res.data, profile: updatedProfile };
//     } catch (error: any) {
//       console.error("Update error:", error);
//       return {
//         success: false,
//         error: error.response?.data?.message || "Failed to update profile",
//         errors: error.response?.data?.errors,
//       };
//     }
//   };

//   return { updateProfile: updateProfileData };
// };

import { useEffect, useCallback, useState } from "react";
import { API } from "@/app/api/axios";
import { useProfileStore } from "@/stores/profileStore";

export interface UserProfile {
  id?: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  profileImage?: string;
  countryCode?: string;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

const normalizeProfileImage = (image?: string): string | null => {
  if (!image) return null;

  // Remove backslashes and normalize slashes
  let cleanImage = image.replace(/\\/g, "/");

  // Remove leading slashes
  cleanImage = cleanImage.replace(/^\/+/, "");

  // Remove uploads/profiles prefixes if present
  if (cleanImage.startsWith("uploads/profiles/")) {
    cleanImage = cleanImage.replace("uploads/profiles/", "");
  } else if (cleanImage.startsWith("uploads/")) {
    cleanImage = cleanImage.replace("uploads/", "");
  } else if (cleanImage.startsWith("profiles/")) {
    cleanImage = cleanImage.replace("profiles/", "");
  }

  // Return full URL with cache busting
  return `${IMAGE_BASE}/profiles/${cleanImage}?v=${Date.now()}`;
};

export const useFetchProfile = () => {
  const { profile, profileImageUrl, setProfile, setProfileImageUrl } =
    useProfileStore();

  const [loading, setLoading] = useState(!profile);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await API.get("/api/get-profile", {
        withCredentials: true,
      });

      console.log("Fetched profile data:", data);

      const rawPhone = data.mobile || data.phone || "";
      const countryCode = data.countryCode || "+91";

      const userProfile: UserProfile = {
        id: data.id || data._id,
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        name: `${data.firstname || ""} ${data.lastname || ""}`.trim(),
        email: data.email || "",
        phone: rawPhone,
        address: data.address || "",
        profileImage: data.profileImage || undefined,
        countryCode,
      };

      console.log("Setting profile in store:", userProfile);

      setProfile(userProfile);

      // Set image URL
      const imageUrl = normalizeProfileImage(data.profileImage);
      console.log("Setting profile image URL:", imageUrl);
      setProfileImageUrl(imageUrl);

      setError(null);
    } catch (err: any) {
      const status = err?.response?.status;

      //  IMPORTANT FIX: If user is not logged in, don't show error on homepage
      if (status === 401) {
        console.log("User not logged in (401). Skipping profile fetch error.");
        setProfile(null);
        setProfileImageUrl(null);
        setError(null);
        return;
      }

      console.error("Failed to fetch profile:", err);
      setError(err?.message || "Failed to fetch profile");
      setProfile(null);
      setProfileImageUrl(null);
    } finally {
      setLoading(false);
    }
  }, [setProfile, setProfileImageUrl]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    profileImageUrl,
    loading,
    error,
    refetch: fetchProfile,
  };
};

// Custom hook for updating profile
export const useUpdateProfile = () => {
  const { setProfile, setProfileImageUrl, profile } = useProfileStore();

  const updateProfileData = async (formData: FormData) => {
    try {
      console.log("Updating profile with data:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const res = await API.put("/api/profile", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Update response:", res.data);

      const updatedUser = res.data.user;

      // Create updated profile object
      const updatedProfile: UserProfile = {
        id: updatedUser.id || updatedUser._id || profile?.id,
        firstname: updatedUser.firstname || "",
        lastname: updatedUser.lastname || "",
        name: `${updatedUser.firstname || ""} ${updatedUser.lastname || ""}`.trim(),
        email: updatedUser.email || profile?.email || "",
        phone: updatedUser.mobile || updatedUser.phone || "",
        address: updatedUser.address || "",
        countryCode: updatedUser.countryCode || "+91",
        profileImage: updatedUser.profileImage || profile?.profileImage,
      };

      console.log("Updated profile object:", updatedProfile);

      // Update the store
      setProfile(updatedProfile);

      // Update image URL
      let imageUrl: string | null = null;

      if (updatedUser.profileImage) {
        if (updatedUser.profileImage.startsWith("http")) {
          imageUrl = updatedUser.profileImage;
        } else {
          // Clean the image path
          let cleanPath = updatedUser.profileImage.replace(/^\/+/, "");

          if (cleanPath.startsWith("uploads/profiles/")) {
            cleanPath = cleanPath.replace("uploads/profiles/", "");
          } else if (cleanPath.startsWith("profiles/")) {
            cleanPath = cleanPath.replace("profiles/", "");
          }

          imageUrl = `${IMAGE_BASE}/profiles/${cleanPath}?v=${Date.now()}`;
        }
      }

      console.log("Setting new image URL:", imageUrl);
      setProfileImageUrl(imageUrl);

      return { success: true, data: res.data, profile: updatedProfile };
    } catch (error: any) {
      console.error("Update error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update profile",
        errors: error.response?.data?.errors,
      };
    }
  };

  return { updateProfile: updateProfileData };
};
