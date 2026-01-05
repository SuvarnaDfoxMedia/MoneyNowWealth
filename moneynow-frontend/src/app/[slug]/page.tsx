"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useFetchCMS } from "@/hooks/useFetchCMS";

const CMSPage = () => {
  const params = useParams();

  const slug = params.slug as string;

  const { page, loading, error } = useFetchCMS(slug);

  if (loading) {
    return (
      <p className="text-center py-10 text-lg">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center py-10 text-red-600 text-lg">
        {error}
      </p>
    );
  }

  if (!page) return null;

  return (
    <div className="font-poppins mb-4">
      {/* Banner */}
      <div className="w-full bg-[#D9D9D9] py-12 text-center mb-6">
        <h1 className="text-[36px] font-bold">
          {page.title}
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-0">
        <div className="space-y-8">
          {page.sections?.map((section: any, index: number) => (
            <div
              key={index}
              className="pb-6 border-b border-gray-200 last:border-none"
            >
              {section.title && (
                <h2 className="text-[20px] font-semibold mb-3">
                  {section.title}
                </h2>
              )}

              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CMSPage;
