"use client";

import React from "react";
import Image from "next/image";
import { useFetchCMS } from "@/hooks/useFetchCMS";
import bannerImage from "@/app/assets/privacypolicy-bg.png";

const PrivacyPolicyPage = () => {
  const slug = "privacy-policy-for-mutual-fund-investors";
  const { page, loading, error } = useFetchCMS(slug);

  if (loading) return <p className="text-center py-10 text-lg">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-600 text-lg">{error}</p>;

  return (
    <div className="font-poppins mb-10">

    
        <div className="w-full bg-[#D9D9D9] py-12 text-center mb-6">
        <h1 className="text-[36px] font-bold mb-2">  Privacy Policy</h1>
        </div>


      <div className="max-w-6xl mx-auto px-4 pb-16">

        <h1 className="text-[26px] font-bold mb-6 font-inter">
          {page?.title}
        </h1>

        <div className="space-y-8">
          {page?.sections?.map((section: any, index: number) => (
            <div
              key={index}
              className="pb-6 border-b border-gray-200 last:border-none last:pb-0"
            >
              {/* Section Title */}
              {section.title && (
                <h2 className="text-[20px] font-semibold mb-3 font-inter">
                  {section.title}
                </h2>
              )}

              {/* Section Content */}
              <div
                className="prose prose-stone max-w-none text-[15.5px] leading-[1.75] font-poppins"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
