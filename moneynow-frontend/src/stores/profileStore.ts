

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { UserProfile } from "@/hooks/useProfile";

interface ProfileStore {
  profile: UserProfile | null;
  profileImageUrl: string | null;
  setProfile: (profile: UserProfile | null) => void;
  setProfileImageUrl: (url: string | null) => void;
  updateProfileField: (field: keyof UserProfile, value: any) => void;
  clearProfile: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      (set) => ({
        profile: null,
        profileImageUrl: null,

        setProfile: (profile) => set({ profile }),

        setProfileImageUrl: (url) => set({ profileImageUrl: url }),

        updateProfileField: (field, value) =>
          set((state) => ({
            profile: state.profile
              ? { ...state.profile, [field]: value }
              : null,
          })),

        updateProfile: (updates) =>
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
          })),

        clearProfile: () => set({ profile: null, profileImageUrl: null }),
      }),
      {
        name: "profile-storage",
      },
    ),
  ),
);
