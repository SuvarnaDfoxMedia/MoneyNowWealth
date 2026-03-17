import { useEffect, useState } from "react";
import { mfService } from "@/services/mfService";

export interface PopularFundRow {
  _id: string;
  fund_name: string;
  returns?: { y3_cagr?: number | null };
  amc_id?: { name?: string };
}

export const usePopularFunds = (params?: Record<string, any>) => {
  const [popularFunds, setPopularFunds] = useState<PopularFundRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await mfService.getPopularFunds(params);
        const items = Array.isArray(res?.data) ? res.data : res?.data || [];
        if (items.length > 0) {
          setPopularFunds(items);
          return;
        }
        // Fallback: if no popular funds are tagged yet, show top performers.
        const fallback = await mfService.getFunds({ sort: "returns_y3", limit: params?.limit || 10 });
        const fallbackItems = Array.isArray(fallback?.data) ? fallback.data : fallback?.data || [];
        setPopularFunds(fallbackItems);
      } catch {
        setError("Failed to load popular funds");
        setPopularFunds([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [JSON.stringify(params || {})]);

  return { popularFunds, loading, error };
};
