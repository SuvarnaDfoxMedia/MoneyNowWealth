# MoneyNow Mutual Fund DB - Backend Implementation Blueprint

## 1) What we received from client (Excel v1.0)

Workbook: `Moneynow_Mutual_Fund_Database_1.0.xlsx`

Sheets detected:

1. `Categories_Master`
2. `Popular_Funds`
3. `NFO_List`
4. `Scheme_Details`
5. `Index_Data`

### Key understanding (important)

Your assumption is correct: this is category-wise data with hierarchy.

Hierarchy from sheet design:

- `Fund_Type` = Main Category (example: Equity, Debt, Hybrid, Index, ELSS)
- `Category_Name` = Sub Category (example: Large Cap, Mid Cap, Short Duration Debt)
- `Category_ID` = stable key for sub-category

Then:

- `Popular_Funds` and `Scheme_Details` are scheme-level records (join via `Scheme_Code`)
- `NFO_List` is separate (new fund offers)
- `Index_Data` is benchmark/category performance snapshot

## 2) Decision: reuse existing code vs separate thinking

### Reuse directly

Reuse your current architectural style:

- `model -> service -> controller -> route`
- Role-based admin URLs using `roleFromUrl(["admin", "editor"])`
- Pagination/search/sort response pattern
- Soft-delete style (`is_active`, `is_deleted`, timestamps)
- Same registration in `src/index.ts`

### Do NOT reuse directly

Do not force-fit this into `cluster/topic/article` collections.
Reason:

- Cluster/blog is content publishing domain.
- Mutual fund DB is market-data + product-domain with numeric metrics and cross-sheet joins.
- Mixing both will create tight coupling and harder maintenance.

Decision: create separate `mf` domain module, but keep coding style identical to existing API.

## 3) Proposed domain structure (Mongo)

## 3.1 Collections

### A) `mf_main_categories`

Represents top-level category type from `Fund_Type`.

Fields:

- `_id`
- `code`: slug-style unique (`equity`, `debt`)
- `name`: display name
- `description` (optional)
- `is_active`, `is_deleted`, `created_at`, `updated_at`, `deleted_at`

### B) `mf_categories`

Represents sub-category from `Category_ID + Category_Name`.

Fields:

- `_id`
- `category_id`: number/string from excel (unique)
- `name`: sub-category name
- `main_category_id`: ref -> `mf_main_categories`
- `short_description`
- `benchmark_index_name`
- `benchmark_returns`: `{ y1, y3, y5, y10 }`
- `risk_level`
- `suggested_use_case`
- `is_active`, `is_deleted`, timestamps

Indexes:

- unique: `category_id`
- index: `main_category_id`, `name`, `is_active`, `is_deleted`

### C) `mf_amcs`

Normalize AMC names.

Fields:

- `_id`
- `name` (unique)
- `slug`
- `is_active`, `is_deleted`, timestamps

### D) `mf_schemes`

Core scheme master (merge of Popular_Funds + Scheme_Details)

Fields:

- `_id`
- `scheme_code` (unique)
- `fund_name`
- `slug`
- `amc_id` (ref)
- `category_id` (ref to `mf_categories`)
- `plan_type` (Regular/Direct)
- `option_type` (Growth/IDCW)
- `aum_cr`
- `expense_ratio`
- `returns`: `{ y1, y3_cagr, y5_cagr, y10_cagr }`
- `risk_metrics`: `{ sharpe_3y, std_dev_3y, beta_3y, alpha_3y, max_drawdown_5y, turnover_ratio }`
- `fund_manager`
- `launch_date`
- `min_investment`
- `exit_load`
- `is_featured`
- `fund_objective`
- `investment_strategy`
- `top_holdings` (array of strings)
- `asset_allocation`: `{ equity_pct, debt_pct, other_pct }`
- `tax_type`
- `riskometer_label`
- `is_active`, `is_deleted`, timestamps

Indexes:

- unique: `scheme_code`, `slug`
- indexes: `category_id`, `amc_id`, `is_featured`, `returns.y1`, `expense_ratio`, `aum_cr`
- text index: `fund_name`, `fund_manager`, `fund_objective`

### E) `mf_nfos`

From `NFO_List`.

Fields:

- `_id`
- `nfo_id` (from sheet, unique)
- `fund_name`
- `slug`
- `amc_id` (ref)
- `category_id` (ref)
- `fund_objective_short`
- `subscription_start_date`
- `subscription_end_date`
- `min_investment`
- `benchmark`
- `risk_level`
- `is_open` (boolean)
- `is_active`, `is_deleted`, timestamps

### F) `mf_index_snapshots`

From `Index_Data` as time-series snapshots.

Fields:

- `_id`
- `benchmark_index_name`
- `main_category_code` (or `main_category_id` if mapped)
- `category_id` (optional ref when mapping is available)
- `returns`: `{ y1, y3, y5, y10 }`
- `last_updated_date`
- timestamps

Unique index suggestion:

- `(benchmark_index_name, last_updated_date)`

## 4) API modules and file structure to create

Under `src/` create:

- `models/mfMainCategoryModel.ts`
- `models/mfCategoryModel.ts`
- `models/mfAmcModel.ts`
- `models/mfSchemeModel.ts`
- `models/mfNfoModel.ts`
- `models/mfIndexSnapshotModel.ts`

- `services/mfCategoryService.ts`
- `services/mfSchemeService.ts`
- `services/mfNfoService.ts`
- `services/mfIndexService.ts`
- `services/mfImportService.ts`

- `controllers/mfCategoryController.ts`
- `controllers/mfSchemeController.ts`
- `controllers/mfNfoController.ts`
- `controllers/mfIndexController.ts`
- `controllers/mfImportController.ts`

- `routes/mfRoutes.ts`

- Optional scripts:
  - `scripts/import-mf-excel.ts` (one-shot/manual import)

And register route in `src/index.ts`:

- `app.use("/api", mfRoutes);`

## 5) API contract design (Phase 1: backend APIs first)

Public APIs:

- `GET /api/mf/main-categories`
- `GET /api/mf/categories?mainCategory=equity&search=&page=1&limit=20`
- `GET /api/mf/categories/:categoryId`
- `GET /api/mf/schemes?categoryId=101&amc=abc-mutual-fund&planType=Regular&optionType=Growth&sortBy=returns.y3_cagr&sortOrder=desc&page=1&limit=20`
- `GET /api/mf/schemes/:schemeCode`
- `GET /api/mf/schemes/slug/:slug`
- `GET /api/mf/nfo?isOpen=true&page=1&limit=20`
- `GET /api/mf/index-snapshots?benchmark=Nifty%2050%20TRI`
- `GET /api/mf/home` (aggregated payload for frontend sections)

Admin/editor APIs:

- `POST /api/:role/mf/import/excel` (upload sheet/file path import trigger)
- `POST /api/:role/mf/main-categories/create`
- `POST /api/:role/mf/categories/create`
- `POST /api/:role/mf/schemes/create`
- `POST /api/:role/mf/nfo/create`
- `PUT /api/:role/mf/categories/edit/:id`
- `PUT /api/:role/mf/schemes/edit/:id`
- `PATCH /api/:role/mf/schemes/toggle-status/:id`
- `DELETE /api/:role/mf/schemes/delete/:id` (soft delete)

## 6) Response shape standard

Use same style as your existing modules:

List response:

```json
{
  "success": true,
  "data": [ ... ],
  "total": 120,
  "currentPage": 1,
  "totalPages": 6,
  "limit": 20,
  "filters": {
    "categoryId": 101,
    "planType": "Regular"
  }
}
```

Detail response:

```json
{
  "success": true,
  "data": {
    "scheme_code": "FND001",
    "fund_name": "ABC Large Cap Fund",
    "category": {
      "category_id": 101,
      "name": "Large Cap",
      "main_category": "Equity"
    },
    "amc": "ABC Mutual Fund",
    "returns": {
      "y1": 18.2,
      "y3_cagr": 14.5,
      "y5_cagr": 15.8,
      "y10_cagr": 13.9
    }
  }
}
```

Home aggregator response (for frontend landing sections):

```json
{
  "success": true,
  "data": {
    "mainCategories": [...],
    "featuredFunds": [...],
    "openNfos": [...],
    "topCategoriesByReturn": [...],
    "indexHighlights": [...]
  }
}
```

## 7) Data import strategy (very important)

This should be idempotent and upsert-based.

Import order:

1. `Categories_Master` -> create/update main categories + categories
2. AMC extraction from all scheme/NFO sheets -> upsert AMCs
3. `Popular_Funds` -> upsert base scheme data
4. `Scheme_Details` -> enrich existing schemes by `scheme_code`
5. `NFO_List` -> upsert NFO records
6. `Index_Data` -> append or upsert snapshots

Rules:

- Normalize boolean fields (`Yes/No` -> true/false)
- Normalize numbers (empty string -> null)
- Parse dates strictly
- Use mapping table for header names (avoid direct raw dependency)
- Create import log with counts: inserted/updated/skipped/errors

## 8) Should we implement like cluster/blog?

Answer: partially yes.

Reuse from cluster/blog:

- Route style and role middleware
- Pagination/query parsing
- Error response conventions
- Soft delete and toggle status
- Slug generation style

Separate approach needed for:

- Data normalization from multi-sheet Excel
- Cross-sheet merge logic (`Popular_Funds` + `Scheme_Details`)
- Numeric filtering/sorting (returns, risk, expense)
- Aggregation endpoints for investment discovery UI

So this is a new domain module with familiar coding style.

## 9) Proposed implementation phases

Phase 0 (Alignment document) - this file

- Freeze data dictionary and API contracts

Phase 1 (Backend foundation)

- Add models + indexes
- Add CRUD/list APIs for categories/schemes/NFO/index snapshots
- Add public listing/search APIs

Phase 2 (Import pipeline)

- Build `mfImportService`
- Add admin import endpoint + dry-run mode
- Validate row-level errors and return import report

Phase 3 (Frontend support APIs)

- Add `/api/mf/home`
- Add faceted filter metadata endpoint `/api/mf/filters`
- Optimize with `.lean()` + projection + indexes

Phase 4 (Quality)

- Add API tests for filters, sorting, pagination, and import idempotency
- Seed data script for dev

## 10) Suggested query/filter capabilities for frontend

For schemes listing:

- by main category
- by sub category
- by AMC
- by plan type / option type
- by risk label
- by min return thresholds (`minY1`, `minY3`)
- by expense ratio range
- by AUM range
- sort by `returns.y1`, `returns.y3_cagr`, `expense_ratio`, `aum_cr`, `created_at`

## 11) Performance and indexing guidance

Must-have indexes:

- `mf_categories`: `(main_category_id, is_active, is_deleted)`
- `mf_schemes`: `(category_id, is_active, is_deleted)`
- `mf_schemes`: `(is_featured, is_active)`
- `mf_nfos`: `(is_open, subscription_end_date)`
- `mf_index_snapshots`: `(benchmark_index_name, last_updated_date)`

Use projections for list APIs to avoid large payloads.

## 12) Validation and safety checks

- Reject duplicate `scheme_code`
- Validate `category_id` exists before creating scheme
- Validate date ranges (`subscription_end_date >= subscription_start_date`)
- Keep numeric fields nullable instead of forcing zero
- Add migration-safe defaults for optional columns

## 13) Final recommendation (what we should do now)

1. Freeze this design doc first (you review and adjust names/fields).
2. Implement Phase 1 APIs and models without import complexity.
3. Then add import pipeline (Phase 2) to populate DB from Excel.
4. Then frontend integration with `/api/mf/home` and filters.

This gives clean progression and avoids rework.

## 14) Notes from current Excel anomalies (detected)

- Some category rows have partial/missing benchmark/risk/use-case values.
- `Popular_Funds` has `Category_Name` that may differ from `Categories_Master` naming.
- `Index_Data` currently has blank `Category_ID` in sampled rows.

So import should be tolerant and log unmatched references, not fail full job.

---

## 15) Implementation Status Update (Completed)

### Phase 1 (Backend foundation) - Completed

Implemented:
- Models + indexes for:
  - `MFMainCategory`
  - `MFCategory`
  - `MFAmc`
  - `MFScheme`
  - `MFNfo`
  - `MFIndexSnapshot`
- Public APIs:
  - `/api/mf/main-categories`
  - `/api/mf/main-categories/:id`
  - `/api/mf/categories`
  - `/api/mf/categories/:identifier`
  - `/api/mf/schemes`
  - `/api/mf/schemes/:schemeCode`
  - `/api/mf/schemes/slug/:slug`
  - `/api/mf/nfo`
  - `/api/mf/nfo/:id`
  - `/api/mf/index-snapshots`
- Admin/editor APIs:
  - create/edit/toggle/delete for main categories, categories, schemes, NFO, index snapshots

### Phase 2 (Import pipeline) - Completed

Implemented:
- `POST /api/:role/mf/import/excel`
- Service: `src/services/mfImportService.ts`
- Controller: `src/controllers/mfImportController.ts`
- Import flow implemented:
  1. `Categories_Master`
  2. `Popular_Funds`
  3. `Scheme_Details`
  4. `NFO_List`
  5. `Index_Data`
- Supports:
  - `dryRun` mode
  - idempotent upsert behavior
  - row-level error capture (`sheet`, `row`, `message`, `identifier`)
  - summary counters (`inserted`, `updated`, `skipped`, `errors`) per entity

### Phase 3 (Frontend support APIs) - Completed

Implemented:
- `GET /api/mf/home`
- `GET /api/mf/filters`

`/api/mf/home` response sections:
- `mainCategories`
- `featuredFunds`
- `openNfos`
- `topCategoriesByReturn`
- `indexHighlights`

`/api/mf/filters` response sections:
- `mainCategories`
- `categories`
- `amcs`
- `planTypes`
- `optionTypes`
- `riskLabels`
- `ranges` for `y1`, `y3`, `expenseRatio`, `aumCr`

Implementation uses `.lean()`, projection, sorting, and existing indexes for performance.

### Phase 4 (Quality) - Current status

Completed:
- TypeScript compile validation (`npx tsc --noEmit`)
- Endpoint coverage documentation in `MF_Test_Endpoints.md`
- Import dry-run and live-run test contract added

Recommended next add-ons (optional):
- automated integration tests for import idempotency
- load tests for `/api/mf/schemes`, `/api/mf/home`, `/api/mf/filters`

## 16) Audit Update (March 5, 2026)

After validating the client workbook `Moneynow_Mutual_Fund_Database_1.0.xlsx` against code:

- `mf/import/excel` is **not useless**. It is required to seed and refresh MF data from the workbook sheets:
  - `Categories_Master`
  - `Popular_Funds`
  - `NFO_List`
  - `Scheme_Details`
  - `Index_Data`
- Import mapping was aligned with actual sheet headers used in v1.0 (for example `Benchmark_1Y_Return`, `1Y_Return`, `3Y_CAGR`, `Top_5_Holdings`, `Exit_Load_Details`, `Is_Featured (Yes/No)`, `Risk_Level (Low/Moderate/High)`).
- Category resolver was hardened to prefer correct category matching when `Category_ID` and `Category_Name` are inconsistent in source rows.
- Index snapshot import now derives `main_category_code` from sheet category labels when explicit main-category code is not present.

Admin UI alignment update:

- MF listing actions now follow the same three-dot menu pattern as existing modules.
- Index snapshot edit route was removed from admin UI because backend intentionally supports create/toggle/delete (no update route).
