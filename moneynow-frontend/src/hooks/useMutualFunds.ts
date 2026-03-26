import { useEffect, useState } from "react";
import { mfService } from "@/services/mfService";

export interface MFMainCategory {
  _id: string;
  name: string;
}

export interface MFCategory {
  _id: string;
  name: string;
  main_category_id?: { _id: string; name?: string };
}

export const useMutualFunds = (mainCategoryId?: string) => {
  const [mainCategories, setMainCategories] = useState<MFMainCategory[]>([]);
  const [categories, setCategories] = useState<MFCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMain = async () => {
      try {
        setError(null);
        const res = await mfService.getMainCategories({ is_active: 1, limit: 100 });
        const items = Array.isArray(res?.data) ? res.data : res?.data || [];
        setMainCategories(items);
      } catch {
        setError("Failed to load main categories");
      }
    };
    loadMain();
  }, []);

  useEffect(() => {
    if (!mainCategoryId) {
      setCategories([]);
      return;
    }
    const loadCategories = async () => {
      setLoading(true);
      try {
        setError(null);
        const res = await mfService.getCategories({
          mainCategoryId,
          is_active: 1,
          limit: 100,
        });
        const items = Array.isArray(res?.data) ? res.data : res?.data || [];
        setCategories(items);
      } catch {
        setError("Failed to load categories");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [mainCategoryId]);

  return { mainCategories, categories, loading, error };
};
