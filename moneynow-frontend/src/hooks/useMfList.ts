import { useEffect, useState } from "react";

type Fetcher<T> = (params?: Record<string, any>) => Promise<{
  data?: T[] | T;
}>;

export const useMfList = <T>(
  fetcher: Fetcher<T>,
  params?: Record<string, any>,
  errorMessage = "Failed to load data",
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetcher(params);
        const data = Array.isArray(res?.data) ? res.data : res?.data || [];
        setItems(data as T[]);
      } catch {
        setError(errorMessage);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetcher, JSON.stringify(params || {}), errorMessage]);

  return { items, loading, error };
};
