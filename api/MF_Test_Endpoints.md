# MF API Complete Test Endpoints

This document is updated as per current backend code (`src/routes/mfRoutes.ts`, mounted at `/api`).

## 1. Base Setup

Base URL:
- `http://localhost:5000`

MF route prefix:
- `/api/mf/...` (public)
- `/api/{role}/mf/...` (protected, role-based)

Auth for protected endpoints:
- Middleware reads `token` from **cookie** (`req.cookies.token`), not Bearer header.
- In Postman, first call login, then reuse returned cookie.

Role path rule:
- If logged-in user role is `admin`, use `/api/admin/...`
- If logged-in user role is `editor`, use `/api/editor/...`
- Role mismatch returns `403`.

Common header:
- `Content-Type: application/json`
- `Cookie: token=<JWT_TOKEN>` for protected endpoints (Postman may auto-manage this from login response)

## 2. Pre-step (Get Auth Cookie)

Local login endpoint (for admin/editor cookie):
- `POST /api/auth/login`

Request JSON:
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

Use returned cookie `token` for all `/api/{role}/...` endpoints.

## 3. Execution Order (Recommended)

1. Create main category
2. Create category
3. Create scheme
4. Create NFO
5. Create index snapshot
6. Run Phase 2 Excel import dry-run
7. Run Phase 2 live import
8. Validate public list/detail endpoints
9. Validate Phase 3 discovery endpoints (`/mf/home`, `/mf/filters`)
10. Validate admin/editor list/update/toggle/delete endpoints

## 4. Reusable Request Payloads

### 4.1 Main Category (Create)
`POST /api/admin/mf/main-categories/create`
```json
{
  "code": "equity",
  "name": "Equity",
  "description": "Equity oriented mutual fund categories",
  "sort_order": 1,
  "is_active": 1
}
```

### 4.2 Category (Create)
`POST /api/admin/mf/categories/create`
```json
{
  "category_id": "101",
  "name": "Large Cap",
  "main_category_code": "equity",
  "short_description": "Top 100 companies by market cap",
  "benchmark_index_name": "Nifty 50 TRI",
  "benchmark_returns": {
    "y1": 6.4,
    "y3": 12.5,
    "y5": 14.2,
    "y10": 13.8
  },
  "risk_level": "Moderate to High",
  "suggested_use_case": "Long-term wealth building",
  "is_active": 1
}
```

### 4.3 Scheme (Create)
`POST /api/admin/mf/schemes/create`
```json
{
  "scheme_code": "FND001",
  "fund_name": "ABC Large Cap Fund",
  "amc_name": "ABC Mutual Fund",
  "category_excel_id": "101",
  "plan_type": "Regular",
  "option_type": "Growth",
  "aum_cr": 25000,
  "expense_ratio": 1.65,
  "returns": {
    "y1": 18.2,
    "y3_cagr": 14.5,
    "y5_cagr": 15.8,
    "y10_cagr": 13.9
  },
  "risk_metrics": {
    "sharpe_3y": 0.78,
    "std_dev_3y": 14.2,
    "beta_3y": 0.9,
    "alpha_3y": 2.1,
    "max_drawdown_5y": -22.5,
    "turnover_ratio": 0.45
  },
  "fund_manager": "Rohit Sharma",
  "launch_date": "2010-05-12",
  "min_investment": 5000,
  "exit_load": "1% if redeemed within 1 year",
  "is_featured": true,
  "fund_objective": "Long-term capital appreciation",
  "investment_strategy": "Top 100 companies",
  "top_holdings": ["HDFC Bank", "Reliance", "TCS"],
  "asset_allocation": {
    "equity_pct": 95,
    "debt_pct": 3,
    "other_pct": 2
  },
  "tax_type": "Equity",
  "riskometer_label": "Very High",
  "is_active": 1
}
```

### 4.4 NFO (Create)
`POST /api/admin/mf/nfo/create`
```json
{
  "nfo_id": "NFO001",
  "fund_name": "ABC Multi Asset Fund",
  "amc_name": "ABC Mutual Fund",
  "category_excel_id": "101",
  "fund_objective_short": "Equity + debt + gold",
  "subscription_start_date": "2026-03-01",
  "subscription_end_date": "2026-03-15",
  "min_investment": 5000,
  "benchmark": "Composite Index",
  "risk_level": "Moderate",
  "is_open": true,
  "is_active": 1
}
```

### 4.5 Index Snapshot (Create)
`POST /api/admin/mf/index-snapshots/create`
```json
{
  "benchmark_index_name": "Nifty 50 TRI",
  "main_category_code": "equity",
  "category_excel_id": "101",
  "returns": {
    "y1": 20.1,
    "y3": 12.5,
    "y5": 14.2,
    "y10": 13.8
  },
  "last_updated_date": "2026-03-05",
  "is_active": 1
}
```

## 5. Public Endpoints (No Auth)

### 5.1 Main Categories
- `GET /api/mf/main-categories`
- `GET /api/mf/main-categories?page=1&limit=20&search=equity&is_active=1&sortBy=sort_order&sortOrder=asc`
- `GET /api/mf/main-categories/{mainCategoryMongoId}`

### 5.2 Categories
- `GET /api/mf/categories`
- `GET /api/mf/categories?page=1&limit=20&mainCategory=equity&search=large&is_active=1`
- `GET /api/mf/categories/{identifier}`

`{identifier}` can be:
- category excel id like `101`
- slug like `large-cap`
- Mongo `_id`

### 5.3 Schemes
- `GET /api/mf/schemes`
- `GET /api/mf/schemes?page=1&limit=20&categoryId=101&mainCategory=equity&amc=abc-mutual-fund`
- `GET /api/mf/schemes?planType=Regular&optionType=Growth&is_featured=true&is_active=1`
- `GET /api/mf/schemes?minY1=10&minY3=8&expenseMin=0.5&expenseMax=2&aumMin=1000&aumMax=50000`
- `GET /api/mf/schemes?search=ABC&sortBy=returns.y3_cagr&sortOrder=desc`
- `GET /api/mf/schemes/{schemeCode}`
- `GET /api/mf/schemes/slug/{slug}`

### 5.4 NFO
- `GET /api/mf/nfo`
- `GET /api/mf/nfo?page=1&limit=20&isOpen=true&categoryId=101&amc=abc-mutual-fund&search=multi`
- `GET /api/mf/nfo/{nfoMongoId}`

### 5.5 Index Snapshots
- `GET /api/mf/index-snapshots`
- `GET /api/mf/index-snapshots?page=1&limit=20&benchmark=Nifty&mainCategory=equity&categoryId=101`
- `GET /api/mf/index-snapshots?fromDate=2026-01-01&toDate=2026-12-31&sortBy=last_updated_date&sortOrder=desc`

### 5.6 MF Home (Phase 3)
- `GET /api/mf/home`
- `GET /api/mf/home?featuredLimit=6&nfoLimit=6&categoryLimit=8&indexLimit=8`

Expected sections in response:
- `mainCategories`
- `featuredFunds`
- `openNfos`
- `topCategoriesByReturn`
- `indexHighlights`

### 5.7 MF Filters (Phase 3)
- `GET /api/mf/filters`
- `GET /api/mf/filters?mainCategory=equity`

Expected keys in response:
- `mainCategories`
- `categories`
- `amcs`
- `planTypes`
- `optionTypes`
- `riskLabels`
- `ranges` (`y1`, `y3`, `expenseRatio`, `aumCr`)

## 6. Protected Admin/Editor Endpoints

Use `{role}` as `admin` or `editor` based on login role.

### 6.1 List (Protected)
- `GET /api/{role}/mf/main-categories`
- `GET /api/{role}/mf/categories`
- `GET /api/{role}/mf/schemes`
- `GET /api/{role}/mf/nfo`
- `GET /api/{role}/mf/index-snapshots`

All query filters from public endpoints also apply here.

### 6.2 Main Category (Protected)
- `POST /api/{role}/mf/main-categories/create`
- `PUT /api/{role}/mf/main-categories/edit/{id}`
- `PATCH /api/{role}/mf/main-categories/toggle-status/{id}`
- `DELETE /api/{role}/mf/main-categories/delete/{id}`

Update JSON:
```json
{
  "name": "Equity Updated",
  "description": "Updated description",
  "sort_order": 10
}
```

### 6.3 Category (Protected)
- `POST /api/{role}/mf/categories/create`
- `PUT /api/{role}/mf/categories/edit/{id}`
- `PATCH /api/{role}/mf/categories/toggle-status/{id}`
- `DELETE /api/{role}/mf/categories/delete/{id}`

Update JSON:
```json
{
  "name": "Large Cap Updated",
  "main_category_code": "equity",
  "risk_level": "High",
  "benchmark_returns": {
    "y1": 8.1,
    "y3": 12.1,
    "y5": 14.1,
    "y10": 13.1
  }
}
```

### 6.4 Scheme (Protected)
- `POST /api/{role}/mf/schemes/create`
- `PUT /api/{role}/mf/schemes/edit/{id}`
- `PATCH /api/{role}/mf/schemes/toggle-status/{id}`
- `DELETE /api/{role}/mf/schemes/delete/{id}`

Update JSON:
```json
{
  "fund_name": "ABC Large Cap Fund Updated",
  "expense_ratio": 1.55,
  "is_featured": false,
  "returns": {
    "y1": 19.2,
    "y3_cagr": 15.0,
    "y5_cagr": 16.1,
    "y10_cagr": 14.0
  }
}
```

### 6.5 NFO (Protected)
- `POST /api/{role}/mf/nfo/create`
- `PUT /api/{role}/mf/nfo/edit/{id}`
- `PATCH /api/{role}/mf/nfo/toggle-status/{id}`
- `DELETE /api/{role}/mf/nfo/delete/{id}`

Update JSON:
```json
{
  "fund_name": "ABC Multi Asset Fund Updated",
  "subscription_start_date": "2026-03-01",
  "subscription_end_date": "2026-03-20",
  "is_open": false,
  "risk_level": "Moderate to High"
}
```

### 6.6 Index Snapshot (Protected)
- `POST /api/{role}/mf/index-snapshots/create`
- `PATCH /api/{role}/mf/index-snapshots/toggle-status/{id}`
- `DELETE /api/{role}/mf/index-snapshots/delete/{id}`

Note: no update (`PUT`) endpoint exists for index snapshots.

## 7. Required Fields / Validation Quick Notes

Main category create:
- required: `name`
- `code` auto-derived from `name` if omitted

Category create:
- required: `name`, `category_id`, and one of `main_category_id` or `main_category_code`

Scheme create:
- required: `scheme_code`, `fund_name`, and one of `amc_id`/`amc_name`, and one of `category_id`/`category_excel_id`
- `plan_type` allowed: `Regular`, `Direct`, `""`
- `option_type` allowed: `Growth`, `IDCW`, `""`

NFO create:
- required: `nfo_id`, `fund_name`, and one of `amc_id`/`amc_name`, and one of `category_id`/`category_excel_id`
- if both subscription dates passed, end date must be >= start date

Index snapshot create:
- required: `benchmark_index_name`, `last_updated_date`
- unique combination: `benchmark_index_name + last_updated_date`

## 8. Negative Test Cases

1. Duplicate main category code:
- create same `code` twice -> `400`

2. Duplicate category id:
- create same `category_id` twice -> `400`

3. Duplicate scheme code:
- create same `scheme_code` twice -> `400`

4. Duplicate NFO id:
- create same `nfo_id` twice -> `400`

5. Invalid NFO date range:
- end date before start date -> `400`

6. Missing required fields:
- scheme without `scheme_code` or `fund_name` -> `400`
- category without `name`/`category_id` -> `400`
- index snapshot without `benchmark_index_name`/`last_updated_date` -> `400`

7. Invalid role path:
- admin cookie + `/api/editor/...` (or editor cookie + `/api/admin/...`) -> `403`

8. Missing cookie token on protected endpoint:
- `401` (`Not authorized, token missing`)

## 9. Pass Criteria

1. Create endpoints return `201` with `success: true` and `data`.
2. List endpoints return pagination keys: `data`, `total`, `currentPage`, `totalPages`, `limit`.
3. Detail endpoints return correct single record.
4. Toggle endpoints flip `is_active` between `1` and `0`.
5. Delete endpoints soft-delete records (not returned in default lists).
6. `/api/mf/home` returns all five discovery sections.
7. `/api/mf/filters` returns filter metadata and numeric ranges.

## 10. Phase 2 - Excel Import Endpoint

Phase 2 import endpoint (admin/editor protected):
- `POST /api/{role}/mf/import/excel`

Important:
- This endpoint is required for client workbook onboarding and refresh.
- Do not remove it unless workbook-based ingestion is explicitly dropped from product scope.

### 10.1 Dry-run import (recommended first)

Request JSON:
```json
{
  "filePath": "D:\\Dfox-Media\\projects\\MoneyNowDoc\\Moneynow_Mutual_Fund_Database_1.0.xlsx",
  "dryRun": true
}
```

Expected:
- `200`
- message: `Dry-run import completed`
- summary keys: `mainCategories`, `categories`, `amcs`, `schemes`, `nfos`, `indexSnapshots`
- each summary key has: `inserted`, `updated`, `skipped`, `errors`
- `errors` includes row-level sheet errors (max 200 entries in response)

### 10.2 Live import

Request JSON:
```json
{
  "filePath": "D:\\Dfox-Media\\projects\\MoneyNowDoc\\Moneynow_Mutual_Fund_Database_1.0.xlsx",
  "dryRun": false
}
```

Expected:
- `200`
- message: `Excel import completed`
- idempotent behavior on repeated runs (mostly update/skip, not duplicate create)

### 10.3 Processing order used by backend

1. `Categories_Master`
2. `Popular_Funds`
3. `Scheme_Details`
4. `NFO_List`
5. `Index_Data`

### 10.4 Import negative tests

1. Missing `filePath` -> `400`, `filePath is required`
2. Invalid path -> `400`, message starts with `Excel file not found at path`
3. Missing token cookie -> `401`
4. Role mismatch in URL -> `403`

### 10.5 Excel v1.0 header compatibility (verified)

Import mapping is aligned with real headers from:
- `Categories_Master`:
  - `Fund_Type (Equity/Hybrid/Debt/Index/ELSS)`
  - `Benchmark_1Y_Return`, `Benchmark_3Y_Return`, `Benchmark_5Y_Return`, `Benchmark_10Y_Return`
  - `Risk_Level (Low/Moderate/High)`
  - `Is_Active (Yes/No)`
- `Popular_Funds`:
  - `Plan_Type (Regular/Direct)`, `Option (Growth/IDCW)`
  - `1Y_Return`, `3Y_CAGR`, `5Y_CAGR`, `10Y_CAGR`
  - `Sharpe_Ratio_3Y`
  - `Is_Featured (Yes/No)`
- `Scheme_Details`:
  - `Top_5_Holdings`
  - `Portfolio_Turnover_Ratio`
  - `Exit_Load_Details`
- `Index_Data`:
  - `1Y_Return`, `3Y_Return`, `5Y_Return`, `10Y_Return`
  - `Category_Name` fallback for deriving `main_category_code` when category id/code is absent

## 11. Postman Troubleshooting

If you get:
- `Cannot read properties of undefined (reading 'code')` (older build), or
- `Request body is required` (current build),

then your request body is not parsed as JSON. Fix in Postman:
1. `Body` -> `raw` -> choose `JSON`.
2. Ensure header `Content-Type: application/json`.
3. Send valid JSON object (not text/plain).
4. For protected routes, ensure login was called first and `token` cookie exists.
