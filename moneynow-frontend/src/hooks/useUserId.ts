// hooks/useUserId.ts

import { useEffect, useState } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { API } from "@/app/api/axios";

export const useUserId = () => {
  const profile = useProfileStore((state) => state.profile);

  const [userId, setUserId] = useState<string | null>(profile?.id ?? null);
  const [loading, setLoading] = useState(!profile?.id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      //  If already in store, no need API call
      if (profile?.id) {
        setUserId(profile.id);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await API.get("/api/auth/me", {
          withCredentials: true,
        });

        setUserId(data?.id || data?._id || null);
      } catch (err: any) {
        const status = err?.response?.status;

        //  401 means user is logged out → don't show red error
        if (status === 401) {
          setUserId(null);
          setError(null);
          return;
        }

        console.error("Failed to fetch user ID:", err);
        setError("Failed to get user information");
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, [profile?.id]);

  return { userId, loading, error };
};
