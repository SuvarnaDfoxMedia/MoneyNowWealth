import { useState } from "react";
import { API } from "@/app/api/axios";

type FieldErrors = {
  [key: string]: string; 
};

export const useApiPost = <T,>() => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  const postData = async (endpoint: string, payload: T) => {
    setLoading(true);
    setErrors({});
    setSuccess(null);

    try {
      const response = await API.post(endpoint, payload);
      const data = response.data;

      if (data?.success) {
        setSuccess(data.message || "Submitted successfully");
        return data;
      } else {
        if (data?.errors && typeof data.errors === "object") {
          setErrors(data.errors);
        } else {
          setErrors({ general: data?.message || "Something went wrong" });
        }
        return data; 
      }
    } catch (err: any) {
      if (err.response && err.response.data) {
        if (err.response.data.errors && typeof err.response.data.errors === "object") {
          setErrors(err.response.data.errors);
          return err.response.data;
        } else {
          setErrors({ general: err.response.data.message || "Something went wrong" });
          return err.response.data;
        }
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  return { postData, loading, errors, success };
};
