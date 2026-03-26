
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../../src/hooks/useCommonCrud";

interface Section {
  title?: string;
  content?: string;
}

interface FAQ {
  question: string;
  answer?: string;
}

export interface CmsPage {
  _id: string;
  title: string;
  slug?: string;
  sections?: Section[];
  faqs?: FAQ[];
  status?: string;
  is_active?: number;
  page_code?: string;
  created_at?: string;
}

export default function ViewCmsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getOne } = useCommonCrud<CmsPage>({
    module: "cmspages",
  });

  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPage = async () => {
      try {
        const response = await getOne(id);

        const cmsPage: CmsPage | null =
          (response as any)?.page ?? response?.data ?? null;

        if (!cmsPage?._id) {
          toast.error("CMS Page not found or deleted.");
          navigate("/admin/cmspages");
          return;
        }

        setPage({
          ...cmsPage,
          sections: cmsPage.sections || [],
          faqs: cmsPage.faqs || [],
        });
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch CMS Page details.");
        navigate("/admin/cmspages");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id, getOne, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-6">
          <div className="h-8 bg-gray-300 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-full mt-2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 text-lg">
        CMS Page not found or deleted.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md overflow-hidden rounded-lg">
        
        {/* Back Button */}
        <div className="flex justify-end px-6 pt-6">
          <button
            onClick={() => navigate("/admin/cmspages")}
            className="bg-[#043f79] text-white px-4 py-2 rounded-md shadow-md hover:scale-105 hover:bg-[#064d99] transition flex items-center gap-2"
          >
            <FiArrowLeft /> Back
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-10 md:px-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            {page.title}
          </h1>

          <div className="text-gray-500 text-sm mb-8">
            <span>
              {page.created_at
                ? new Date(page.created_at).toLocaleDateString("en-GB")
                : ""}
            </span>{" "}
            • <span>{page.status || "draft"}</span>{" "}
            {page.is_active ? (
              <span className="text-green-600 font-medium">• Active</span>
            ) : (
              <span className="text-red-500 font-medium">• Inactive</span>
            )}
          </div>

          {/* Sections */}
          {page.sections?.length ? (
            <div className="space-y-10">
              {page.sections.map((sec, idx) => (
                <div key={idx}>
                  {sec.title && (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                      {sec.title}
                    </h2>
                  )}
                  {sec.content && (
                    <div
                      className="prose max-w-none prose-table-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: sec.content.replace(
                          /<table/g, 
                          '<table style="border-collapse: collapse; width: 100%; border: 1px solid #e5e7eb;"'
                        ).replace(
                          /<th/g, 
                          '<th style="border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; background-color: #f9fafb; font-weight: 600;"'
                        ).replace(
                          /<td/g, 
                          '<td style="border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left;"'
                        )
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic mb-10">No sections found.</p>
          )}

          {/* FAQs */}
          {page.faqs?.length ? (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                FAQs
              </h2>
              <div className="space-y-6">
                {page.faqs.map((faq, idx) => (
                  <div key={idx} className="border-b pb-4">
                    <h3 className="font-semibold text-gray-800">
                      {faq.question}
                    </h3>
                    <div
                      className="text-gray-700 mt-2 prose max-w-none prose-table-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: (faq.answer ?? "").replace(
                          /<table/g, 
                          '<table style="border-collapse: collapse; width: 100%; border: 1px solid #e5e7eb;"'
                        ).replace(
                          /<th/g, 
                          '<th style="border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; background-color: #f9fafb; font-weight: 600;"'
                        ).replace(
                          /<td/g, 
                          '<td style="border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left;"'
                        )
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic mt-6">No FAQs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
