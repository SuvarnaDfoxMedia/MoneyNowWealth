"use client";

import { useCallback, useEffect, useState } from "react";

interface UseRefreshSignalOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export const useRefreshSignal = ({
  enabled = true,
  intervalMs = 0,
}: UseRefreshSignalOptions = {}) => {
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTick((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleFocus = () => refresh();
    const handleOnline = () => refresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0 || typeof window === "undefined") return;

    const timer = window.setInterval(() => {
      refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, refresh]);

  return { refreshTick, refresh };
};

