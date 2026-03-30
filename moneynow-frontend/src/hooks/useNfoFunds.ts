import { mfService } from "@/services/mfService";
import { useMfList } from "./useMfList";

export interface NfoRow {
  _id: string;
  nfo_id?: string;
  fund_name: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  min_investment?: number | null;
  amc_id?: { name?: string };
  category_id?: { name?: string };
  is_currently_open?: boolean;
}

export const useNfoFunds = (params?: Record<string, unknown>) => {
  const requestParams = {
    is_active: 1,
    limit: 100,
    sortBy: "created_at",
    sortOrder: "desc",
    ...(params || {}),
  };
  const { items, loading, error } = useMfList<NfoRow>(
    mfService.getNfos,
    requestParams,
    "Failed to load NFOs",
  );

  const nfos =
    params?.isOpen === true
      ? items.filter((item) => item.is_currently_open !== false)
      : items;

  return { nfos, loading, error };
};
