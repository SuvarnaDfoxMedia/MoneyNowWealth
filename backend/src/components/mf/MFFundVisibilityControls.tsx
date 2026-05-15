import React from "react";
import { mfCheckboxClass } from "./MFFormShared";

export const MF_FUND_VISIBILITY_GROUPS = [
  { key: "fund_overview", label: "Fund Overview" },
  { key: "fund_performance", label: "Fund Performance" },
  { key: "asset_allocation", label: "Asset Allocation" },
  { key: "equity_allocation", label: "Equity Allocation" },
  { key: "fund_overview_risk", label: "Fund Overview and Risk" },
  { key: "risk_ratio", label: "Risk Ratio" },
] as const;

const PERFORMANCE_ANNUAL_FIELDS = (() => {
  const currentYear = new Date().getFullYear();
  const fields: string[] = [];
  for (let year = currentYear; year >= 2016; year -= 1) {
    fields.push(`fund_performance.annual_${year}`);
  }
  return fields;
})();

export const MF_FUND_VISIBILITY_FIELD_KEYS = [
  "fund_overview.scheme_code",
  "fund_overview.isin_number",
  "fund_overview.fund_name",
  "fund_overview.amc_name",
  "fund_overview.category_name",
  "fund_overview.main_category_name",
  "fund_overview.plan_type",
  "fund_overview.option_type",
  "fund_overview.nav_Current",
  "fund_overview.aum",
  "fund_overview.expense_ratio",
  "fund_overview.fund_manager",
  "fund_overview.launch_date",
  "fund_overview.min_investment",
  "fund_overview.sip_allowed",
  "fund_overview.min_sip_investment",
  "fund_overview.lumpsum_allowed",
  "fund_overview.min_lumpsum_investment",
  "fund_overview.exit_load",
  "fund_overview.fund_objective",
  "fund_overview.investment_strategy",
  "fund_performance.inception_return",
  "fund_performance.return_1d",
  "fund_performance.1w",
  "fund_performance.1m",
  "fund_performance.3m",
  "fund_performance.6m",
  "fund_performance.1y",
  "fund_performance.3y",
  "fund_performance.5y",
  "fund_performance.10y",
  "fund_performance.since_launch",
  "fund_performance.return_ytd",
  ...PERFORMANCE_ANNUAL_FIELDS,
  "asset_allocation.domestic_equity_pct",
  "asset_allocation.international_equity_pct",
  "asset_allocation.debt_pct",
  "asset_allocation.other_pct",
  "asset_allocation.gold_pct",
  "asset_allocation.cash_pct",
  "equity_allocation.large_cap_pct",
  "equity_allocation.mid_cap_pct",
  "equity_allocation.small_cap_pct",
  "fund_overview_risk.tax_type",
  "fund_overview_risk.riskometer_label",
  "risk_ratio.sharpe_3y",
  "risk_ratio.sharpe_5y",
  "risk_ratio.std_dev_3y",
  "risk_ratio.std_dev_5y",
  "risk_ratio.beta_3y",
  "risk_ratio.beta_5y",
  "risk_ratio.alpha_3y",
  "risk_ratio.alpha_5y",
  "risk_ratio.max_drawdown_5y",
  "risk_ratio.max_drawdown_10y",
  "risk_ratio.turnover_ratio",
] as const;

export type MFFundVisibilityState = {
  groups: Record<string, boolean>;
  fields: Record<string, boolean>;
};

export const getMFFundVisibilityGroupFieldKeys = (groupKey: string) =>
  MF_FUND_VISIBILITY_FIELD_KEYS.filter((fieldKey) =>
    fieldKey.startsWith(`${groupKey}.`),
  );

export const getMFFundVisibilityGroupChecked = (
  visibility: MFFundVisibilityState,
  groupKey: string,
) => {
  const fieldKeys = getMFFundVisibilityGroupFieldKeys(groupKey);
  if (fieldKeys.length === 0) return visibility.groups[groupKey] ?? true;
  return fieldKeys.every((fieldKey) => visibility.fields[fieldKey] ?? true);
};

export const syncMFFundVisibilityGroups = (
  visibility: MFFundVisibilityState,
): MFFundVisibilityState => ({
  ...visibility,
  groups: Object.fromEntries(
    MF_FUND_VISIBILITY_GROUPS.map((group) => [
      group.key,
      getMFFundVisibilityGroupChecked(visibility, group.key),
    ]),
  ),
});

export const emptyMFFundVisibility = (): MFFundVisibilityState => ({
  groups: Object.fromEntries(
    MF_FUND_VISIBILITY_GROUPS.map((group) => [group.key, true]),
  ),
  fields: Object.fromEntries(
    MF_FUND_VISIBILITY_FIELD_KEYS.map((key) => [key, true]),
  ),
});

export const normalizeMFFundVisibility = (value: any) => {
  const fallback = emptyMFFundVisibility();
  const hasSavedFields =
    value?.fields && Object.keys(value.fields).length > 0;
  const fields = {
    ...fallback.fields,
    ...(value?.fields || {}),
  };

  if (!hasSavedFields) {
    for (const group of MF_FUND_VISIBILITY_GROUPS) {
      if (value?.groups?.[group.key] === false) {
        for (const fieldKey of getMFFundVisibilityGroupFieldKeys(group.key)) {
          fields[fieldKey] = false;
        }
      }
    }
  }

  return syncMFFundVisibilityGroups({
    groups: {
      ...fallback.groups,
      ...(value?.groups || {}),
    },
    fields,
  });
};

type MFFundVisibilityCheckboxProps = {
  isViewMode: boolean;
  label?: string;
  visibility: MFFundVisibilityState;
  visibilityKey: string;
  onChange: (key: string, value: boolean) => void;
};

export const MFFundVisibilityCheckbox: React.FC<
  MFFundVisibilityCheckboxProps
> = ({
  isViewMode,
  label = "Show",
  visibility,
  visibilityKey,
  onChange,
}) => {
  if (!isViewMode) return null;

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
      <input
        className={mfCheckboxClass}
        type="checkbox"
        checked={visibility.fields[visibilityKey] ?? true}
        onChange={(event) => onChange(visibilityKey, event.target.checked)}
      />
      {label}
    </label>
  );
};

type MFFundVisibilitySectionTitleProps = {
  groupKey: string;
  isViewMode: boolean;
  label: string;
  visibility: MFFundVisibilityState;
  onChange: (groupKey: string, value: boolean) => void;
};

export const MFFundVisibilitySectionTitle: React.FC<
  MFFundVisibilitySectionTitleProps
> = ({ groupKey, isViewMode, label, visibility, onChange }) =>
  isViewMode ? (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h3 className="text-lg font-semibold text-[#043f79]">{label}</h3>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <input
          className={mfCheckboxClass}
          type="checkbox"
          checked={getMFFundVisibilityGroupChecked(visibility, groupKey)}
          onChange={(event) => onChange(groupKey, event.target.checked)}
        />
        Show group
      </label>
    </div>
  ) : (
    <h3 className="mb-4 text-lg font-semibold text-[#043f79]">{label}</h3>
  );

type MFFundVisibilityFieldLabelProps = {
  children: React.ReactNode;
  isViewMode: boolean;
  visibility: MFFundVisibilityState;
  visibilityKey: string;
  onChange: (key: string, value: boolean) => void;
};

export const MFFundVisibilityFieldLabel: React.FC<
  MFFundVisibilityFieldLabelProps
> = ({ children, isViewMode, visibility, visibilityKey, onChange }) => (
  <div className="mb-2 flex items-center justify-between gap-3">
    <label className="block font-medium text-gray-700">{children}</label>
    <MFFundVisibilityCheckbox
      isViewMode={isViewMode}
      visibility={visibility}
      visibilityKey={visibilityKey}
      onChange={onChange}
    />
  </div>
);
