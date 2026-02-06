import { useState, useEffect } from "react";
import { API } from "@/app/api/axios";

export interface CardData {
  slug: string;
  imageSrc: string;
  category: string;
  title: string;
  description: string;
  published_at: string; // topic publish date
  author: string;
}

const IMAGE_BASE = API.defaults.baseURL + "/uploads";

export const useFetchCards = (
  endpoint: string,
  limit: number = 3
) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
const { data } = await API.get("/api/topic/published");
        const clusters = Array.isArray(data)
          ? data
          : Array.isArray(data?.clusters)
          ? data.clusters
          : [];

        if (!clusters.length) {
          setCards([]);
          return;
        }

        /**
         * Collect all published topics
         */
        const publishedTopics = clusters.flatMap((cluster: any) =>
          Array.isArray(cluster.topics)
            ? cluster.topics
                .filter(
                  (topic: any) =>
                    topic.status === "published" &&
                    topic.is_active === 1 &&
                    topic.publish_date &&
                    Array.isArray(topic.articles) &&
                    topic.articles.length > 0
                )
                .map((topic: any) => ({
                  ...topic,
                  clusterTitle: cluster.title,
                }))
            : []
        );

        if (!publishedTopics.length) {
          setCards([]);
          return;
        }

        /**
         * Sort topics by topic.publish_date (DESC)
         */
        publishedTopics.sort(
          (a: any, b: any) =>
            new Date(b.publish_date).getTime() -
            new Date(a.publish_date).getTime()
        );

        /**
         * Limit results
         */
        const latestTopics = publishedTopics.slice(0, limit);

        /**
         * Format for UI
         */
        const formattedCards: CardData[] = latestTopics.map((topic: any) => {
          const article = topic.articles[0]; // first article only

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
            slug: topic.slug,
            imageSrc,
            category: topic.clusterTitle || "General",
            title: topic.title,
            description,
            published_at: topic.publish_date, //  topic publish date
            author: article?.author || "Team Money Now",
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
