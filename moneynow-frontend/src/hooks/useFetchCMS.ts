"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const useFetchCMS = (slug: string) => {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !API_BASE) return;

    const fetchPage = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/cmspages?slug=${slug}`
        );

        if (!res.ok) throw new Error("Failed to fetch CMS page");

        const data = await res.json();

        if (!data.success || !data.pages?.length) {
          throw new Error("Page not found");
        }

        const matchedPage = data.pages.find((p: any) => p.slug === slug);

        if (!matchedPage) {
          throw new Error("Requested page not found");
        }

        setPage(matchedPage);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  return { page, loading, error };
};
