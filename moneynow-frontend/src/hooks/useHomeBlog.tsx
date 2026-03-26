import { useState, useEffect } from "react";
import { API } from "@/app/api/axios";

export interface CardData {
  slug: string;
  imageSrc: string;
  category: string;
  title: string;
  description: string;
  published_at: string;
  author: string;
  created_at?: string;
}

const IMAGE_BASE = API.defaults.baseURL + "/uploads";

export const useFetchCards = (
  endpoint: string,
  limit: number = 4,
) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await API.get(endpoint, {
          params: { limit },
        });

        const articles = Array.isArray(data)
          ? data
          : Array.isArray(data?.articles)
            ? data.articles
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.data?.articles)
                ? data.data.articles
                : [];

        if (!articles.length) {
          setCards([]);
          return;
        }

        const formattedCards: CardData[] = articles.map((article: any) => {
          let imageSrc = "/no-image.png";

          if (article.hero_image) {
            const fileName = article.hero_image
              .replace(/\\/g, "/")
              .split("/")
              .pop();

            imageSrc = `${IMAGE_BASE}/hero/${fileName}`;
          }

          const description = article.introduction
            ? article.introduction
                .replace(/<[^>]+>/g, "")
                .split(" ")
                .slice(0, 30)
                .join(" ") + "..."
            : "";

          return {
            slug: article.slug,
            imageSrc,
            category: article.cluster?.title || article.topic?.title || "General",
            title: article.topic?.title || article.title,
            description,
            published_at:
              article.topic?.publish_date ||
              article.publish_date ||
              article.created_at ||
              "",
            author: article.author || "Team Money Now",
            created_at: article.created_at,
          };
        });

        setCards(formattedCards);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, limit]);

  return { cards, loading, error };
};
