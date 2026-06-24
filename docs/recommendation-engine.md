# Dynamic Recommendation Engine

This document outlines the business logic and technical implementation for the "You May Also Like" recommendation engine on the Product Detail Page.

## Business Logic
The goal of the recommendation engine is to increase Average Order Value (AOV) by showing customers related products they are likely to purchase. However, because ExportHub operates on a strictly regional fulfillment model, we cannot recommend products that are out of stock in the customer's region.

**The Four Rules of Recommendation:**
1. **Regional Stock:** The engine strictly filters out any product that does not have physical inventory in the customer's assigned warehouse (e.g., UK or Nepal).
2. **Exclusion:** The engine never recommends the product the user is currently looking at.
3. **Affinity Scoring:** Products earn "points" to rank higher.
   - +2 Points: If the recommended product shares the exact same primary category as the current product.
   - +1 Point: For every "tag" (e.g., `summer`, `cotton`) that the two products share.
4. **Fallback:** If a product is highly unique and there are no direct category or tag matches in the local warehouse, the engine falls back to recommending the newest available inventory to ensure the shelf is never empty.

## Technical Implementation
- **Backend API (`/api/recommendations`)**: A GET endpoint that accepts `productId`, `categoryId`, `tags`, and `warehouseId`. It queries the `Inventory` collection to find in-stock items, then maps those to the `Product` collection and applies the scoring algorithm in-memory.
- **Frontend Component (`<RelatedProducts />`)**: A dedicated React component that sits at the bottom of the PDP. It hooks into the global `AppContext` to inject the correct multi-currency pricing before rendering the product cards.
