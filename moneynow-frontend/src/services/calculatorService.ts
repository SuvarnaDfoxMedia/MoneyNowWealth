import { useState } from "react";

export const useCalculator = <T, R>(
  apiFn: (payload: T) => Promise<{ data: R }>
) => {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (payload: T) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFn(payload);
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, calculate };
};
