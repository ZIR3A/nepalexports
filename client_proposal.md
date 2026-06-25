# Client Proposal: ExportHub Regional E-commerce Enhancement

## 1. Project Context
ExportHub is a multi-country e-commerce platform designed to connect global buyers with an integrated Warehouse Management System (WMS) built directly into the Admin Panel, featuring robust Role-Based Access Control (RBAC). 

**Tech Stack:** Node.js, MongoDB, REST APIs.

## 2. Proposed Core Enhancements

### 2.1 User Location & Warehouse Assignment
Implementation of a hybrid location detection module for the storefront:
* **Manual Selection:** Create a prompt for the user to manually determine their location.
* **Automatic Tracking:** Implement automatic IP address tracking as a fallback to ensure maximum accuracy.
* **Warehouse Assignment:** Based on the detected or selected country, dynamically query the database to assign the user to their specific regional warehouse.

### 2.2 Localized Storefront Display Logic
Ensure the storefront strictly filters the product display based on the user's region:
* **Regional Availability:** Customers must only see products available in their country's assigned warehouse.
* **Stock Protection:** If a product drops to zero stock in the local warehouse, hide it or mark it as "unavailable" to prevent overselling.
* **Localized Pricing:** Fetch and display country-specific pricing and multi-currency formatting (USD, GBP, EUR, NPR).

### 2.3 Admin Panel Product CRUD (The Enrichment Flow)
Build a Product CRUD module in the Admin Panel that leverages RBAC to distinguish logistical data entry from marketing data enrichment:
* **Data Ingestion:** Warehouse staff with appropriate permissions input raw base logistical data (SKU, quantity, weight), creating a draft product.
* **Data Enrichment:** Provide an interface for administrators/marketers to update and enrich this raw SKU with high-quality images, marketing descriptions, SEO metadata, and regional pricing tiers.
* **Unified Display:** The Storefront will seamlessly read this combined data for end-user display.

### 2.4 Integrated Synchronization Architecture
Since the WMS is natively integrated into the Admin Panel, synchronization is handled via direct internal database relationships and event listeners:
* **Initial Product Creation:** Warehouse staff log new physical items (e.g., "500 units of SKU #12345 in UK Warehouse"), instantly creating them as drafts within the Admin Panel.
* **Live Inventory Updates:** Internal event listeners trigger immediate stock level changes (damaged, recounted, restocked) across the platform whenever warehouse roles update the inventory records.
* **Order Allocation:** Upon completion of the checkout and payment flow, the system automatically routes the order details to the assigned local warehouse view, subtracting purchased items directly from the shared available stock pool.
* **Background Reconciliation:** Create a scheduled cron job to run during off-peak hours (e.g., 2:00 AM) that performs an internal audit between warehouse physical counts and storefront displayed inventory, generating an admin alert for any discrepancies.
