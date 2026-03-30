import { useEffect, useState } from "react";
import { mfService } from "@/services/mfService";

export interface PopularFundRow {
  _id: string;
  scheme_code?: string;
  fund_name: string;
  min_investment?: number | null;
  min_sip_investment?: number | null;
  min_lumpsum_investment?: number | null;
  returns?: {
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
  };
  amc_id?: { name?: string };
  category_id?: { name?: string };
}

interface UsePopularFundsOptions {
  fallbackToTopPerformers?: boolean;
}

export const usePopularFunds = (
  params?: Record<string, unknown>,
  options?: UsePopularFundsOptions,
) => {
  const [popularFunds, setPopularFunds] = useState<PopularFundRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestKey = JSON.stringify(params || {});
  const shouldFallback = options?.fallbackToTopPerformers === true;

  useEffect(() => {
    const parsedParams =
      (JSON.parse(requestKey || "{}") as Record<string, unknown>) || {};
    const requestParams = {
      is_active: 1,
      limit: 50,
      ...parsedParams,
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await mfService.getPopularFunds(requestParams);
        const items = Array.isArray(res?.data) ? res.data : res?.data || [];
        if (items.length > 0) {
          setPopularFunds(items);
          return;
        }

        if (!shouldFallback) {
          setPopularFunds([]);
          return;
        }

        const fallback = await mfService.getFunds({
          sort: "returns_y3",
          limit: requestParams.limit || 10,
          is_active: 1,
        });
        const fallbackItems = Array.isArray(fallback?.data)
          ? fallback.data
          : fallback?.data || [];
        setPopularFunds(fallbackItems);
      } catch {
        setError("Failed to load popular funds");
        setPopularFunds([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [requestKey, shouldFallback]);

  return { popularFunds, loading, error };
};
