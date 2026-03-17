import { mfService } from "@/services/mfService";
import { useMfList } from "./useMfList";

export interface NfoRow {
  _id: string;
  fund_name: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  amc_id?: { name?: string };
}

export const useNfoFunds = (params?: Record<string, any>) => {
  const { items, loading, error } = useMfList<NfoRow>(
    mfService.getNfos,
    params,
    "Failed to load NFOs",
  );

  return { nfos: items, loading, error };
};
