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

const pickPayload = (raw: any) => raw?.user || raw?.data || raw;

const normalizeProfileImage = (image?: string): string | null => {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

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

  // If backend already returns full upload path, preserve it.
  if (cleanImage.startsWith("uploads/profiles/")) {
    const fileName = cleanImage.replace("uploads/profiles/", "");
    return `${IMAGE_BASE}/profiles/${fileName}?v=${Date.now()}`;
  }

  // Normalize to filename and construct full URL.
  const fileName = cleanImage.split("/").filter(Boolean).pop() ?? cleanImage;
  return `${IMAGE_BASE}/profiles/${fileName}?v=${Date.now()}`;
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
      const { data } = await API.get("/api/user/profile/me", {
        withCredentials: true,
      });
      const payload = pickPayload(data);

      console.log("Fetched profile data:", payload);

      const rawPhone = payload.mobile || payload.phone || "";
      const countryCode = payload.countryCode || "+91";

      const userProfile: UserProfile = {
        id: payload.id || payload._id,
        firstname: payload.firstname || "",
        lastname: payload.lastname || "",
        name: `${payload.firstname || ""} ${payload.lastname || ""}`.trim(),
        email: payload.email || "",
        phone: rawPhone,
        address: payload.address || "",
        profileImage: payload.profileImage || undefined,
        countryCode,
      };

      console.log("Setting profile in store:", userProfile);

      setProfile(userProfile);

      // Set image URL
      const imageUrl = normalizeProfileImage(payload.profileImage);
      console.log("Setting profile image URL:", imageUrl);
      setProfileImageUrl(imageUrl);

      setError(null);
    } catch (err: any) {
      const status = err?.response?.status;

      // Treat unauthorized/forbidden as logged-out session.
      if (status === 401 || status === 403) {
        console.log(
          "User session unavailable (401/403). Skipping profile fetch error.",
        );
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

      const res = await API.put("/api/user/profile", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Update response:", res.data);

      const updatedUser = pickPayload(res.data);

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
      const imageUrl = normalizeProfileImage(updatedUser.profileImage);

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
