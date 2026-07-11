"use client";

import { useEffect, useState } from "react";
import { API } from "@/app/api/axios";
import { useRefreshSignal } from "./useRefreshSignal";

type ContentAccessLevel = "free" | "premium";


export const useContentAccess = () => {
  const [accessLevel, setAccessLevel] = useState<ContentAccessLevel>("free");
  const [resolved, setResolved] = useState(false);
  const { refreshTick } = useRefreshSignal();

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const { data } = await API.get("/api/subscriptions/me");
        const isPremium = data?.data?.isPremium === true || data?.isPremium === true;

        if (isPremium) {
          setAccessLevel("premium");
        } else {
          setAccessLevel("free");
        }
      } catch {
        setAccessLevel("free");
      } finally {
        setResolved(true);
      }
    };

    loadAccess();
  }, [refreshTick]);

  return {
    accessLevel,
    isPremium: accessLevel === "premium",
    resolved,
  };
};

