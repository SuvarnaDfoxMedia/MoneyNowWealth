"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ---------------- Types ---------------- */
interface Cluster {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  slug: string;
  created_at?: string;
}

const GetAllCluster = () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(2);

  /* ---------------- Fetch Clusters ---------------- */
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cluster`);
        if (!res.ok) throw new Error("Failed to fetch clusters");

        const result = await res.json();

        if (!result.success || !Array.isArray(result.clusters)) {
          throw new Error("Invalid API response");
        }

        setClusters(result.clusters);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [API_BASE]);

  /* ---------------- Responsive visible cards ---------------- */
  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 640) setVisibleCards(1);
      else if (window.innerWidth < 1024) setVisibleCards(2);
      else setVisibleCards(2);
    };

    updateVisibleCards();
    window.addEventListener("resize", updateVisibleCards);

    return () => window.removeEventListener("resize", updateVisibleCards);
  }, []);

  /* ---------------- Reset index on resize ---------------- */
  useEffect(() => {
    setCurrentIndex(0);
  }, [visibleCards]);

  if (loading)
    return <p className="text-center py-10">Loading clusters...</p>;

  if (error)
    return <p className="text-center py-10 text-red-500">{error}</p>;

  if (clusters.length === 0)
    return <p className="text-center py-10">No clusters found.</p>;

  const maxIndex = Math.max(clusters.length - visibleCards, 0);

  return (
    <section className="w-full mb-1">
<div className="max-w-7xl mx-auto px-0 sm:px-4">

       <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-[15px] mb-[10px]">
<h2 className="text-[24px] sm:text-[28px] font-poppins font-semibold">
  Explore Clusters
</h2>

  <div className="flex gap-3">
    <button
      onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
      disabled={currentIndex === 0}
      className="w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center disabled:opacity-40"
    >
      <ChevronLeft />
    </button>

    <button
      onClick={() => setCurrentIndex((i) => Math.min(i + 1, maxIndex))}
      disabled={currentIndex === maxIndex}
      className="w-[42px] h-[42px] border border-[#043F79] rounded-full flex items-center justify-center disabled:opacity-40"
    >
      <ChevronRight />
    </button>
  </div>
</div>


        {/* ---------------- Slider ---------------- */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
            }}
          >
            {clusters.map((cluster, idx) => (
              <div
                key={cluster._id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCards}%` }}
              >
               <Link
  href={`/cluster/${cluster.slug}`}
  className="block bg-white transition group h-full"
>
  <div className="py-5">
    <h3 className="text-[18px] font-poppins font-semibold mb-2 group-hover:text-[#043F79] transition">
      {cluster.title}
    </h3>

    <p className="text-[16px] leading-[26px] text-gray-700 line-clamp-1">
      {cluster.description}
    </p>

    {cluster.created_at && (
      <p className="text-[14px]  mt-1 font-semibold">
        {new Date(cluster.created_at).toLocaleDateString("en-GB")}
      </p>
    )}
  </div>

  {cluster.thumbnail && (
    <div className="relative w-full h-[260px] rounded-[10px] overflow-hidden">
      <Image
        src={`${API_BASE}/uploads/thumbnail/${cluster.thumbnail}`}
        alt={cluster.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        unoptimized
      />
    </div>
  )}
</Link>

              </div>
            ))}
          </div>
        </div>

       


      </div>
    </section>
  );
};

export default GetAllCluster;

