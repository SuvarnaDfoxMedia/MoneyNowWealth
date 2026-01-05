import { useState, useEffect } from "react";
import { API } from "@/app/api/axios";

export interface CardData {
  slug: string;
  imageSrc: string;
  category: string;
  title: string;
  description: string;
  created_at?: string;
  author?: string;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL as string;

export const useFetchCards = (endpoint: string, limit: number = 3) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await API.get(endpoint);

        if (!data.success || !Array.isArray(data.clusters)) {
          setCards([]);
          setError("Invalid API response");
          return;
        }

        const allTopics = data.clusters.flatMap((cluster: any) =>
          Array.isArray(cluster.topics)
            ? cluster.topics.map((topic: any) => ({
                ...topic,
                clusterTitle: cluster.title,
              }))
            : []
        );

        const publishedTopics = allTopics.filter(
          (t: any) => t.status === "published" && t.is_active === 1
        );

        publishedTopics.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        const latestTopics = publishedTopics.slice(0, limit);

        const formattedCards: CardData[] = latestTopics.map((topic: any) => {
          const article = topic.articles?.[0];

          let imageSrc = "/no-image.png";
          if (article?.hero_image) {
            const fileName = article.hero_image
              .replace(/\\/g, "/")
              .split("/")
              .pop();
            imageSrc = `${IMAGE_BASE}/hero/${fileName}`;
          }

          const description = article?.introduction
            ? article.introduction
                .replace(/<[^>]+>/g, "")
                .split(" ")
                .slice(0, 30)
                .join(" ") + "..."
            : "";

          return {
            slug: topic.slug || "",
            imageSrc,
            category: topic.clusterTitle || "General",
            title: topic.title || "Untitled",
            description,
            created_at: topic.created_at || article?.created_at || "",
            author: article?.author || "Team Money Now",
          };
        });

        setCards(formattedCards);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, limit]);

  return { cards, loading, error };
};
