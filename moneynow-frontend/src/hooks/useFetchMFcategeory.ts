import { useState, useEffect } from "react";
import { mfService } from "@/services/mfService";

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
}

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

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const res = await mfService.getMainCategories();

        const categories = Array.isArray(res?.data)
          ? res.data
          : res?.data || [];

        const mappedCategories: MasterCategory[] = categories.map(
          (cat: any) => ({
            id: cat._id,
            name: mapMainCategoryName(cat.name || ""),
            description: cat.description || "",
          }),
        );

        setMasterCategories(mappedCategories);
      } catch (err: any) {
        setError("Failed to load categories");
        setMasterCategories([]);
      }
    };

    fetchMaster();
  }, []);

  useEffect(() => {
    const fetchFunds = async () => {
      if (!activeCategoryName) {
        setFundData([]);
        setAvailableSubTabs([]);
        setCategoryMap({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setFundData([]);
      setAvailableSubTabs([]);
      setCategoryMap({});
      setSubTabDescriptions({});

      try {
        const mainCategory = masterCategories.find(
          (c) => c.name.toLowerCase() === activeCategoryName.toLowerCase(),
        );

        if (!mainCategory) {
          setFundData([]);
          setAvailableSubTabs([]);
          setLoading(false);
          return;
        }

        const categoryRes = await mfService.getCategories({
          mainCategoryId: mainCategory.id,
        });

        const categories = Array.isArray(categoryRes?.data)
          ? categoryRes.data
          : categoryRes?.data || [];

        const nextMap: Record<string, string> = {};
        const nextDescriptions: Record<string, string> = {};

        categories.forEach((c: any) => {
          nextMap[c.name] = c._id;
          nextDescriptions[c.name] = c.description || "";
        });

        setCategoryMap(nextMap);
        setAvailableSubTabs(Object.keys(nextMap));
        setSubTabDescriptions(nextDescriptions);

        const selectedCategoryId = nextMap[activeSubTab] || "";

        if (!selectedCategoryId) {
          setFundData([]);
          setLoading(false);
          return;
        }

        const fundRes = await mfService.getFunds({
          categoryId: selectedCategoryId,
          limit: 100,
        });

        const funds = Array.isArray(fundRes?.data)
          ? fundRes.data
          : fundRes?.data || [];

        const mappedFunds: FundData[] = funds.map((s: any) => ({
          name: s.fund_name,
          y3: s.returns?.y3_cagr?.toString?.() || "-",
          y5: s.returns?.y5_cagr?.toString?.() || "-",
          y10: s.returns?.y10_cagr?.toString?.() || "-",
        }));

        setFundData(mappedFunds);
      } catch (err: any) {
        setError("Failed to load funds");
        setFundData([]);
        setAvailableSubTabs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [activeCategoryName, activeSubTab, masterCategories]);

  return {
    masterCategories,
    fundData,
    loading,
    error,
    categoryMap,
    availableSubTabs,
    subTabDescriptions,
  };
};
