"use client";

import { useEffect, useState } from "react";

interface UseFetchCMSResult {
  page: any;
  loading: boolean;
  error: string | null;
}

export const useFetchCMS = (slug: string): UseFetchCMSResult => {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    if (!slug || !API_BASE) return;

    let active = true;

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/api/cmspages/slug/${slug}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch CMS page (${res.status})`);
        }

        const data = await res.json();

        if (!data.success || !data.page) {
          throw new Error("CMS page not found");
        }

        if (active) {
          setPage(data.page);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPage();

    return () => {
      active = false;
    };
  }, [slug, API_BASE]);

  return { page, loading, error };
};
