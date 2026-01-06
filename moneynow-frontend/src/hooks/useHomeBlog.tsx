// import { useState, useEffect } from "react";
// import {API} from "@/app/api/axios";

// export interface CardData {
//   imageSrc: string;
//   category: string;
//   title: string;
//   description: string;
// }

// export const useFetchCards = (endpoint: string) => {
//   const [cards, setCards] = useState<CardData[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const { data } = await API.get(endpoint);

//         if (!data.success || !Array.isArray(data.clusters)) {
//           setCards([]);
//           return;
//         }

//         // Convert clustered topics → flat list
//         const allTopics = data.clusters.flatMap((cluster: any) =>
//           cluster.topics.map((topic: any) => ({
//             ...topic,
//             clusterTitle: cluster.title,
//           }))
//         );

//         // Filter published + active
//         const publishedTopics = allTopics.filter(
//           (t: any) => t.status === "published" && t.is_active === 1
//         );

//         // Sort by latest
//         publishedTopics.sort(
//           (a: any, b: any) =>
//             new Date(b.created_at).getTime() -
//             new Date(a.created_at).getTime()
//         );

//         // Take 3
//         const latestThree = publishedTopics.slice(0, 3);

//         // Convert into card format
//         const formattedCards = latestThree.map((topic: any) => {
//           const article = topic.articles?.[0];

//           let imageSrc = "/no-image.png";
//           if (article?.hero_image) {
//             const fileName = article.hero_image.replace(/\\/g, "/").split("/").pop();
//             imageSrc = `${API.defaults.baseURL}/uploads/hero/${fileName}`;
//           }

//           const description = article
//             ? article.introduction.replace(/<[^>]+>/g, "")
//                 .split(" ")
//                 .slice(0, 30)
//                 .join(" ") + "..."
//             : "";

//           return {
//             imageSrc,
//             category: topic.clusterTitle,
//             title: topic.title,
//             description,
//           };
//         });

//         setCards(formattedCards);
//       } catch (err: any) {
//         setError(err.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [endpoint]); // Dependency → refetch if endpoint changes

//   return { cards, loading, error };
// };



// import { useState, useEffect } from "react";
// import { API } from "@/app/api/axios";

// export interface CardData {
//   imageSrc: string;
//   category: string;
//   title: string;
//   description: string;
//   created_at?: string; //  Added blog date
// }

// export const useFetchCards = (endpoint: string, limit: number = 3) => {
//   const [cards, setCards] = useState<CardData[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const { data } = await API.get(endpoint);

//         if (!data.success || !Array.isArray(data.clusters)) {
//           setCards([]);
//           setError("Invalid API response");
//           return;
//         }

//         // Flatten clusters → topics with clusterTitle
//         const allTopics = data.clusters.flatMap((cluster: any) =>
//           Array.isArray(cluster.topics)
//             ? cluster.topics.map((topic: any) => ({
//                 ...topic,
//                 clusterTitle: cluster.title,
//               }))
//             : []
//         );

//         // Filter published + active
//         const publishedTopics = allTopics.filter(
//           (t: any) => t.status === "published" && t.is_active === 1
//         );

//         // Sort by created_at descending
//         publishedTopics.sort(
//           (a: any, b: any) =>
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//         );

//         // Take latest `limit` items
//         const latestTopics = publishedTopics.slice(0, limit);

//         // Map to card format
//         const formattedCards: CardData[] = latestTopics.map((topic: any) => {
//           const article = topic.articles?.[0];

//           // Image fallback
//           let imageSrc = "/no-image.png";
//           if (article?.hero_image) {
//             const fileName = article.hero_image.replace(/\\/g, "/").split("/").pop();
//             imageSrc = `${API.defaults.baseURL}/uploads/hero/${fileName}`;
//           }

//           // Description fallback
//           const description = article?.introduction
//             ? article.introduction.replace(/<[^>]+>/g, "")
//                 .split(" ")
//                 .slice(0, 30)
//                 .join(" ") + "..."
//             : "";

//           return {
//             imageSrc,
//             category: topic.clusterTitle || "General",
//             title: topic.title || "Untitled",
//             description,
//             created_at: topic.created_at || article?.created_at || "", //  blog date
//           };
//         });

//         setCards(formattedCards);
//       } catch (err: any) {
//         setError(err.message || "Something went wrong");
//         setCards([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [endpoint, limit]);

//   return { cards, loading, error };
// };



import { useState, useEffect } from "react";
import { API } from "@/app/api/axios";

export interface CardData {
  slug: string;           //  slug for dynamic routing
  imageSrc: string;
  category: string;
  title: string;
  description: string;
<<<<<<< Updated upstream
  created_at?: string;    // blog date
=======
  published_at: string;
  author: string;
>>>>>>> Stashed changes
}

export const useFetchCards = (endpoint: string, limit: number = 3) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await API.get(endpoint);

        /**
         * ✅ API returns ARRAY of clusters
         * NOT { success, clusters }
         */
        const clusters = Array.isArray(data)
          ? data
          : Array.isArray(data?.clusters)
          ? data.clusters
          : [];

        if (!clusters.length) {
          setCards([]);
          setError("Invalid API response");
          return;
        }

<<<<<<< Updated upstream
        // Flatten clusters → topics with clusterTitle
        const allTopics = data.clusters.flatMap((cluster: any) =>
=======
        // 1️⃣ Flatten all topics from all clusters
        const allTopics = clusters.flatMap((cluster: any) =>
>>>>>>> Stashed changes
          Array.isArray(cluster.topics)
            ? cluster.topics.map((topic: any) => ({
                ...topic,
                clusterTitle: cluster.title,
              }))
            : []
        );

<<<<<<< Updated upstream
        // Filter published + active
        const publishedTopics = allTopics.filter(
          (t: any) => t.status === "published" && t.is_active === 1
        );

        // Sort by created_at descending
        publishedTopics.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Take latest `limit` items
        const latestTopics = publishedTopics.slice(0, limit);

        // Map to card format
        const formattedCards: CardData[] = latestTopics.map((topic: any) => {
          const article = topic.articles?.[0];

          // Image fallback
          let imageSrc = "/no-image.png";
          if (article?.hero_image) {
            const fileName = article.hero_image.replace(/\\/g, "/").split("/").pop();
            imageSrc = `${API.defaults.baseURL}/uploads/hero/${fileName}`;
          }

          // Description fallback
          const description = article?.introduction
            ? article.introduction.replace(/<[^>]+>/g, "")
                .split(" ")
                .slice(0, 30)
                .join(" ") + "..."
            : "";

          return {
            slug: topic.slug || "",              // ✅ ensure slug exists
            imageSrc,
            category: topic.clusterTitle || "General",
            title: topic.title || "Untitled",
            description,
            created_at: topic.created_at || article?.created_at || "",
          };
=======
        // 2️⃣ Keep only valid published topics with articles
        const validTopics = allTopics.filter(
          (t: any) =>
            t.status === "published" &&
            t.is_active === 1 &&
            Array.isArray(t.articles) &&
            t.articles.length > 0
        );

        if (!validTopics.length) {
          setCards([]);
          return;
        }

        // 3️⃣ Pick the latest article per topic (publish_date ONLY)
        const topicsWithLatestArticle = validTopics.map((topic: any) => {
          const latestArticle = topic.articles.reduce(
            (latest: any, current: any) =>
              new Date(current.publish_date) >
              new Date(latest.publish_date)
                ? current
                : latest
          );

          return { topic, latestArticle };
>>>>>>> Stashed changes
        });

        // 4️⃣ Sort globally by publish_date
        topicsWithLatestArticle.sort(
          (a, b) =>
            new Date(b.latestArticle.publish_date).getTime() -
            new Date(a.latestArticle.publish_date).getTime()
        );

        // 5️⃣ Take latest N
        const latestTopics = topicsWithLatestArticle.slice(0, limit);

        // 6️⃣ Format for UI
        const formattedCards: CardData[] = latestTopics.map(
          ({ topic, latestArticle }) => {
            let imageSrc = "/no-image.png";

            if (latestArticle?.hero_image) {
              const fileName = latestArticle.hero_image
                .replace(/\\/g, "/")
                .split("/")
                .pop();

              imageSrc = `${IMAGE_BASE}/hero/${fileName}`;
            }

            const description = latestArticle?.introduction
              ? latestArticle.introduction
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
published_at: topic.publish_date,
              author: latestArticle.author || "Team Money Now",
            };
          }
        );

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
