# Missing Pages & Features Analysis

Based on the `PRD.md` and the currently implemented frontend components in `src/components/pages/`, here is an analysis of the missing pages and features:

### 1. Missing Pages (UI)
- **Returns System (Customer UI):** A dedicated flow for customers to request returns within the 7-day window.
- **My Lists Page:** A Netflix-style custom lists page (currently only a basic `WishlistPage` exists).
- **Wallet Page:** A dedicated view for users to check wallet credit, refunds, and transaction history.
- **Notifications Hub:** A UI for users to view in-app notifications (order updates, shipping, restock alerts).
- **Admin Sub-Pages:** Currently, the entire admin panel seems to be in a single `AdminDashboard.jsx`. For scalability, this needs to be split into:
  - `AdminProducts.jsx` (Create/Edit/Variants)
  - `AdminInventory.jsx` (Stock, Warehouses, Transfers)
  - `AdminOrders.jsx` (View, Update, Returns)
  - `AdminCustomers.jsx`
  - `AdminAnalytics.jsx`

### 2. Missing Core Features (State & Logic)
- **Currency System:** Automatic currency conversion (NPR vs GBP) based on user location.
- **Tax System:** Dynamic checkout tax calculation (VAT/GST based on country).
- **Multi-Warehouse Logic:** Stock availability checking per warehouse (Nepal vs UK) on the ProductDetailPage and Cart.
- **Customer Support Integration:** WhatsApp chat widget integration.
- **Background Jobs System:** Infrastructure for email/push notifications and stock alerts.

---

# Backend Integration Plan (Inside Next.js)

The PRD initially suggested a separate Express.js server, but per your requirement, we will integrate the backend **directly inside this Next.js app**. We can achieve the "Clean modular JavaScript architecture" using Next.js API Routes (`src/app/api/...`) combined with Server Actions and modular service files.

### Folder Structure Adaptation
Instead of a separate `server/` folder, we will integrate it into the Next.js structure:

```
src/
├── app/
│   ├── api/                 # Next.js API Routes (Controllers)
│   │   ├── auth/route.js
│   │   ├── products/route.js
│   │   ├── inventory/route.js
│   │   └── ...
├── backend/                 # Modular Business Logic
│   ├── config/              # Database & Environment config
│   ├── services/            # Auth, Products, Inventory, Storage
│   ├── models/              # Mongoose / ORM schemas
│   ├── middleware/          # JWT, Role checks (used in API routes)
│   └── utils/               # Helpers
```

### Technology Stack for Backend
- **Framework:** Next.js API Routes (Edge/Node runtimes)
- **Database:** PostgreSQL (with Prisma) OR MongoDB (with Mongoose) - *We need to finalize this as PRD mentions both PostgreSQL and MongoDB in different sections. I recommend MongoDB based on your current setup if you prefer JS objects, or PostgreSQL with Prisma for strict relational integrity (taxes, multiple warehouses).*
- **Authentication:** NextAuth.js (Auth.js) or custom JWT via Next.js middleware.
- **Storage:** Vercel Blob (via abstraction layer).
- **Background Jobs:** In a serverless Next.js environment, we can use Vercel Cron Jobs or Upstash Redis (Serverless Background Jobs) instead of BullMQ.

---

# Phase-by-Phase Implementation Plan

## Phase 1: Foundation & Backend Setup
**Goal:** Setup the database, Next.js API architecture, and integrate Authentication.
1. **Database Setup:** Initialize MongoDB/Mongoose (or PostgreSQL/Prisma).
2. **Backend Architecture:** Create the `src/backend` folder structure (config, models, services).
3. **Authentication API:** Implement login, registration, and Google OAuth using NextAuth.js or custom JWT routes.
4. **Storage Abstraction:** Setup Vercel Blob service for future product uploads.
5. **Connect UI:** Wire the existing `AuthPage.jsx` to the actual backend API.

## Phase 2: Product & Inventory Management
**Goal:** Make products dynamic and support multi-warehouse inventory.
1. **Product Models:** Create schema for Fashion items (Variants: Size, Color).
2. **Inventory Models:** Create schema mapping Products -> Warehouses (Nepal/UK) -> Stock levels.
3. **Product APIs:** `GET /api/products`, `POST /api/products` (Admin).
4. **Connect UI:** Update `HomePage.jsx`, `ShopPage.jsx`, and `ProductDetailPage.jsx` to fetch real data from the API.
5. **Admin UI Refactor:** Break down `AdminDashboard.jsx` into specific product and inventory management views.

## Phase 3: Cart, Checkout, and Tax/Currency
**Goal:** Implement location-aware shopping.
1. **Currency/Tax Logic:** Create services to calculate dynamic pricing (NPR vs GBP) and apply VAT/taxes.
2. **Cart State Management:** Connect the frontend Cart to backend validation (checking stock availability in the correct warehouse).
3. **Payment Integration:** Implement eSewa/Khalti for Nepal, and Stripe for the UK via Next.js API routes.
4. **Checkout Flow:** Wire up `CheckoutPage.jsx` to submit orders securely to the database.

## Phase 4: Order Management & User Dashboard
**Goal:** Post-purchase experience and admin fulfillment.
1. **Order APIs:** Create endpoints for creating, tracking, and updating orders.
2. **User Dashboard:** Connect `AccountDashboard.jsx`, `OrderTracking.jsx`, and build the missing **Returns System** & **Wallet** UI.
3. **My Lists:** Implement the Netflix-style custom collections database schema and UI.
4. **Admin Fulfillment:** Build the admin screens for packing, shipping, and managing returns.

## Phase 5: Notifications & Optimization
**Goal:** Automate alerts and ensure system scalability.
1. **Background Jobs:** Setup serverless cron jobs (e.g., Upstash) for low stock alerts.
2. **Notifications API:** Implement email integration (e.g., Resend) and Socket.io for real-time admin alerts.
3. **Customer Support:** Add the WhatsApp integration widget.
4. **UI Polish:** Ensure all new components strictly adhere to the premium Tailwind v4 + Framer Motion design system.

---
**Note on UI Design System:** As requested, no new UI dependencies or external design frameworks will be introduced without your explicit permission. We will strictly utilize the existing Tailwind v4 (`theme.css`/`globals.css`) and Framer Motion setup to build the missing pages.
