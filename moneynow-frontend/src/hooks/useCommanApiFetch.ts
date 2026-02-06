// "use client";

// import { useEffect, useState } from "react";
// import { API } from "@/app/api/axios";

// interface FetchOptions {
//   skip?: boolean;
//   withCredentials?: boolean;
// }

// export function useApiFetch<T>(
//   endpoint: string | null,
//   options?: FetchOptions,
// ) {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(!!endpoint);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!endpoint || options?.skip) return;

//     let isMounted = true;

//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const res = await API.get(endpoint, {
//           withCredentials: options?.withCredentials ?? false,
//         });

//         if (isMounted) {
//           setData(res.data);
//         }
//       } catch (err: any) {
//         if (isMounted) {
//           setError(err?.message || "Something went wrong");
//           setData(null);
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchData();

//     return () => {
//       isMounted = false;
//     };
//   }, [endpoint]);

//   return { data, loading, error };
// }

"use client";

import { useEffect, useState } from "react";
import { API } from "@/app/api/axios";

interface FetchOptions {
  skip?: boolean;
  withCredentials?: boolean;
  params?: Record<string, any>;
}

export function useApiFetch<T>(
  endpoint: string | null,
  options?: FetchOptions,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!endpoint);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint || options?.skip) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await API.get(endpoint, {
          withCredentials: options?.withCredentials ?? false,
          params: options?.params,
        });

        if (isMounted) {
          setData(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Something went wrong");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [endpoint, options?.skip, JSON.stringify(options?.params)]);

  return { data, loading, error };
}
