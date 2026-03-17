# MoneyNow MF Module Architecture Audit & Implementation Blueprint

Audit date: 2026-03-10

**Scope**
API: `d:\Dfox-Media\New folder\MoneyNowWealth\api`
Admin CMS: `d:\Dfox-Media\New folder\MoneyNowWealth\backend`
Public Web: `d:\Dfox-Media\New folder\MoneyNowWealth\moneynow-frontend`
Source-of-truth workbook: `D:\Dfox-Media\projects\MoneyNowDoc\Moneynow_Mutual_Fund_Database_1.0.xlsx`

**Objective**
Create a correct, production-ready data flow so the existing Mutual Fund UI works end-to-end without changing UI structure.

---

**1) Current Architecture Audit**

**1.1 API (Node/Express + MongoDB)**
Models (current):
1. `MFMainCategory`
2. `MFCategory`
3. `MFScheme`
4. `MFNfo`
5. `MFIndexSnapshot`
6. `MFAmc`

Key route surface (public + role-based):
1. `GET /api/mf/main-categories`, `GET /api/mf/main-categories/:id`
2. `GET /api/mf/categories`, `GET /api/mf/categories/:identifier`
3. `GET /api/mf/schemes`, `GET /api/mf/schemes/:schemeCode`, `GET /api/mf/schemes/slug/:slug`
4. `GET /api/mf/nfo`, `GET /api/mf/nfo/:id`
5. `GET /api/mf/index-snapshots`
6. `GET /api/mf/home`
7. `GET /api/mf/filters`

Admin CRUD endpoints exist for all MF entities via `/:role/...` routes, including list, create, update, toggle, and delete.

Important implementation details (current behavior):
1. `category_id` is stored as a unique string in `MFCategory` and used as the primary external reference throughout the system.
2. `main_category_code` is stored in `MFMainCategory.code` (lowercase slug) and is used as the lookup key for category creation.
3. `category_excel_id` is used in create/update of `MFScheme`, `MFNfo`, and `MFIndexSnapshot` to resolve a `MFCategory` by `category_id`.
4. `MFAmc` is created on the fly from `amc_name`.

**1.2 Admin CMS (React)**
Admin MF screens already exist and are wired to API:
1. Listing screens: `MFMainCategoryListing`, `MFCategoryListing`, `MFSchemeListing`, `MFNfoListing`, `MFIndexSnapshotListing`.
2. Create/edit forms: `AddMFMainCategory`, `AddMFCategory`, `AddMFScheme`, `AddMFNfo`, `AddMFIndexSnapshot`.
3. CRUD wiring uses `useCommonCrud` and expects list responses to return `data` (array), plus pagination meta.

Dependency in admin UI:
1. `AddMFCategory` expects `main_category_code` to come from `GET /:role/mf/main-categories`.
2. `AddMFScheme`, `AddMFNfo`, `AddMFIndexSnapshot` expect `category_excel_id` from `GET /:role/mf/categories`.

**1.3 Public Web (Next.js)**
Public MF UI currently used by `/mutual-funds`:
1. `MF-Main-Category` page uses `useFetchMFData` and calls:
   - `GET /api/mf/main-categories`
   - `GET /api/mf/categories?main_category=...&sub_category=...`
2. The UI table expects a list of funds with fields:
   - `name`, `y3`, `y5`, `y10`
3. Main category names must match the static `SUB_TABS_CONFIG` keys:
   - `Equity Funds`, `Hybrid Funds`, `Debt Funds`, `Index Funds`, `Tax-Savings funds (ELSS)`

**1.4 Excel Workbook (DB reference)**
Workbook sheets detected:
1. `Categories_Master`
2. `Popular_Funds`
3. `NFO_List`
4. `Scheme_Details`
5. `Index_Data`

Unique fund types found in `Categories_Master`:
1. `Equity`
2. `Hybrid`
3. `Debt`
4. `Passive`
5. `Commodity`

Notable data relationship from the sheet:
1. `Category_ID` is the shared key across all sheets.
2. `ELSS (Tax Saver)` exists as a category under Fund Type `Equity`.

---

**2) Data Hierarchy (Required Production Structure)**

Primary hierarchy:
1. Main Category (`MFMainCategory`) -> Category (`MFCategory`) -> Scheme (`MFScheme`)

Supporting entities:
1. `MFNfo` belongs to `MFCategory` and `MFAmc`.
2. `MFIndexSnapshot` belongs to `MFCategory` (optional) and references `main_category_code` for index-level snapshots.
3. `MFAmc` is referenced by schemes and NFOs.

---

**3) Excel → DB Mapping (Canonical)**

| Excel Sheet | Excel Fields | Target Model | Target Fields | Notes |
|---|---|---|---|---|
| `Categories_Master` | `Category_ID`, `Category_Name`, `Fund_Type` | `MFMainCategory` + `MFCategory` | `MFMainCategory.code/name`, `MFCategory.category_id/name/main_category_id` | Fund_Type creates main category. |
| `Categories_Master` | `Benchmark_*`, `Risk_Level`, `Short_Description`, `Suggested_Use_Case` | `MFCategory` | `benchmark_*`, `risk_level`, `short_description`, `suggested_use_case` | Benchmark returns are category-level snapshot data. |
| `Popular_Funds` | `Scheme_Code`, `Fund_Name`, `AMC_Name`, `Category_ID` | `MFScheme`, `MFAmc` | `scheme_code`, `fund_name`, `amc_id`, `category_id` | Category is resolved by `Category_ID`. |
| `Scheme_Details` | `Fund_Objective`, `Investment_Strategy`, `Top_5_Holdings`, `Riskometer_Label`, etc. | `MFScheme` | `fund_objective`, `investment_strategy`, `top_holdings`, `riskometer_label` | Enriches scheme data. |
| `NFO_List` | `NFO_ID`, `Fund_Name`, `AMC_Name`, `Category_ID` | `MFNfo`, `MFAmc` | `nfo_id`, `fund_name`, `amc_id`, `category_id` | Uses same category linkage. |
| `Index_Data` | `Benchmark_Index_Name`, `Category_ID`, `1Y/3Y/5Y/10Y`, `Last_Updated_Date` | `MFIndexSnapshot` | `benchmark_index_name`, `category_id`, `returns`, `last_updated_date` | `main_category_code` is derived. |

---

**4) UI → API → DB Mapping**

**4.1 Public page `/mutual-funds` (current UI)**

| UI Element | API Endpoint | Required DB Fields |
|---|---|---|
| Left sidebar category list | `GET /api/mf/main-categories` | `MFMainCategory.name`, `MFMainCategory.code` |
| Sub-tab list (Large Cap, Mid Cap, etc.) | Currently static in UI | `MFCategory.name` must match UI labels |
| Funds table (Fund Name, 3Y, 5Y, 10Y) | Currently calls `GET /api/mf/categories?main_category=...&sub_category=...` | Actually needs `MFScheme.fund_name` and `MFScheme.returns.y3_cagr/y5_cagr/y10_cagr` |

**Required API behavior to satisfy current UI without UI changes**
1. Accept query aliases: `main_category` -> `mainCategory`.
2. Support `sub_category` filter as category name or category slug.
3. Return a simplified fund list payload with `{ name, y3, y5, y10 }` derived from `MFScheme.returns`.

**4.2 Public Discovery APIs (future UI components)**

| UI Section | API Endpoint | Required Fields |
|---|---|---|
| Home discovery cards | `GET /api/mf/home` | `mainCategories`, `featuredFunds`, `openNfos`, `topCategoriesByReturn`, `indexHighlights` |
| Filter sidebar | `GET /api/mf/filters` | `mainCategories`, `categories`, `amcs`, `planTypes`, `optionTypes`, `riskLabels`, `ranges` |
| Scheme list + filters | `GET /api/mf/schemes` | `fund_name`, `returns`, `expense_ratio`, `aum_cr`, `category_id`, `amc_id` |
| Scheme detail | `GET /api/mf/schemes/slug/:slug` | Full scheme with `amc_id` and `category_id` populated |
| NFO blocks | `GET /api/mf/nfo` | `fund_name`, `subscription_*`, `benchmark`, `risk_level` |

**4.3 Admin CMS mapping**

| Admin Form | API Endpoint | DB Fields |
|---|---|---|
| Add Main Category | `POST /api/:role/mf/main-categories/create` | `code`, `name`, `description`, `sort_order`, `is_active` |
| Add Category | `POST /api/:role/mf/categories/create` | `category_id`, `name`, `main_category_code`, `benchmark_*`, `risk_level`, `suggested_use_case` |
| Add Scheme | `POST /api/:role/mf/schemes/create` | `scheme_code`, `fund_name`, `amc_name`, `category_excel_id`, `returns`, `aum_cr`, `expense_ratio` |
| Add NFO | `POST /api/:role/mf/nfo/create` | `nfo_id`, `fund_name`, `amc_name`, `category_excel_id`, `subscription_*`, `benchmark` |
| Add Index Snapshot | `POST /api/:role/mf/index-snapshots/create` | `benchmark_index_name`, `main_category_code`, `category_excel_id`, `returns`, `last_updated_date` |

---

**5) Detected Issues and Design Risks**

1. Query parameter mismatch between UI and API.
- UI sends `main_category` and `sub_category`.
- API expects `mainCategory` and does not implement `sub_category` at all.
- Effect: public UI returns empty or wrong data.

2. `/api/mf/categories` returns categories, but UI expects funds.
- Current UI table expects `fund.name` and `y3/y5/y10`.
- The category endpoint returns category rows, not scheme rows.

3. Main category naming mismatches between Excel and UI.
- Excel fund types: `Equity`, `Hybrid`, `Debt`, `Passive`, `Commodity`.
- UI expects: `Equity Funds`, `Hybrid Funds`, `Debt Funds`, `Index Funds`, `Tax-Savings funds (ELSS)`.
- Effect: UI sub-tab config won’t match API values unless names are transformed.

4. ELSS is a category in Excel, not a fund type.
- `ELSS (Tax Saver)` exists but is under fund type `Equity`.
- UI expects ELSS as a main category.

5. `MFCategory.benchmark_returns` vs `MFIndexSnapshot.returns` is duplicated data.
- Category stores benchmark returns, but index snapshots also store periodic returns.
- Risk of drift or confusion about which value is authoritative.

6. `MFIndexSnapshot.main_category_code` and `category_id` can disagree.
- Both fields can be set independently.
- Risk of inconsistent grouping and incorrect UI filtering.

7. Import endpoint is disabled in routes.
- `mfRoutes.ts` comments out the Excel import endpoint.
- This blocks automated workbook ingestion flow.

8. Public `main-categories` response lacks `id` alias.
- UI `useFetchMFData` expects `id` and uses it in key building.
- Currently API only returns `_id`.

---

**6) Required Architecture Corrections**

**6.1 Canonical field definitions**
1. `category_id` is an external Excel reference key and must remain a string, unique.
2. `main_category_code` should always be a slugified version of `MFMainCategory.name`.
3. For scheme returns, use canonical fields:
- `returns.y1`
- `returns.y3_cagr`
- `returns.y5_cagr`
- `returns.y10_cagr`

**6.2 Data hierarchy alignment**
1. `MFMainCategory` is derived from Excel `Fund_Type` but must be normalized for UI display names.
2. `MFCategory` is the sub-category (Large Cap, Mid Cap, ELSS, etc.).
3. `MFScheme` is the fund row shown in the UI table.

**6.3 Benchmark data ownership**
Recommended ownership rule:
1. `MFCategory.benchmark_index_name` remains a category reference.
2. `MFIndexSnapshot` holds benchmark performance values by date.
3. `MFCategory.benchmark_returns` is optional and only used as a fallback if no index snapshot exists.

---

**7) Proposed Final Schema Structure**

**7.1 MFMainCategory**
Required:
1. `code` (slug, unique, lowercase)
2. `name` (display name, unique)
3. `is_active`
Optional:
1. `description`
2. `sort_order`
Indexes:
1. `code`
2. `name`
3. `sort_order`

**7.2 MFCategory**
Required:
1. `category_id` (string Excel ID, unique)
2. `name` (category label)
3. `main_category_id` (ObjectId ref)
4. `slug` (unique)
Optional:
1. `short_description`
2. `benchmark_index_name`
3. `benchmark_returns` (y1/y3/y5/y10)
4. `risk_level`
5. `suggested_use_case`
Indexes:
1. `category_id`
2. `main_category_id`
3. `slug`

**7.3 MFScheme**
Required:
1. `scheme_code` (unique)
2. `fund_name`
3. `amc_id` (ObjectId ref)
4. `category_id` (ObjectId ref)
5. `slug` (unique)
Optional:
1. `plan_type`, `option_type`
2. `aum_cr`, `expense_ratio`
3. `returns` (y1, y3_cagr, y5_cagr, y10_cagr)
4. `risk_metrics` (sharpe, std_dev, beta, alpha, max_drawdown, turnover_ratio)
5. `fund_manager`, `launch_date`, `min_investment`, `exit_load`
6. `is_featured`
7. `fund_objective`, `investment_strategy`, `top_holdings`
8. `asset_allocation` (equity_pct, debt_pct, other_pct)
9. `tax_type`, `riskometer_label`
Indexes:
1. `scheme_code`
2. `category_id`, `amc_id`
3. `returns.y1`, `returns.y3_cagr`
4. `expense_ratio`, `aum_cr`

**7.4 MFNfo**
Required:
1. `nfo_id` (unique)
2. `fund_name`
3. `amc_id` (ObjectId ref)
4. `category_id` (ObjectId ref)
Optional:
1. `fund_objective_short`
2. `subscription_start_date`, `subscription_end_date`
3. `min_investment`, `benchmark`, `risk_level`
4. `is_open`
Indexes:
1. `nfo_id`
2. `category_id`, `amc_id`
3. `subscription_end_date`

**7.5 MFIndexSnapshot**
Required:
1. `benchmark_index_name`
2. `last_updated_date`
Optional:
1. `category_id`
2. `main_category_code` (derived from category or fund type)
3. `returns` (y1/y3/y5/y10)
Indexes:
1. `benchmark_index_name + last_updated_date` (unique)
2. `category_id`

---

**8) API Adjustments Required to Make Current UI Work**

These changes are server-side only, so the existing UI does not need to be modified.

1. Add query aliases in `GET /api/mf/categories`:
- Accept `main_category` as alias of `mainCategory`.
- Accept `sub_category` as alias of `categoryName` or `categorySlug`.

2. Add “UI mode” response to `GET /api/mf/categories` when `sub_category` is provided:
- Return scheme list, not category list.
- Minimal response shape for UI:
  - `[{ name, y3, y5, y10 }]` where values map to `MFScheme.returns.y3_cagr/y5_cagr/y10_cagr`.

3. Add response field alias in `GET /api/mf/main-categories`:
- Include `id` as an alias to `_id` in the public response to satisfy the UI’s key usage.

4. Ensure main category naming aligns with UI:
- Normalize Excel fund types to UI-compatible names during import.
- Suggested mapping:
  - `Equity` -> `Equity Funds`
  - `Hybrid` -> `Hybrid Funds`
  - `Debt` -> `Debt Funds`
  - `Passive` -> `Index Funds`
  - `Commodity` -> `Commodity Funds` (extra, optional for UI)
  - If category name contains `ELSS`, map to main category `Tax-Savings funds (ELSS)` regardless of fund type.

5. Re-enable the Excel import route in `mfRoutes.ts` if workbook ingestion is required.

---

**9) End-to-End Data Flow (Target State)**

1. Admin imports workbook (or manually creates records).
2. Import creates or updates main categories, categories, AMCs, schemes, NFOs, and index snapshots.
3. Admin edits/validates categories and schemes in CMS.
4. Public UI calls:
   - `GET /api/mf/main-categories` to build sidebar.
   - `GET /api/mf/categories?main_category=...&sub_category=...` to fetch funds list for the table.
5. Funds table renders scheme data with returns.
6. Optional public pages use `/mf/home`, `/mf/filters`, `/mf/schemes`, `/mf/nfo` for discovery and filters.

---

**10) Implementation Plan (No UI Code Changes Yet)**

1. API adjustments
- Add query param aliases (`main_category`, `sub_category`) and `id` alias to main category responses.
- Implement sub-category fund list handling in `/api/mf/categories` when `sub_category` is present.
- Re-enable `/api/:role/mf/import/excel` route if ingestion is part of current scope.

2. Import normalization
- Update `mfImportService.ts` to normalize fund type names to match UI.
- Add ELSS override mapping when category name contains `ELSS`.

3. Data governance
- Decide benchmark ownership rule and document it.
- If `MFIndexSnapshot` is authoritative, treat `MFCategory.benchmark_returns` as fallback only.

4. QA checklist
- Validate main categories render in UI.
- Validate sub-category tabs return correct schemes and returns.
- Validate ELSS display under its intended main category.
- Validate admin CRUD still functions.

---

**11) Notes for Future UI Integration (After This Audit)**

These are optional and should be applied only after the backend alignment is completed.

1. Update frontend to call `GET /api/mf/schemes` directly for fund tables.
2. Replace hardcoded sub-tab config with API-driven category grouping.
3. Use `/api/mf/filters` to build a dynamic filter panel.

---

**Status**
This document is a complete architecture audit and implementation blueprint. No UI code changes were made or proposed in this execution.

---

**Final Schema**

MFMainCategory
1. name (required)
2. code (optional, legacy)
3. description (optional)
4. sort_order (optional)
5. is_active, is_deleted, timestamps

MFCategory
1. name (required)
2. main_category_id (ObjectId, required)
3. description (optional)
4. benchmark_index_name (optional)
5. benchmark_returns (optional, legacy fallback)
6. risk_level (optional)
7. suggested_use_case (optional)
8. is_active, is_deleted, timestamps

MFScheme
1. scheme_code (required, unique)
2. fund_name (required)
3. amc_id (ObjectId, required)
4. category_id (ObjectId, required)
5. returns (y1, y3_cagr, y5_cagr, y10_cagr)
6. expense_ratio, aum_cr
7. risk_metrics, riskometer_label
8. is_featured (legacy), is_popular (current)
9. is_active, is_deleted, timestamps

MFNfo
1. nfo_id (required, unique)
2. fund_name (required)
3. amc_id (ObjectId, required)
4. category_id (ObjectId, required)
5. subscription_start_date, subscription_end_date
6. min_investment, benchmark, risk_level
7. is_open, is_active, is_deleted, timestamps

MFAmc
1. name (required, unique)
2. is_active, is_deleted, timestamps

MFIndexSnapshot
1. benchmark_index_name (required)
2. last_updated_date (required)
3. main_category_id (ObjectId, optional)
4. category_id (ObjectId, optional)
5. returns (y1, y3, y5, y10)
6. is_active, is_deleted, timestamps

Legacy fields are commented in models and migration removes Excel IDs.

---

**Final API Architecture**

Public APIs
1. `GET /api/mf/main-categories`
2. `GET /api/mf/categories?mainCategoryId=`
3. `GET /api/mf/schemes?categoryId=&schemeId=&amcId=&riskLevel=&returnsRange=&expenseRatio=&aumRange=&sort=`
4. `GET /api/mf/popular-funds`
5. `GET /api/mf/nfo`
6. `GET /api/mf/index-snapshots?mainCategoryId=&categoryId=`
7. `GET /api/mf/discover` -> `{ popularFunds, topPerformers, newFunds, categories }`
8. `GET /api/mf/amcs`

Admin APIs (clean CRUD)
1. `POST /api/admin/mf/main-categories`
2. `POST /api/admin/mf/categories`
3. `POST /api/admin/mf/schemes`
4. `POST /api/admin/mf/nfo`
5. `POST /api/admin/mf/index-snapshots`
6. `POST /api/admin/mf/amcs`

Legacy `/create` and `/edit` endpoints are still supported for compatibility.

---

**Frontend Data Flow**

`/mutual-funds`
1. Fetch main categories.
2. Fetch categories by main category.
3. Fetch schemes by category.
4. Render scheme table.
5. Popular funds and NFO tabs reuse the same table and fetch data from `/popular-funds` and `/nfo`.

`/popular-funds`
1. Fetch popular funds from `/api/mf/popular-funds`.
2. Render minimal fund table.

`/nfo`
1. Fetch open NFOs from `/api/mf/nfo?isOpen=true`.
2. Render NFO table.

`/funds/:id`
1. Fetch scheme by `schemeId` via `/api/mf/schemes?schemeId=`.
2. Render detail card.

---

**Admin CMS Flow**

1. Main Category CRUD -> `/admin/mf/main-categories`
2. Category CRUD -> `/admin/mf/categories` (uses main_category_id)
3. Scheme CRUD -> `/admin/mf/schemes` (uses category_id, amc_name)
4. NFO CRUD -> `/admin/mf/nfo`
5. Index Snapshot CRUD -> `/admin/mf/index-snapshots` (uses main_category_id and category_id)
6. AMC CRUD -> `/admin/mf/amcs`

Popular fund toggle is now available on schemes (`is_popular`).

---

**Advanced MF Platform Architecture**

1. API-first design with clean public + admin surfaces.
2. Separation of read-heavy discovery endpoints (`/discover`, `/popular-funds`) from write-heavy admin flows.
3. Query performance:
- Compound indexes on scheme returns, category_id, and popularity flags.
- Lean queries for list endpoints.
4. Filter engine:
- categoryId, amcId, riskLevel, expenseRatio, aumRange, returnsRange.
- Sorting by returns, expense_ratio, aum, risk.
5. Discover engine:
- popularFunds (manual + AUM/returns sorted)
- topPerformers (returns sorted)
- newFunds (launch_date sorted)
- categories (quick browse)
6. Data migration:
- `api/scripts/migrate-mf-data.ts` removes Excel IDs and upgrades references to ObjectIds.

---

**Legacy Notes**

Legacy Excel-based fields are commented in schemas and import logic. Slug logic is deprecated but preserved as comments for traceability.
---

**Performance Optimizations**

1. Schemes queries use lean reads and pagination, with compound indexes on `category_id`, `amc_id`, and `returns` for fast filtering and sorting.
2. Legacy pre-migration category references are supported at read-time only (ObjectId + legacy string match) to avoid empty scheme lists when migration is pending.
3. Popular funds use indexed filters (`is_popular`, `is_active`) with default sort on 3Y CAGR and AUM.

**Debug Notes (2026-03-10)**

- If the public UI shows "No data available", verify migration has been executed. As a safety fallback, scheme queries now also match legacy category string references until migration is complete.
