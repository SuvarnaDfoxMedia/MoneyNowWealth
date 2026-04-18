# Mutual Fund Excel Import / Export Guide

## Purpose

This guide explains how the Mutual Fund Excel import and export process works in the MoneyNow Wealth admin system.

It is meant for:

- Admin users who will upload Excel files
- Clients or operations teams who will prepare the sheets
- Anyone who needs to understand the required sheet structure before bulk upload

## Recommended Workflow

1. In the admin panel, open the relevant Mutual Fund listing page.
2. Click `Download Template`.
3. Fill the downloaded Excel file without changing the sheet names or column headers.
4. Return to the admin panel and click `Import`.
5. Upload the file and click `Validate`.
6. Review:
   - validation summary
   - parsed preview
   - error list or downloaded error report
7. Fix issues in the Excel file if needed.
8. Upload the corrected file again and re-run validation.
9. When validation passes, click `Confirm Import`.

## Best Practice

For large or first-time uploads, use the `Full Workbook` template.  
This is the safest option because related sheets are processed in the correct dependency order.

Import order used by the system:

1. Main Categories
2. Categories
3. AMCs
4. Funds
5. NFOs
6. Index Snapshots

## Export Options

The admin panel provides two export actions:

- `Download Template`
  Use this when preparing a fresh Excel sheet for upload. It gives the correct sheet names and headers.

- `Export Current Data`
  Use this when you want the latest system data exported for review, editing, or backup.

## General Rules

- Do not rename the Excel sheet tabs.
- Do not change column header names.
- The latest client workbook includes duplicate visible headers such as `benchmark_return_type`, `YTD`, and year columns. Always start from the exported template so those columns are preserved in the correct order.
- Prefer editing the downloaded template rather than making a sheet from scratch.
- Keep one record per row.
- Avoid duplicate rows for the same record in the same upload file.
- Use `Yes` or `No` for status-style columns like `is_active`, `sip_allowed`, `lumpsum_allowed`, `is_open`, `is_popular`, and `is_featured`.
- Dates should be entered as valid Excel dates or in a clear date format such as `YYYY-MM-DD`.
- `top_holdings` may be entered as comma-separated text or one holding per line. The importer will normalize it into a list.
- `Category average` values are recalculated from active scheme return data when funds are imported or updated.

## Sheet Details

### 1. Main Categories

Supported sheet name:

- `Main_Categories`

Main purpose:

- Create or update top-level mutual fund groupings

Important columns:

- `main_category_name` required
- `description` optional
- `sort_order` optional
- `is_active` optional

Notes:

- Main category names should be unique.

### 2. Categories

Supported sheet name:

- `Categories_Master`

Main purpose:

- Create or update categories under a main category

Important columns:

- `category_name` required
- `main_category_name` required unless a valid main category id is used
- `description` optional
- `benchmark_index_name` optional
- `benchmark_return_type` optional
- `benchmark_y1`, `benchmark_y3`, `benchmark_y5`, `benchmark_y10` optional
- `category_average_y1`, `category_average_y3`, `category_average_y5`, `category_average_y10` optional
- `risk_level` optional
- `suggested_use_case` optional
- `suggested_use_case_note` optional
- `is_active` optional

Notes:

- Each category must belong to a valid main category.
- If the main category does not already exist, upload it first or use the full workbook.

### 3. AMCs

Supported sheet name:

- `AMCs`

Main purpose:

- Create or update fund houses / AMCs

Important columns:

- `amc_name` required
- `is_active` optional

Notes:

- AMC names should be unique.

### 4. Funds

Supported sheet names:

- `Scheme_Details`
- `Popular_Funds`

Main purpose:

- Create or update mutual fund scheme records

Critical columns:

- `scheme_code` required
- `fund_name` required
- `amc_name` required unless a valid AMC id is used
- `category_name` required unless a valid category id is used

Common business columns:

- `main_category_name`
- `plan_type`
- `option_type`
- `aum_cr`
- `expense_ratio`
- return fields such as `return_1d`, `return_1m`, `return_3m`, `return_6m`, `return_1y`, `return_3y_cagr`, `return_5y_cagr`, `return_10y_cagr`
- risk metric fields such as `sharpe_3y`, `std_dev_3y`, `beta_3y`, `alpha_3y`, `max_drawdown_5y`, `turnover_ratio`
- `fund_manager`
- `launch_date`
- benchmark fields
- `min_investment`
- `sip_allowed`
- `min_sip_investment`
- `lumpsum_allowed`
- `min_lumpsum_investment`
- `exit_load`
- `is_featured`
- `is_popular`
- `fund_objective`
- `investment_strategy`
- `top_holdings`
- `equity_pct`
- `debt_pct`
- `other_pct`
- `tax_type`
- `riskometer_label`
- `is_active`

Important notes:

- `scheme_code` is mandatory and used for strict matching during updates.
- If `scheme_code` is missing, the system will block the row.
- Fund rows must resolve to a valid AMC and category.
- The `Popular_Funds` sheet is used to identify popular funds during import.

### 5. NFOs

Supported sheet name:

- `NFO_List`

Main purpose:

- Create or update New Fund Offer records

Critical columns:

- `nfo_id` required
- `fund_name` required
- `amc_name` required unless a valid AMC id is used
- `category_name` required unless a valid category id is used

Common columns:

- `main_category_name`
- `fund_objective_short`
- `subscription_start_date`
- `subscription_end_date`
- `min_investment`
- `benchmark`
- `risk_level`
- `is_open`
- `is_active`

Important notes:

- `nfo_id` is mandatory and used for strict matching during updates.
- `subscription_end_date` must be equal to or later than `subscription_start_date`.

### 6. Index Snapshots

Supported sheet name:

- `Index_Data`

Main purpose:

- Create or update benchmark return snapshots

Critical columns:

- `benchmark_index_name` required
- `last_updated_date` required

Common columns:

- `main_category_name`
- `category_name`
- `return_1y`
- `return_3y`
- `return_5y`
- `return_10y`
- `is_active`

Important notes:

- The system matches index snapshot rows using `benchmark_index_name` + `last_updated_date`.
- Use one row per benchmark per date.

## How Matching Works

### Insert

If the system does not find an existing record using its matching rule, it creates a new one.

### Update

If the system finds an existing record and one or more values changed, it updates that record.

### Skip

If the system finds the same record and nothing changed, it skips the row.

### Error

If a required field is missing or a linked record cannot be resolved, that row is marked as an error.

## Matching Rules Used by the System

- Main Categories: matched by name
- Categories: matched by category name within the related main category
- AMCs: matched by name
- Funds: matched by `scheme_code`
- NFOs: matched by `nfo_id`
- Index Snapshots: matched by `benchmark_index_name` + `last_updated_date`

## Common Validation Errors

### "No supported sheet found"

Meaning:

- The uploaded workbook does not contain the expected sheet name.

Fix:

- Use the template downloaded from the admin panel.

### "Missing required column"

Meaning:

- One or more important columns are missing from the sheet.

Fix:

- Restore the original template header names.

### "Main category could not be resolved"

Meaning:

- A category row refers to a main category that does not exist or is misspelled.

Fix:

- Correct the main category name or import the main category first.

### "Category could not be resolved"

Meaning:

- A fund, NFO, or index row refers to a category that does not exist or is misspelled.

Fix:

- Correct the category name or import the category first.

### "AMC could not be resolved"

Meaning:

- A fund or NFO row refers to an AMC that does not exist or is misspelled.

Fix:

- Correct the AMC name or import the AMC first.

### "`scheme_code` is required"

Meaning:

- The fund row cannot be matched safely without a scheme code.

Fix:

- Fill in `scheme_code` for every fund row.

### "`nfo_id` is required"

Meaning:

- The NFO row cannot be matched safely without an NFO id.

Fix:

- Fill in `nfo_id` for every NFO row.

## What the Admin User Sees During Validation

After clicking `Validate`, the system shows:

- total inserted count
- total updated count
- total skipped count
- total error count
- parsed preview for the uploaded workbook
- error list in the screen
- downloadable CSV error report

## Recommended Client Preparation Rules

If this guide is shared with a client or data-entry team, they should follow these rules:

1. Always start from the latest downloaded template.
2. Do not rename sheets.
3. Do not rename headers.
4. Do not leave `scheme_code` blank for funds.
5. Do not leave `nfo_id` blank for NFOs.
6. Keep AMC, category, and main category names consistent across sheets.
7. Prefer the full workbook template if multiple related sheets are being prepared together.

## Suggested Delivery Process with Client

1. Share the latest template workbook.
2. Share this guide PDF.
3. Ask the client to fill only the rows, not modify structure.
4. Ask them to keep names consistent across linked sheets.
5. Run admin validation before final import.
6. Send back the downloaded error report if corrections are needed.

## Final Recommendation

For new client onboarding or bulk setup, always use:

- `Download Template`
- `Full Workbook`
- `Validate` before `Confirm Import`

This gives the lowest chance of mismatch, missing dependency, or formatting error.
