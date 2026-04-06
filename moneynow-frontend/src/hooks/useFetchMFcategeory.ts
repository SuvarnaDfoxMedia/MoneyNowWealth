import { useState, useEffect, useRef } from "react";
import { mfService } from "@/services/mfService";
import { useRefreshSignal } from "./useRefreshSignal";

export interface MasterCategory {
  id: string;
  name: string;
  description?: string;
}

export interface FundData {
  name: string;
  y3: string;
  y5: string;
  y10: string;
  is_featured?: boolean;
}

interface ApiMainCategory {
  _id: string;
  name?: string;
  description?: string;
}

interface ApiCategory {
  _id: string;
  name: string;
  description?: string;
}

interface ApiFund {
  fund_name: string;
  is_featured?: boolean;
  returns?: {
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
  };
}

const mapMainCategoryName = (name: string) => {
  const normalized = name.trim();

  if (/elss/i.test(normalized) || /tax/i.test(normalized)) {
    return "Tax-Savings funds (ELSS)";
  }

  const map: Record<string, string> = {
    Equity: "Equity Funds",
    Hybrid: "Hybrid Funds",
    Debt: "Debt Funds",
    Passive: "Index Funds",
    Commodity: "Commodity Funds",
  };

  return map[normalized] || normalized;
};

const normalizeMainCategoryName = (name: string) =>
  mapMainCategoryName(name)
    .trim()
    .toLowerCase();

const extractList = <T,>(response: { data?: T[] | T } | undefined | null) => {
  if (Array.isArray(response?.data)) return response.data;
  if (response?.data && typeof response.data === "object") return [response.data] as T[];
  return [];
};

export const useFetchMFData = (
  activeCategoryName: string,
  activeSubTab: string,
) => {
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>(
    [],
  );
  const [fundData, setFundData] = useState<FundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [availableSubTabs, setAvailableSubTabs] = useState<string[]>([]);

  const [subTabDescriptions, setSubTabDescriptions] = useState<
    Record<string, string>
  >({});
  const hasLoadedFundsRef = useRef(false);
  const { refreshTick, refresh } = useRefreshSignal();

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setError(null);
        const res = await mfService.getMainCategories({
          is_active: 1,
          limit: 100,
        });

        const categories = extractList<ApiMainCategory>(res);

        const mappedCategories: MasterCategory[] = categories.map(
          (cat) => ({
            id: cat._id,
            name: mapMainCategoryName(cat.name || ""),
            description: cat.description || "",
          }),
        );

        setMasterCategories(mappedCategories);
      } catch {
        setError("Failed to load categories");
        setMasterCategories([]);
      }
    };

    fetchMaster();
  }, [refreshTick]);

  useEffect(() => {
    const fetchFunds = async () => {
      if (!activeCategoryName) {
        setFundData([]);
        setAvailableSubTabs([]);
        setCategoryMap({});
        setLoading(false);
        hasLoadedFundsRef.current = false;
        return;
      }

      const isInitialLoad = !hasLoadedFundsRef.current;
      if (isInitialLoad) {
        setLoading(true);
        setFundData([]);
        setAvailableSubTabs([]);
        setCategoryMap({});
        setSubTabDescriptions({});
      }

      try {
        const mainCategory = masterCategories.find(
          (c) => normalizeMainCategoryName(c.name) === normalizeMainCategoryName(activeCategoryName),
        );

        if (!mainCategory) {
          if (isInitialLoad) {
            setFundData([]);
            setAvailableSubTabs([]);
            setLoading(false);
          }
          return;
        }

        const categoryRes = await mfService.getCategories({
          mainCategoryId: mainCategory.id,
          is_active: 1,
          limit: 100,
        });

        const categories = extractList<ApiCategory>(categoryRes);

        const nextMap: Record<string, string> = {};
        const nextDescriptions: Record<string, string> = {};

        categories.forEach((c) => {
          nextMap[c.name] = c._id;
          nextDescriptions[c.name] = c.description || "";
        });

        setCategoryMap(nextMap);
        setAvailableSubTabs(Object.keys(nextMap));
        setSubTabDescriptions(nextDescriptions);

        const selectedCategoryId = nextMap[activeSubTab] || Object.values(nextMap)[0] || "";

        if (!selectedCategoryId) {
          if (isInitialLoad) {
            setFundData([]);
            setLoading(false);
          }
          return;
        }

        const fundRes = await mfService.getFunds({
          categoryId: selectedCategoryId,
          limit: 100,
          is_active: 1,
        });

        const funds = extractList<ApiFund>(fundRes);

        const mappedFunds: FundData[] = funds.map((s) => ({
          name: s.fund_name,
          y3: s.returns?.y3_cagr?.toString?.() || "-",
          y5: s.returns?.y5_cagr?.toString?.() || "-",
          y10: s.returns?.y10_cagr?.toString?.() || "-",
          is_featured: !!s.is_featured,
        }));

        setFundData(mappedFunds);
        hasLoadedFundsRef.current = true;
      } catch {
        setError("Failed to load funds");
        if (!hasLoadedFundsRef.current) {
          setFundData([]);
          setAvailableSubTabs([]);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchFunds();
  }, [activeCategoryName, activeSubTab, masterCategories, refreshTick]);

  return {
    masterCategories,
    fundData,
    loading,
    error,
    categoryMap,
    availableSubTabs,
    subTabDescriptions,
    refetch: refresh,
  };
};
