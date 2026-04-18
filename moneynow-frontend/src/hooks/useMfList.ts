import { useEffect, useRef, useState } from "react";
import { useRefreshSignal } from "./useRefreshSignal";

type QueryParams = Record<string, unknown>;

type Fetcher<T> = (params?: QueryParams) => Promise<{
  data?: T[] | T;
}>;

interface UseMfListOptions {
  enabled?: boolean;
  refreshIntervalMs?: number;
}

const extractItems = <T,>(response: { data?: T[] | T } | T[] | undefined | null) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.data && typeof response.data === "object") return [response.data] as T[];
  return [];
};

export const useMfList = <T>(
  fetcher: Fetcher<T>,
  params?: QueryParams,
  errorMessage = "Failed to load data",
  options?: UseMfListOptions,
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const paramsKey = JSON.stringify(params || {});
  const { refreshTick, refresh } = useRefreshSignal({
    enabled: options?.enabled !== false,
    intervalMs: options?.refreshIntervalMs || 0,
  });

  useEffect(() => {
    const requestParams = (JSON.parse(paramsKey || "{}") as QueryParams) || {};

    const load = async () => {
      const isInitialLoad = !hasLoadedRef.current;
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetcher(requestParams);
        setItems(extractItems<T>(res));
        hasLoadedRef.current = true;
      } catch {
        setError(errorMessage);
        if (!hasLoadedRef.current) {
          setItems([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };
    load();
  }, [errorMessage, fetcher, paramsKey, refreshTick]);

  return { items, loading, error, refetch: refresh };
};
