import { useEffect, useState } from "react";

type QueryParams = Record<string, unknown>;

type Fetcher<T> = (params?: QueryParams) => Promise<{
  data?: T[] | T;
}>;

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
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    const requestParams = (JSON.parse(paramsKey || "{}") as QueryParams) || {};

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher(requestParams);
        setItems(extractItems<T>(res));
      } catch {
        setError(errorMessage);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [errorMessage, fetcher, paramsKey]);

  return { items, loading, error };
};
