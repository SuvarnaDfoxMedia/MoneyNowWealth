"use client";

import { FiDownload } from "react-icons/fi";
import { useApiFetch } from "@/hooks/useCommanApiFetch";

const FILE_BASE_URL = process.env.NEXT_PUBLIC_API_BASE + "/uploads/newsletters";

const LatestNewsletter = () => {
  const { data, loading, error } = useApiFetch<any>(
    `/api/newsletter-publications`,
    {
      params: {
        limit: 5,
        sortField: "publish_date",
        sortOrder: "desc",
      },
    },
  );

  const newsletters = data?.newsletters ?? data?.data?.newsletters ?? [];

  return (
    <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow">
      <h2 className="font-semibold mb-4 text-[22px]">Latest Newsletter</h2>

      {/* Headers */}
      <div className="grid grid-cols-[60px_1fr_60px] px-4 py-2 text-sm text-gray-500 font-medium">
        <span>Sr. No</span>
        <span>Title</span>
        <span className="text-center">Action</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      )}

      {/* Error */}
      {error && <div className="text-center py-4 text-red-500">{error}</div>}

      {/* Rows */}
      <div className="space-y-3 mt-2">
        {newsletters.slice(0, 5).map((item: any, index: number) => {
          const fileUrl = `${FILE_BASE_URL}/${item.pdf_file}`;

          return (
            <div
              key={item._id}
              className="grid grid-cols-[60px_1fr_60px] items-center
              bg-white px-4 py-4 rounded-lg text-sm
              border border-[#EBEBEB]"
            >
              {/* Sr No */}
              <span>{index + 1}</span>

              {/* Title */}
              <span className="text-[14px] leading-[24px]">{item.title}</span>

              {/* Open PDF */}
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto cursor-pointer hover:text-indigo-600"
                title="View PDF"
              >
                <FiDownload />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LatestNewsletter;
