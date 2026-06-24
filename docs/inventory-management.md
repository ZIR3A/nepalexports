# Inventory Management & Freight Claims

This document outlines the business logic and technical workflow for the unified Inventory Management system, specifically focusing on Inter-Warehouse Transfers (IWT), Partial Receipts, and Regional Storefront Publishing.

## 1. Inter-Warehouse Transfers (IWT)
**Business Logic:**
When physical stock needs to move across borders (e.g., Nepal Hub to UK Hub), it cannot remain actively purchasable on the e-commerce storefront.

**Flow:**
1. **Initiation:** The origin warehouse manager creates a transfer. The specified quantity is immediately **deducted** from the origin's physical inventory pool.
2. **Transit State:** The items are locked inside a `Transfer` document. They do not exist in either warehouse's `Available` pool, preventing accidental customer purchases.
3. **Tracking:** Logistics teams update milestones (`At Port`, `In Transit`) and attach tracking numbers directly to the transfer.

## 2. Partial Receipts & Reconciliation
**Business Logic:**
In global logistics, cargo often arrives damaged or short. The system must accommodate partial arrivals without blocking the intact inventory.

**Flow:**
1. **Confirmation:** When cargo arrives at the destination, the manager clicks "Receive Cargo". They are presented with the *Expected Quantity*.
2. **Actual Entry:** The manager inputs the physically verified *Actual Quantity*.
3. **Split Action:**
   - **Intact Cargo:** The actual quantity is immediately added to the destination warehouse's `Inventory`.
   - **Lost Cargo:** Any discrepancy (Expected - Actual) is immediately logged as a `cargo_loss` in the WMS Audit Log, and a `FreightClaim` is automatically generated.
4. **Freight Claims Dashboard:** The accounting team views all missing stock in the Freight Claims tab, exports CSV reports, and tracks reimbursement statuses with the logistics company.

## 3. Regional Storefront Publishing (Dual-Logic)
**Business Logic:**
When new inventory arrives at a destination (e.g., UK), it cannot instantly appear on the UK storefront if it is missing local pricing (GBP) or localized marketing. 

**Flow:**
1. **Scenario A: Restock (Already Exists in Market)**
   - If the product's `availableCountries` already includes the destination country (e.g., 'GB'), the newly received physical stock instantly makes the product available for purchase.
2. **Scenario B: Brand New to Market**
   - If the product has never been sold in this country, it is missing critical local pricing.
   - The backend pushes the country code to the product's `countryDrafts` array.
   - The product instantly appears in the destination admin's **Drafts & Enrichment** tab as a "Regional Draft".
   - The marketing team inputs the local price (GBP) and clicks "Publish to Catalog".
   - The system moves the country code into `availableCountries`, officially pushing the product live to the local storefront.
