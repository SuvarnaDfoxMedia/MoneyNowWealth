import { useState } from "react";
import {API} from "@/app/api/axios";

export const useApiPost = <T,>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const postData = async (endpoint: string, payload: T) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await API.post(endpoint, payload);

      if (data.success) {
        setSuccess(data.message || "Submitted successfully");
      } else {
        setError(data.message || "Something went wrong");
      }

      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return { postData, loading, error, success };
};
