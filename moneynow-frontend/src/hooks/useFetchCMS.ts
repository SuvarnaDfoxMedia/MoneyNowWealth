"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
// Add all your static slugs here
const STATIC_SLUGS = ["about-us", "contact-us", "partner-with-us"];

export const useFetchCMS = (slug: string) => {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Skip if no slug/API or if the slug is marked as STATIC
    if (!slug || !API_BASE || STATIC_SLUGS.includes(slug)) {
      setLoading(false);
      setPage(null);
      return;
    }

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/cmspages/slug/${slug}`);

        // If the API returns 404, don't throw an error, just set page to null
        if (!res.ok) {
          setPage(null);
          return;
        }

        const result = await res.json();

        // If success is false or data is missing, treat it as "no page"
        if (!result.success || !result.data) {
          setPage(null);
        } else {
          setPage(result.data);
        }
      } catch (err: any) {
        // Only log actual network/system errors here
        console.error("CMS Network Error:", err);
        setError("Network error");
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  return { page, loading, error };
};
