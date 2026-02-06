// import { useApiFetch } from "@/hooks/useCommanApiFetch";

// export const useFetchNewsletters = (page = 1, limit = 10) => {
//   const { data, loading, error } = useApiFetch<any>(
//     `/api/newsletter-publications?page=${page}&limit=${limit}`,
//   );

//   return {
//     newsletters: data?.newsletters ?? [],
//     totalPages: data?.totalPages ?? 1,
//     loading,
//     error,
//   };
// };

import { useApiFetch } from "@/hooks/useCommanApiFetch";

interface Newsletter {
  _id: string;
  title: string;
  pdf_file: string;
  publish_date: string;
  frequency: string;
}

interface NewsletterResponse {
  newsletters: Newsletter[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export const useFetchNewsletters = (page = 1, limit = 10) => {
  const { data, loading, error } = useApiFetch<NewsletterResponse>(
    `/api/newsletter-publications`,
    {
      params: {
        page,
        limit,
        sort: "-publish_date", // newest first
      },
      withCredentials: true,
    },
  );

  return {
    newsletters: data?.newsletters ?? [],
    total: data?.total ?? 0,
    currentPage: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    limit: data?.limit ?? limit,
    loading,
    error,
  };
};
