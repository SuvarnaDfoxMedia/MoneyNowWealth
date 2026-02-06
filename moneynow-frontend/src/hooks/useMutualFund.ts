"use client";

import { useState, useCallback } from "react";

export type MFInput = {
  scheme: string;
};

export type MFRow = {
  fundName: string;
  oneYear: number;
  threeYear: number;
  fiveYear: number;
  inception: number;
  rank: string;
};

export function useMutualFund() {
  const [data, setData] = useState<MFRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFund = useCallback(async (input: MFInput) => {
    setLoading(true);

    try {
      const res = await fetch(
        `https://mfapi.advisorkhoj.com/getSchemeInfoLatest?key=42842c3f-57f9-4444-8dc8-953c1183e99b&scheme=${encodeURIComponent(
          input.scheme,
        )}`,
        { method: "POST" },
      );

      const json = await res.json();

      const perf = json?.scheme_performance_list?.[0];
      if (!perf) return;

      const row: MFRow = {
        fundName: json.scheme_name,
        oneYear: perf.one_year_return,
        threeYear: perf.three_year_return,
        fiveYear: perf.five_year_return,
        inception: perf.inception_year_return,
        rank: "—", // needs backend aggregation later
      };

      setData([row]);
    } catch (e) {
      console.error("MF API Error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchFund, data, loading };
}
