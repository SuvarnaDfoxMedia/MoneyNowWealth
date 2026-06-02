import { mfService } from "@/services/mfService";
import { useMfList } from "./useMfList";

export interface MFFundRow {
  _id: string;
  scheme_code?: string;
  fund_name: string;
  returns?: {
    trailing?: Record<string, number | null>;
    d1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
  };
}

export const useFunds = (params?: Record<string, unknown>) => {
  const requestParams = {
    is_active: 1,
    limit: 100,
    ...(params || {}),
  };
  const { items, loading, error } = useMfList<MFFundRow>(
    mfService.getFunds,
    requestParams,
    "Failed to load funds",
  );

  return { funds: items, loading, error };
};
