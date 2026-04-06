import { useEffect, useRef, useState } from "react";
import { mfService } from "@/services/mfService";
import { useRefreshSignal } from "./useRefreshSignal";

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
  const hasLoadedCategoriesRef = useRef(false);
  const { refreshTick, refresh } = useRefreshSignal();

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
  }, [refreshTick]);

  useEffect(() => {
    if (!mainCategoryId) {
      setCategories([]);
      hasLoadedCategoriesRef.current = false;
      return;
    }
    const loadCategories = async () => {
      const isInitialLoad = !hasLoadedCategoriesRef.current;
      if (isInitialLoad) {
        setLoading(true);
      }
      try {
        setError(null);
        const res = await mfService.getCategories({
          mainCategoryId,
          is_active: 1,
          limit: 100,
        });
        const items = Array.isArray(res?.data) ? res.data : res?.data || [];
        setCategories(items);
        hasLoadedCategoriesRef.current = true;
      } catch {
        setError("Failed to load categories");
        if (!hasLoadedCategoriesRef.current) {
          setCategories([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };
    loadCategories();
  }, [mainCategoryId, refreshTick]);

  return { mainCategories, categories, loading, error, refetch: refresh };
};
