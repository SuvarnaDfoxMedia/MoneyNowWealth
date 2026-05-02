export type Scheme = {
  _id: string;
  scheme_code?: string;
  isin?: string;
  fund_name: string;
  amc_id?: { name?: string };
  category_id?: { name?: string };
  plan_type?: string;
  option_type?: string;
  launch_date?: string | null;
  is_active?: number;
};
