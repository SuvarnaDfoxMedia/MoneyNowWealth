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
  is_open?: boolean;
  is_active?: number;
  is_currently_open?: boolean;
}

const toTime = (value?: string) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const sortNfosForListing = (items: NfoRow[]) =>
  [...items].sort((a, b) => {
    const activeDiff = (b.is_active === 1 ? 1 : 0) - (a.is_active === 1 ? 1 : 0);
    if (activeDiff !== 0) return activeDiff;

    const currentOpenDiff =
      (b.is_currently_open ? 1 : 0) - (a.is_currently_open ? 1 : 0);
    if (currentOpenDiff !== 0) return currentOpenDiff;

    const openDiff = (b.is_open ? 1 : 0) - (a.is_open ? 1 : 0);
    if (openDiff !== 0) return openDiff;

    const endDateDiff = toTime(a.subscription_end_date) - toTime(b.subscription_end_date);
    if (endDateDiff !== 0) return endDateDiff;

    return a.fund_name.localeCompare(b.fund_name);
  });

export const useNfoFunds = (params?: Record<string, unknown>) => {
  const requestParams = {
    is_active: 1,
    limit: 100,
    sortBy: "subscription_end_date",
    sortOrder: "asc",
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

  return { nfos: sortNfosForListing(nfos), loading, error };
};
