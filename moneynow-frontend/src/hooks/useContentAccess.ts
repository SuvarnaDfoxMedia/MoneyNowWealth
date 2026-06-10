"use client";

import { useEffect, useState } from "react";
import { API } from "@/app/api/axios";
import { useRefreshSignal } from "./useRefreshSignal";

type ContentAccessLevel = "free" | "premium";

const isActiveForFullEndDate = (value?: string) => {
  if (!value) return false;
  const endDate = new Date(value);
  const today = new Date();
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return endDate.getTime() >= today.getTime();
};

export const useContentAccess = () => {
  const [accessLevel, setAccessLevel] = useState<ContentAccessLevel>("free");
  const [resolved, setResolved] = useState(false);
  const { refreshTick } = useRefreshSignal();

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const { data } = await API.get("/api/subscriptions/me");
        const subscription = data?.subscription;

        const planType = String(
          subscription?.plan_type || subscription?.plan_id?.plan_type || "",
        ).toLowerCase();
        const status = String(subscription?.status || "").toLowerCase();
        const endDate = subscription?.end_date;

        if (
          planType === "premium" &&
          status !== "expired" &&
          isActiveForFullEndDate(endDate)
        ) {
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

