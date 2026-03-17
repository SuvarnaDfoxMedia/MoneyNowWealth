import { mfService } from "@/services/mfService";
import { useMfList } from "./useMfList";

export interface MFFundRow {
  _id: string;
  fund_name: string;
  returns?: { y3_cagr?: number | null; y5_cagr?: number | null; y10_cagr?: number | null };
}

export const useFunds = (params?: Record<string, any>) => {
  const { items, loading, error } = useMfList<MFFundRow>(
    mfService.getFunds,
    params,
    "Failed to load funds",
  );

  return { funds: items, loading, error };
};
