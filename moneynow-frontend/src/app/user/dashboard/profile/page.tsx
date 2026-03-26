

"use client";

import { FiUser, FiMapPin, FiMail, FiPhone } from "react-icons/fi";
import { useState } from "react";
import { useFetchProfile, useUpdateProfile } from "@/hooks/useProfile";
import EditProfile from "@/components/Dashboard/EditProfile";
import { toast } from "react-hot-toast";

export default function UserProfilePage() {
  // Fetch profile from API and populate global store
  const { profile, profileImageUrl, loading, error, refetch } =
    useFetchProfile();

  // Use the update profile hook
  const { updateProfile } = useUpdateProfile();

  const [openEdit, setOpenEdit] = useState(false);

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSaveProfile = async (formData: FormData) => {
    const result = await updateProfile(formData);

    if (result.success) {
      toast.success("Profile updated successfully");
      setOpenEdit(false);

      setTimeout(() => {
        refetch();
      }, 500);

      return result;
    } else {
      return {
        success: false,
        error: result.error,
        errors: result.errors,
      };
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error || "No profile data found"}
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <>
      <div className="flex my-[50px] items-center justify-center px-4 font-inter">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[20px] font-semibold flex items-center gap-4">
              <FiUser className="text-blue-600" size={24} />
              Personal Information
            </h3>

            <button
              onClick={() => setOpenEdit(true)}
              className="px-5 py-2 text-[16px] font-medium text-white bg-[#043F79] rounded-full hover:bg-[#0651a3] transition"
            >
              Edit Profile
            </button>
          </div>

          {/* Card */}
          <div className="flex flex-col sm:flex-row items-start gap-12 p-6 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg w-full">
            {/* Avatar */}
            {profileImageUrl ? (
              <div className="h-28 w-28 overflow-hidden rounded-full flex-shrink-0 border-2 border-gray-300">
                <img
                  src={profileImageUrl}
                  alt="User"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.firstname + " " + profile.lastname,
                    )}&background=043F79&color=fff`;
                  }}
                />
              </div>
            ) : (
              <div className="h-28 w-28 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0 border-2 border-gray-300">
                <FiUser size={36} />
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 flex-1">
              <div className="flex flex-col">
                <p className="text-gray-600 mb-1 text-[16px] flex items-center gap-2">
                  <FiUser /> Name
                </p>
                <p className="text-gray-900 text-[16px] dark:text-white font-medium">
                  {profile.name ||
                    `${profile.firstname} ${profile.lastname}`.trim()}
                </p>
              </div>

              <div className="flex flex-col">
                <p className="text-gray-600 mb-1 text-[16px] flex items-center gap-1">
                  <FiMail /> Email
                </p>
                <p className="text-gray-900 text-[16px] dark:text-white break-all font-medium">
                  {profile.email}
                </p>
              </div>

              <div className="flex flex-col">
                <p className="text-gray-600 mb-1 text-[16px] flex items-center gap-1">
                  <FiPhone /> Phone
                </p>
                <p className="text-gray-900 text-[16px] dark:text-white font-medium">
                  {profile.countryCode ? `${profile.countryCode} ` : ""}
                  {profile.phone}
                </p>
              </div>

              <div className="flex flex-col">
                <p className="text-gray-600 mb-1 text-[16px] flex items-center gap-1">
                  <FiMapPin /> Address
                </p>
                <p className="text-gray-900 text-[16px] dark:text-white font-medium">
                  {profile.address || "No address provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {openEdit && (
        <EditProfile
          profile={profile}
          onClose={() => setOpenEdit(false)}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}
