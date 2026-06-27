import { useState, useEffect, useRef } from "react";
import { API } from "@/app/api/axios";
import { useRefreshSignal } from "./useRefreshSignal";
import { useContentAccess } from "./useContentAccess";

export interface CardData {
  slug: string;
  imageSrc: string;
  category: string;
  title: string;
  description: string;
  published_at: string;
  author: string;
  created_at?: string;
  access_level?: string;
  content_type?: string;
  article_type?: string;
  plan_type?: string;
  is_premium?: boolean;
  isHomeFeatured?: boolean;
  isDashboardFeatured?: boolean;
  show_on_home?: boolean;
  show_on_dashboard?: boolean;
}

const IMAGE_BASE = API.defaults.baseURL + "/uploads";

export const useFetchCards = (
  endpoint: string,
  limit: number = 4,
  options?: {
    withCredentials?: boolean;
    forceFreeOnly?: boolean;
    visibilityField?: "isHomeFeatured" | "isDashboardFeatured" | "show_on_home" | "show_on_dashboard";
  },
) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const { refreshTick, refresh } = useRefreshSignal();
  const { accessLevel } = useContentAccess();
  const withCredentials = options?.withCredentials ?? true;
  const forceFreeOnly = options?.forceFreeOnly ?? false;
  const visibilityField = options?.visibilityField;

  useEffect(() => {
    const fetchData = async () => {
      const isInitialLoad = !hasLoadedRef.current;
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams: any = { limit };
        if (visibilityField === "show_on_home") queryParams.show_on_home = "true";
        if (visibilityField === "show_on_dashboard") queryParams.show_on_dashboard = "true";

        const { data } = await API.get(endpoint, {
          params: queryParams,
          withCredentials,
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
          hasLoadedRef.current = true;
          return;
        }

        const hasVisibilityField =
          visibilityField &&
          articles.some((article: any) =>
            Object.prototype.hasOwnProperty.call(article, visibilityField),
          );

        const filteredByVisibility = hasVisibilityField
          ? articles.filter((article: any) => Boolean(article?.[visibilityField]))
          : articles;

        const freeOnlyArticles = forceFreeOnly
          ? filteredByVisibility.filter((article: any) => {
              const level = String(
                article?.access_level ||
                  article?.content_type ||
                  article?.article_type ||
                  article?.plan_type ||
                  "",
              ).toLowerCase();

              const isPremiumFlag = Boolean(
                article?.is_premium === true || article?.premium === true,
              );

              if (isPremiumFlag) return false;
              if (!level) return true;

              return !level.includes("premium");
            })
          : filteredByVisibility;

        const formattedCards: CardData[] = freeOnlyArticles.map((article: any) => {
          const accessLevel = String(
            article?.access_level ||
              article?.content_type ||
              article?.article_type ||
              article?.plan_type ||
              "",
          ).toLowerCase();

          const isPremium = Boolean(
            article?.is_premium === true ||
              article?.premium === true ||
              accessLevel.includes("premium"),
          );

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

          const articlePublishDate = article.publish_date
            ? new Date(article.publish_date).getTime()
            : 0;
          const topicPublishDate = article.topic?.publish_date
            ? new Date(article.topic.publish_date).getTime()
            : 0;
          const effectivePublishedAt =
            articlePublishDate >= topicPublishDate
              ? article.publish_date
              : article.topic?.publish_date;

          return {
            slug: article.slug,
            imageSrc,
            category: article.cluster?.title || article.topic?.title || "General",
            title: article.title || article.topic?.title || "Untitled",
            description,
            published_at:
              effectivePublishedAt ||
              article.created_at ||
              "",
            author: article.author || "Team Money Now",
            created_at: article.created_at,
            access_level: article?.access_level,
            content_type: article?.content_type,
            article_type: article?.article_type,
            plan_type: article?.plan_type,
            is_premium: isPremium,
            premium: isPremium,
            isHomeFeatured: Boolean(article?.isHomeFeatured),
            isDashboardFeatured: Boolean(article?.isDashboardFeatured),
            show_on_home: Boolean(article?.show_on_home),
            show_on_dashboard: Boolean(article?.show_on_dashboard),
          };
        });

        setCards(formattedCards);
        hasLoadedRef.current = true;
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
        if (!hasLoadedRef.current) {
          setCards([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [
    endpoint,
    limit,
    refreshTick,
    accessLevel,
    withCredentials,
    forceFreeOnly,
    visibilityField,
  ]);

  return { cards, loading, error, refetch: refresh };
};
