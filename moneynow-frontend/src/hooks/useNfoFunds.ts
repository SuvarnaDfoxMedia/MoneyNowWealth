import { mfService } from "@/services/mfService";
import { useMfList } from "./useMfList";

export interface NfoRow {
  _id: string;
  fund_name: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  amc_id?: { name?: string };
  category_id?: { name?: string };
}

export const useNfoFunds = (params?: Record<string, unknown>) => {
  const requestParams = {
    is_active: 1,
    limit: 50,
    ...(params || {}),
  };
  const { items, loading, error } = useMfList<NfoRow>(
    mfService.getNfos,
    requestParams,
    "Failed to load NFOs",
  );

  return { nfos: items, loading, error };
};
