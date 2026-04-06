"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import ClusterArticleSlider from "@/components/Blog-listing-Components/ClusterArticlePagination";
import SeniorCitizen from "@/components/blog-details-Page/SeniorCitizen";
import MostPopularBlogs from "@/components/Blog-listing-Components/MostPopularBlogs";
import HomeInvestTrack from "@/components/home/invest-with-confidence";
import StayConnected from "@/components/home/home-newsletters";
import { homeInvestTrackData } from "@/data/homePageData";
import { useRefreshSignal } from "@/hooks/useRefreshSignal";
import { API } from "@/app/api/axios";
import { useContentAccess } from "@/hooks/useContentAccess";

/* ---------------- Types ---------------- */
interface Article {
  _id: string;
  title: string;
  slug: string;
  hero_image?: string;
  introduction?: string;
  category?: string;
}

interface Topic {
  _id: string;
  title: string;
  articles?: Article[];
}

interface Cluster {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  created_at?: string;
}

interface ClusterHierarchyResponse {
  success: boolean;
  data: {
    clusters: Cluster[];
    topics: Topic[];
  };
}

/* ---------------- Component ---------------- */
const ClusterPage: React.FC = () => {
  const { slug } = useParams();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const { refreshTick } = useRefreshSignal();
  const { accessLevel, resolved } = useContentAccess();

  /* ---------- Fetch Cluster ---------- */
  useEffect(() => {
    if (!slug || !resolved) return;

    const fetchCluster = async () => {
      const isInitialLoad = !hasLoadedRef.current;
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const { data: result } = await API.get<ClusterHierarchyResponse>(
          `/api/cluster/slug/${slug}/`,
        );

        if (result.success && result.data.clusters.length > 0) {
          setCluster(result.data.clusters[0]);
          setTopics(result.data.topics || []);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error(error);
        if (!hasLoadedRef.current) {
          setCluster(null);
          setTopics([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchCluster();
  }, [slug, refreshTick, accessLevel, resolved]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!cluster) return <p className="p-4">Cluster not found</p>;

  const articles: Article[] = topics.flatMap((t) => t.articles || []);

  const formattedDate = cluster.created_at
    ? new Date(cluster.created_at).toLocaleDateString("en-GB")
    : "";

  return (
    <>
      <section className="font-poppins w-full py-6 mb-[0px] overflow-x-hidden">
        <div className="max-w-full mx-auto px-4 md:px-6 mb-[30px]">
          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT — SCROLLABLE */}
            <div className="lg:col-span-8 lg:border-r lg:border-[#F0F0F0] lg:pr-[24px]">
              <div className="lg:max-h-[180dvh] overflow-y-auto pr-2 scrollbar-thin">
                <div className="border-b border-[#F0F0F0] mb-[30px]">
                  <h2 className="text-[30px] font-semibold mb-4">
                    Latest Articles
                  </h2>

                  <h3 className="text-[24px] font-semibold mb-2 text-[#043F79]">
                    {cluster.title}
                  </h3>

                  {formattedDate && (
                    <p className="text-[16px] text-gray-600 mb-2">
                      Created on: {formattedDate}
                    </p>
                  )}

                  {cluster.thumbnail && (
                    <Image
                      src={`${API_BASE}/uploads/thumbnail/${cluster.thumbnail}`}
                      alt={cluster.title}
                      width={1200}
                      height={450}
                      className="w-full rounded-[10px] mb-4"
                      priority
                    />
                  )}

                  {cluster.description && (
                    <p className="text-[18px] leading-[28px] mb-4">
                      {cluster.description}
                    </p>
                  )}
                </div>

                {/* ARTICLE LIST */}
                <ClusterArticleSlider
                  articles={articles}
                  cluster={cluster}
                  apiBase={API_BASE!}
                />
              </div>
            </div>

            {/* RIGHT — STICKY */}
            <div className="lg:col-span-4">
              <div className="lg:sticky">
                {/* Banner */}
                <div className="relative w-full rounded mb-4">
                  <Image
                    src="/images/blog-listing-right-banner2.png"
                    alt="Banner"
                    width={1200}
                    height={620}
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="w-full h-auto rounded"
                  />
                </div>

                <MostPopularBlogs />
              </div>
            </div>
          </div>
        </div>
        <SeniorCitizen />
      </section>
      <HomeInvestTrack data={homeInvestTrackData} />
      <div className="relative pt-[60px] pb-[30px]">
        <StayConnected />
      </div>{" "}
    </>
  );
};

export default ClusterPage;
