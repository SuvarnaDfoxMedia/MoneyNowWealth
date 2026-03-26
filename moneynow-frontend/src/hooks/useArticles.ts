

//   return {
//     articles,
//     loading,
//     error,
//     total,
//     totalPages,
//     getImageUrl,
//     refetch: fetchArticles,
//   };
// }

import { useEffect, useState } from "react";
import { API } from "@/app/api/axios";

interface Article {
  id: string;
  title: string;
  slug: string;
  introduction: string;
  hero_image?: string;
  read_time: number;
  author?: string;
  created_at: string;
  topic_id: {
    title: string;
    topic_code: string;
  };
}

export function useArticles(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchArticles();
  }, [params?.page, params?.limit, params?.status]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data: response } = await API.get("/api/articles", { params });

      if (response.success) {
        setArticles(response.articles || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "/images/default-article.jpg";

    if (imagePath.startsWith("http")) return imagePath;

    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/hero/${imagePath}`;
  };

  return {
    articles,
    loading,
    error,
    total,
    totalPages,
    getImageUrl,
    refetch: fetchArticles,
  };
}
