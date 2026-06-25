# ExportHub — Core System Architecture Plan

> **Scope:** Backend architecture only. No UI/frontend concerns.
> **Stack:** Node.js · MongoDB · REST APIs · RBAC

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Project Structure](#2-project-structure)
3. [Data Modeling (MongoDB Schemas)](#3-data-modeling-mongodb-schemas)
4. [Authentication & RBAC System](#4-authentication--rbac-system)
5. [Geo-Location & Warehouse Assignment Module](#5-geo-location--warehouse-assignment-module)
6. [Product CRUD & Enrichment Pipeline](#6-product-crud--enrichment-pipeline)
7. [Inventory Synchronization Engine](#7-inventory-synchronization-engine)
8. [Storefront Query Engine](#8-storefront-query-engine)
9. [Order Allocation & Stock Deduction](#9-order-allocation--stock-deduction)
10. [Background Reconciliation (Cron)](#10-background-reconciliation-cron)
11. [API Design & Route Map](#11-api-design--route-map)
12. [Error Handling & Logging Strategy](#12-error-handling--logging-strategy)
13. [Security Considerations](#13-security-considerations)
14. [Deployment & DevOps](#14-deployment--devops)
15. [Implementation Phases](#15-implementation-phases)

---

## 1. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER (Nginx)                      │
└──────────────────────────────┬────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  API Server  │ │  API Server  │ │  API Server  │  (Node.js cluster)
     │  (Instance)  │ │  (Instance)  │ │  (Instance)  │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │  MongoDB     │   │  Redis       │   │  Cron Worker │
   │  (Primary +  │   │  (Sessions,  │   │  (Reconcile, │
   │   Replicas)  │   │   Cache,     │   │   Cleanup)   │
   │              │   │   Events)    │   │              │
   └─────────────┘   └─────────────┘   └─────────────┘
```

### Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js (Express.js) | Non-blocking I/O, team familiarity |
| Database | MongoDB (Mongoose ODM) | Flexible schemas for multi-region product data |
| Cache Layer | Redis | Session store, geo-cache, inventory hot-cache |
| Job Scheduler | node-cron + Bull queue | Reliable background reconciliation |
| Event System | Node.js EventEmitter + MongoDB Change Streams | Real-time internal sync without external message broker |
| Auth | JWT (Access + Refresh tokens) | Stateless, scalable auth |

---

## 2. Project Structure

```
exporthub-api/
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection & options
│   │   ├── redis.js               # Redis client setup
│   │   ├── environment.js         # Env variable validation (Joi)
│   │   └── constants.js           # App-wide constants (roles, currencies, etc.)
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Warehouse.js
│   │   ├── Product.js
│   │   ├── InventoryRecord.js
│   │   ├── Order.js
│   │   ├── AuditLog.js
│   │   └── ReconciliationReport.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   └── user.validation.js
│   │   │
│   │   ├── warehouses/
│   │   │   ├── warehouse.controller.js
│   │   │   ├── warehouse.service.js
│   │   │   ├── warehouse.routes.js
│   │   │   └── warehouse.validation.js
│   │   │
│   │   ├── products/
│   │   │   ├── product.controller.js
│   │   │   ├── product.service.js
│   │   │   ├── product.routes.js
│   │   │   ├── product.validation.js
│   │   │   └── enrichment.service.js   # Separate enrichment logic
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.controller.js
│   │   │   ├── inventory.service.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── inventory.validation.js
│   │   │   └── inventory.events.js     # Event listeners for stock changes
│   │   │
│   │   ├── orders/
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.routes.js
│   │   │   └── order.validation.js
│   │   │
│   │   ├── storefront/
│   │   │   ├── storefront.controller.js
│   │   │   ├── storefront.service.js
│   │   │   ├── storefront.routes.js
│   │   │   └── storefront.validation.js
│   │   │
│   │   └── geo/
│   │       ├── geo.controller.js
│   │       ├── geo.service.js          # IP lookup + manual selection
│   │       ├── geo.routes.js
│   │       └── geo.validation.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js            # JWT verification
│   │   ├── authorize.js               # RBAC permission check
│   │   ├── rateLimiter.js             # Rate limiting
│   │   ├── validateRequest.js         # Joi/Zod schema validator
│   │   └── errorHandler.js            # Centralized error handler
│   │
│   ├── events/
│   │   ├── eventBus.js                # Central EventEmitter instance
│   │   ├── inventory.listeners.js     # Listen for stock mutations
│   │   └── order.listeners.js         # Listen for order lifecycle
│   │
│   ├── jobs/
│   │   ├── reconciliation.job.js      # Nightly inventory audit
│   │   ├── cacheWarmer.job.js         # Pre-warm storefront cache
│   │   └── scheduler.js              # Job registration & scheduling
│   │
│   ├── utils/
│   │   ├── ApiError.js                # Custom error class
│   │   ├── ApiResponse.js             # Standardized response wrapper
│   │   ├── logger.js                  # Winston/Pino logger
│   │   ├── currency.js                # Multi-currency formatting
│   │   └── pagination.js             # Cursor/offset pagination helper
│   │
│   └── app.js                         # Express app setup
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── seed.js                        # Database seeding
│   └── migrate.js                     # Data migration helpers
│
├── .env.example
├── .gitignore
├── package.json
└── server.js                          # Entry point (cluster mode)
```

---

## 3. Data Modeling (MongoDB Schemas)

### 3.1 User

```js
{
  _id: ObjectId,
  email: String,               // unique, indexed
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'warehouse_manager', 'warehouse_staff', 'marketer', 'customer']
  },
  permissions: [String],       // granular: ['product:create', 'inventory:update', ...]
  assignedWarehouse: ObjectId, // ref: Warehouse (null for customers/admins)
  detectedCountry: String,     // ISO 3166-1 alpha-2 (for customers)
  preferredCurrency: String,   // ISO 4217
  refreshTokens: [String],     // hashed refresh tokens
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 Warehouse

```js
{
  _id: ObjectId,
  name: String,                // "UK Warehouse", "Nepal Warehouse"
  code: String,                // unique: "WH-UK", "WH-NP"
  country: String,             // ISO 3166-1 alpha-2: "GB", "NP"
  countriesServed: [String],   // ["GB", "IE"] — countries this warehouse ships to
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    coordinates: {             // GeoJSON for proximity queries
      type: "Point",
      coordinates: [Number]    // [lng, lat]
    }
  },
  manager: ObjectId,           // ref: User
  contactEmail: String,
  contactPhone: String,
  isActive: Boolean,
  operatingHours: {
    timezone: String,          // "Europe/London"
    offPeakStart: String,      // "02:00" — for reconciliation scheduling
    offPeakEnd: String         // "05:00"
  },
  createdAt: Date,
  updatedAt: Date
}
// Index: { country: 1 }, { countriesServed: 1 }
```

### 3.3 Product

```js
{
  _id: ObjectId,
  sku: String,                 // unique, globally
  status: {
    type: String,
    enum: ['draft', 'pending_enrichment', 'published', 'archived']
  },

  // --- BASE DATA (Warehouse staff input) ---
  baseData: {
    name: String,
    weight: Number,            // grams
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String             // "cm"
    },
    category: String,
    subcategory: String,
    barcode: String,
    createdBy: ObjectId        // ref: User (warehouse staff)
  },

  // --- ENRICHMENT DATA (Admin/Marketer input) ---
  enrichmentData: {
    displayName: String,
    description: String,
    shortDescription: String,
    images: [{
      url: String,
      alt: String,
      isPrimary: Boolean,
      sortOrder: Number
    }],
    seoMetadata: {
      metaTitle: String,
      metaDescription: String,
      slug: String,            // unique, indexed
      keywords: [String]
    },
    isFlashSale: Boolean,      // Used to flag products for UI flash sale display
    tags: [String],
    enrichedBy: ObjectId,      // ref: User (marketer)
    enrichedAt: Date
  },

  // --- REGIONAL PRICING ---
  pricing: [{
    country: String,           // ISO 3166-1 alpha-2
    currency: String,          // ISO 4217: "USD", "GBP", "EUR", "NPR"
    basePrice: Number,         // stored in minor units (cents/pence)
    salePrice: Number,
    taxRate: Number,           // percentage
    isActive: Boolean
  }],

  createdAt: Date,
  updatedAt: Date
}
// Indexes: { sku: 1 }, { 'enrichmentData.seoMetadata.slug': 1 }, { status: 1 }
```

### 3.4 InventoryRecord

```js
{
  _id: ObjectId,
  product: ObjectId,           // ref: Product
  warehouse: ObjectId,         // ref: Warehouse
  sku: String,                 // denormalized for fast queries

  quantityOnHand: Number,      // physical stock
  quantityReserved: Number,    // reserved by pending orders
  quantityAvailable: Number,   // computed: onHand - reserved

  reorderLevel: Number,        // alert threshold
  lastPhysicalCount: Number,   // from last reconciliation
  lastCountDate: Date,

  history: [{                  // last N mutations (ring buffer, cap at 100)
    action: {
      type: String,
      enum: ['restock', 'damaged', 'recount', 'order_reserved', 'order_fulfilled', 'order_cancelled', 'order_returned', 'reconciliation_adjustment']
    },
    quantityChange: Number,    // +50, -3, etc.
    previousQuantity: Number,
    newQuantity: Number,
    performedBy: ObjectId,     // ref: User
    reason: String,
    timestamp: Date
  }],

  createdAt: Date,
  updatedAt: Date
}
// Compound index: { product: 1, warehouse: 1 } (unique)
// Index: { warehouse: 1, quantityAvailable: 1 }
```

### 3.5 Order

```js
{
  _id: ObjectId,
  orderNumber: String,         // unique, human-readable: "ORD-UK-20260625-0001"
  customer: ObjectId,          // ref: User
  assignedWarehouse: ObjectId, // ref: Warehouse (auto-assigned)

  items: [{
    product: ObjectId,
    sku: String,
    quantity: Number,
    unitPrice: Number,         // minor units, snapshot at order time
    currency: String
  }],

  totals: {
    subtotal: Number,
    tax: Number,               // Dynamic country-specific VAT/GST calculated at checkout
    shipping: Number,          // Dynamic shipping rates calculated at checkout
    total: Number,
    currency: String
  },

  status: {
    type: String,
    enum: ['pending_payment', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'returned', 'cancelled', 'refunded']
  },

  shippingAddress: {
    country: String,
    street: String,
    city: String,
    state: String,
    postalCode: String
  },

  timeline: [{
    status: String,
    timestamp: Date,
    updatedBy: ObjectId,
    note: String
  }],

  createdAt: Date,
  updatedAt: Date
}
// Indexes: { orderNumber: 1 }, { customer: 1 }, { assignedWarehouse: 1, status: 1 }
```

### 3.6 Cart

```js
{
  _id: ObjectId,
  customer: ObjectId,          // ref: User
  warehouse: ObjectId,         // Cart is strictly tied to one region's warehouse
  items: [{
    product: ObjectId,
    quantity: Number
  }],
  abandonedNotified: Boolean,  // True if user was prompted in-app about abandoned cart (no emails sent)
  updatedAt: Date
}
// Index: { customer: 1 }
```

### 3.7 AuditLog

```js
{
  _id: ObjectId,
  actor: ObjectId,             // ref: User
  action: String,              // "product:create", "inventory:update", "order:cancel"
  resource: {
    type: String,              // "Product", "InventoryRecord", "Order"
    id: ObjectId
  },
  changes: {
    before: Mixed,             // snapshot of changed fields
    after: Mixed
  },
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
// Index: { actor: 1, timestamp: -1 }, { 'resource.type': 1, 'resource.id': 1 }
// TTL Index: { timestamp: 1 }, expireAfterSeconds: 7776000 (90 days)
```

### 3.7 ReconciliationReport

```js
{
  _id: ObjectId,
  warehouse: ObjectId,        // ref: Warehouse
  runDate: Date,
  status: {
    type: String,
    enum: ['running', 'completed', 'failed']
  },
  summary: {
    totalProducts: Number,
    matchedCount: Number,
    discrepancyCount: Number
  },
  discrepancies: [{
    product: ObjectId,
    sku: String,
    systemQuantity: Number,
    physicalCount: Number,
    variance: Number,
    resolved: Boolean,
    resolvedBy: ObjectId,
    resolvedAt: Date
  }],
  alertSent: Boolean,
  createdAt: Date
}
// Index: { warehouse: 1, runDate: -1 }
```

---

## 4. Authentication & RBAC System

### 4.1 Auth Flow

```
[Login Request]
      │
      ▼
  Validate credentials (bcrypt.compare)
      │
      ▼
  Generate JWT Access Token  (15 min expiry, contains: userId, role, warehouseId)
  Generate JWT Refresh Token (7 day expiry, stored hashed in DB)
      │
      ▼
  Return tokens to client (access in body, refresh in httpOnly cookie)
```

### 4.2 Role-Permission Matrix

| Permission | super_admin | admin | warehouse_manager | warehouse_staff | marketer | customer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `user:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `warehouse:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `product:create_draft` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `product:enrich` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `product:publish` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `product:delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `inventory:view` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `inventory:update` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `order:view_all` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `order:view_own` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `order:manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `report:view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `storefront:browse` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 4.3 Middleware Chain

```
Request → rateLimiter → authenticate (JWT) → authorize (role + permission check) → validateRequest (schema) → controller
```

### 4.4 Authorization Middleware Logic

```
authorize(...requiredPermissions)
  │
  ├── Extract user.role and user.permissions from JWT payload
  ├── If role === 'super_admin' → ALLOW (bypass)
  ├── Merge role-default permissions with user-specific overrides
  ├── Check if user has ALL requiredPermissions
  │     ├── Yes → next()
  │     └── No  → throw ApiError(403, 'Insufficient permissions')
  │
  └── For warehouse-scoped resources:
        Check if user.assignedWarehouse matches the requested resource's warehouse
        (Note: Warehouse managers can log stock but cannot edit pricing, enforced here)
```

---

## 5. Geo-Location & Warehouse Assignment Module

### 5.1 Detection Strategy (Waterfall)

```
Step 1: Check if user has a saved country preference (DB / cookie)
   │
   ├── Found → Use saved country
   │
   └── Not found ↓

Step 2: IP-based geolocation
   │
   ├── Extract client IP (X-Forwarded-For header)
   ├── Query MaxMind GeoLite2 database (local, no API call)
   ├── Cache result in Redis (key: `geo:{ip}`, TTL: 24h)
   │
   ├── Country resolved → Save to user session / DB
   │
   └── Failed ↓

Step 3: Prompt for manual selection
   │
   └── Return list of supported countries from Warehouse.countriesServed
```

### 5.2 Warehouse Assignment Algorithm

```js
async function assignWarehouse(countryCode) {
  // 1. Find warehouses that serve this country
  const warehouses = await Warehouse.find({
    countriesServed: countryCode,
    isActive: true
  });

  if (warehouses.length === 0) throw new ApiError(404, 'No warehouse serves your region');
  if (warehouses.length === 1) return warehouses[0];

  // 2. If multiple warehouses serve the same country,
  //    pick the one IN the country (primary), otherwise nearest
  const primary = warehouses.find(w => w.country === countryCode);
  if (primary) return primary;

  // 3. Fallback: return first active warehouse for the region
  return warehouses[0];
}
// Note: Super Admins and Admins can override this assignment directly on the User profile.
```

### 5.3 Data Flow

```
Client Request (IP: 203.x.x.x)
      │
      ▼
  geo.service.detectCountry(ip)  →  "NP"
      │
      ▼
  geo.service.assignWarehouse("NP")  →  Warehouse { _id: "...", code: "WH-NP" }
      │
      ▼
  Store in: user.detectedCountry = "NP"
            session.warehouseId = warehouse._id
      │
      ▼
  All subsequent storefront queries are scoped to this warehouse
```

---

## 6. Product CRUD & Enrichment Pipeline

### 6.1 Product Lifecycle State Machine

```
                    ┌──────────┐
  Warehouse staff   │          │
  creates product   │  DRAFT   │
  ─────────────────►│          │
                    └────┬─────┘
                         │
                         │ Marketer enriches
                         ▼
                ┌──────────────────┐
                │    PENDING        │
                │   ENRICHMENT     │
                └────────┬─────────┘
                         │
                         │ Admin approves / publishes
                         ▼
                    ┌──────────┐
                    │PUBLISHED │◄─── Can be re-enriched
                    │          │     (stays published)
                    └────┬─────┘
                         │
                         │ Admin archives
                         ▼
                    ┌──────────┐
                    │ ARCHIVED │
                    │          │
                    └──────────┘
```

### 6.2 Draft Creation (Warehouse Staff)

```
POST /api/v1/products
Permission: product:create_draft
Body: { sku, name, weight, dimensions, category, barcode, warehouseId, initialQuantity }

Flow:
  1. Validate input (Joi schema)
  2. Check SKU uniqueness
  3. Create Product document with status = 'draft', baseData populated
  4. Create InventoryRecord { product, warehouse, quantityOnHand: initialQuantity }
  5. Emit event: 'product:created' → logged in AuditLog
  6. Return created product
```

### 6.3 Enrichment (Marketer)

```
PATCH /api/v1/products/:id/enrich
Permission: product:enrich
Body: { displayName, description, images[], seoMetadata, pricing[] }

Flow:
  1. Validate input
  2. Verify product exists and status is 'draft' or 'pending_enrichment' or 'published'
  3. Update enrichmentData fields (merge, don't replace)
  4. If status was 'draft' → set to 'pending_enrichment'
  5. Emit event: 'product:enriched'
  6. Return updated product
```

### 6.4 Publish (Admin)

```
PATCH /api/v1/products/:id/publish
Permission: product:publish

Flow:
  1. Validate product has required enrichment fields (displayName, ≥1 image, ≥1 pricing tier)
  2. Validate at least one InventoryRecord exists with quantityAvailable > 0
  3. Set status = 'published'
  4. Invalidate storefront Redis cache for affected warehouses
  5. Emit event: 'product:published'
```

---

## 7. Inventory Synchronization Engine

### 7.1 Event-Driven Architecture

```
┌──────────────────┐      emit()       ┌──────────────────┐
│  Inventory       │  ───────────────►  │   EventBus        │
│  Service         │                    │  (EventEmitter)    │
│                  │                    └────────┬───────────┘
└──────────────────┘                             │
                                    ┌────────────┼────────────┐
                                    ▼            ▼            ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ Update    │ │ Cache    │ │ Audit    │
                              │ Storefront│ │ Invalidate│ │ Logger  │
                              │ Visibility│ │ (Redis)  │ │          │
                              └──────────┘ └──────────┘ └──────────┘
```

### 7.2 Stock Mutation Operations

| Operation | Trigger | Effect | Event |
|---|---|---|---|
| **Restock** | Warehouse staff adds inventory | `quantityOnHand += N` | `inventory:restocked` |
| **Damaged** | Staff marks items damaged | `quantityOnHand -= N` | `inventory:damaged` |
| **Recount** | Physical count correction | `quantityOnHand = N` | `inventory:recounted` |
| **Reserve** | Customer places order | `quantityReserved += N` | `inventory:reserved` |
| **Fulfill** | Order shipped | `quantityOnHand -= N`, `quantityReserved -= N` | `inventory:fulfilled` |
| **Cancel** | Order cancelled | `quantityReserved -= N` | `inventory:released` |
| **Return** | Order returned | `quantityOnHand += N` | `inventory:returned` |

### 7.3 Atomic Stock Update (MongoDB Transaction)

```js
async function updateStock(productId, warehouseId, action, quantity, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const record = await InventoryRecord.findOne(
      { product: productId, warehouse: warehouseId }
    ).session(session);

    if (!record) throw new ApiError(404, 'Inventory record not found');

    // Calculate new quantities based on action
    const previousQty = record.quantityOnHand;
    // ... apply mutation logic based on action type

    // Optimistic concurrency: use __v (version key)
    record.quantityAvailable = record.quantityOnHand - record.quantityReserved;

    // Check for negative stock
    if (record.quantityAvailable < 0) {
      if (action === 'order_reserved') {
        throw new ApiError(409, 'Insufficient stock');
      }
      // If manual recount or damage causes negative stock, alert admin but allow the mathematical record
      eventBus.emit('alert:negative_stock', { productId, warehouseId, quantityAvailable: record.quantityAvailable });
    }

    // Push to history ring buffer
    record.history.push({
      action, quantityChange: quantity,
      previousQuantity: previousQty,
      newQuantity: record.quantityOnHand,
      performedBy: userId,
      timestamp: new Date()
    });

    // Cap history at 100 entries
    if (record.history.length > 100) {
      record.history = record.history.slice(-100);
    }

    await record.save({ session });
    await session.commitTransaction();

    // Emit event AFTER successful commit
    eventBus.emit(`inventory:${action}`, {
      productId, warehouseId, quantity,
      newAvailable: record.quantityAvailable
    });

    return record;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 7.4 Event Listeners

```js
// inventory.listeners.js

eventBus.on('inventory:*', async (data) => {
  // 1. Invalidate Redis cache
  await redis.del(`storefront:product:${data.productId}:${data.warehouseId}`);

  // 2. If quantity drops to 0, hide from storefront
  if (data.newAvailable <= 0) {
    await redis.sadd(`hidden_products:${data.warehouseId}`, data.productId);
  } else {
    await redis.srem(`hidden_products:${data.warehouseId}`, data.productId);
  }

  // 3. Log to AuditLog
  await AuditLog.create({ ... });
});
```

---

## 8. Storefront Query Engine

### 8.1 Product Listing Query Pipeline

```
GET /api/v1/storefront/products?page=1&limit=20&category=electronics&sort=price_asc

Pipeline:
  ┌──────────────────────────────────────────┐
  │ 1. Extract warehouseId from session       │
  │ 2. Extract countryCode from session       │
  └────────────────────┬─────────────────────┘
                       ▼
  ┌──────────────────────────────────────────┐
  │ 3. Build aggregation pipeline:            │
  │    - Match: status = 'published'          │
  │    - Lookup: InventoryRecord for warehouse│
  │    - Match: quantityAvailable > 0         │
  │    - Match: pricing[country].isActive     │
  │    - Project: localized fields only       │
  │    - Sort, Skip, Limit                    │
  └────────────────────┬─────────────────────┘
                       ▼
  ┌──────────────────────────────────────────┐
  │ 4. Cache result in Redis                  │
  │    Key: storefront:{warehouseId}:{hash}   │
  │    TTL: 5 minutes                         │
  └──────────────────────────────────────────┘
```

### 8.2 MongoDB Aggregation (Core Query)

```js
Product.aggregate([
  // Only published products
  { $match: { status: 'published' } },

  // Join inventory for this warehouse
  { $lookup: {
      from: 'inventoryrecords',
      let: { productId: '$_id' },
      pipeline: [
        { $match: {
            $expr: {
              $and: [
                { $eq: ['$product', '$$productId'] },
                { $eq: ['$warehouse', warehouseObjectId] }
              ]
            }
        }},
        { $project: { quantityAvailable: 1 } }
      ],
      as: 'inventory'
  }},

  // Must have stock
  { $match: { 'inventory.0.quantityAvailable': { $gt: 0 } } },

  // Filter to active pricing for this country
  { $addFields: {
      localPrice: {
        $arrayElemAt: [
          { $filter: {
              input: '$pricing',
              cond: {
                $and: [
                  { $eq: ['$$this.country', countryCode] },
                  { $eq: ['$$this.isActive', true] }
                ]
              }
          }},
          0
        ]
      }
  }},

  // Must have pricing for this region
  { $match: { localPrice: { $ne: null } } },

  // Project only storefront-safe fields
  { $project: {
      sku: 1,
      name: '$enrichmentData.displayName',
      description: '$enrichmentData.shortDescription',
      image: { $arrayElemAt: [
        { $filter: { input: '$enrichmentData.images', cond: '$$this.isPrimary' } }, 0
      ]},
      price: '$localPrice.basePrice',
      salePrice: '$localPrice.salePrice',
      currency: '$localPrice.currency',
      slug: '$enrichmentData.seoMetadata.slug',
      isFlashSale: '$enrichmentData.isFlashSale',
      inStock: { $gt: [{ $arrayElemAt: ['$inventory.quantityAvailable', 0] }, 0] },
      quantityAvailable: { $arrayElemAt: ['$inventory.quantityAvailable', 0] } // Exposed for customer UI inventory count
  }},

  { $sort: sortCriteria },
  { $skip: (page - 1) * limit },
  { $limit: limit }
]);
```

---

## 9. Order Allocation & Stock Deduction

### 9.1 Checkout Flow (Backend)

```
Step 1: CART VALIDATION
  │  Verify all items are still in stock (quantityAvailable ≥ cart quantity)
  │  Verify all items belong to the same regional warehouse (no multi-region carts)
  │  Re-fetch prices to prevent price manipulation
  │  Calculate dynamic shipping and country-specific VAT/GST
  │
  ▼
Step 2: STOCK RESERVATION (MongoDB Transaction)
  │  For each cart item:
  │    InventoryRecord.quantityReserved += item.quantity
  │    InventoryRecord.quantityAvailable -= item.quantity
  │  Create Order with status = 'pending_payment'
  │
  ▼
Step 3: PAYMENT PROCESSING
  │  Integrate with payment gateway (Stripe, PayPal, etc.)
  │  On success → status = 'payment_confirmed'
  │  On failure → RELEASE reserved stock, status = 'cancelled'
  │
  ▼
Step 4: ORDER ROUTING
  │  Emit event: 'order:confirmed'
  │  Listener assigns order to warehouse view
  │  Warehouse staff sees order in their dashboard
  │
  ▼
Step 5: FULFILLMENT
  │  Warehouse staff marks as 'shipped'
  │  quantityOnHand -= ordered quantity
  │  quantityReserved -= ordered quantity
  │  Emit event: 'order:shipped'
```

### 9.2 Race Condition Prevention

```
Strategy: Atomic findOneAndUpdate with conditions

await InventoryRecord.findOneAndUpdate(
  {
    product: productId,
    warehouse: warehouseId,
    quantityAvailable: { $gte: requestedQuantity }  // Atomic guard prevents simultaneous last-piece purchases
  },
  {
    $inc: {
      quantityReserved: requestedQuantity,
      quantityAvailable: -requestedQuantity
    }
  },
  { new: true }
);

// If result is null → stock was taken by another order → return 409 Conflict
```

### 9.3 Reservation Expiry

```
A background job runs every 15 minutes:
  - Find Orders with status = 'pending_payment' AND createdAt < (now - 30 minutes)
  - Release their reserved stock
  - Set order status = 'expired'
  - Emit event: 'order:expired'
```

---

## 10. Background Reconciliation (Cron)

### 10.1 Job Schedule

```js
// scheduler.js
const cron = require('node-cron');

// Runs at 2:00 AM daily for each warehouse (respecting timezone)
cron.schedule('0 2 * * *', async () => {
  const warehouses = await Warehouse.find({ isActive: true });

  for (const warehouse of warehouses) {
    await reconciliationQueue.add('reconcile', {
      warehouseId: warehouse._id,
      timezone: warehouse.operatingHours.timezone
    });
  }
});
```

### 10.2 Reconciliation Logic

```
For each warehouse:
  1. Fetch all InventoryRecords for the warehouse
  2. Compare quantityOnHand vs lastPhysicalCount
  3. Flag discrepancies where variance > threshold (configurable, e.g. 2%)
  4. Generate ReconciliationReport document
  5. If discrepancies found:
     a. Send admin alert (email / in-app notification)
     b. DO NOT auto-correct (requires manual review)
  6. Update lastCountDate on all checked InventoryRecords
```

### 10.3 Alert System

```
Discrepancy detected:
  │
  ├── Variance ≤ 5% → Severity: LOW → Log only
  ├── Variance 5-15% → Severity: MEDIUM → Email to warehouse_manager
  └── Variance > 15% → Severity: HIGH → Email to admin + warehouse_manager
```

---

## 11. API Design & Route Map

### Base URL: `/api/v1`

### 11.1 Auth Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Customer registration |
| `POST` | `/auth/login` | Public | Login (returns tokens) |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `POST` | `/auth/logout` | Authenticated | Invalidate refresh token |
| `POST` | `/auth/forgot-password` | Public | Send password reset email |
| `POST` | `/auth/reset-password` | Public | Reset password with token |

### 11.2 User Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/users` | `user:manage` | List all users (paginated) |
| `GET` | `/users/:id` | `user:manage` | Get user details |
| `POST` | `/users` | `user:manage` | Create staff/admin user |
| `PATCH` | `/users/:id` | `user:manage` | Update user role/permissions |
| `DELETE` | `/users/:id` | `user:manage` | Soft-delete user |
| `GET` | `/users/me` | Authenticated | Get own profile |
| `PATCH` | `/users/me` | Authenticated | Update own profile |

### 11.3 Warehouse Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/warehouses` | `warehouse:manage` | List all warehouses |
| `GET` | `/warehouses/:id` | `warehouse:manage` | Get warehouse details |
| `POST` | `/warehouses` | `warehouse:manage` | Create warehouse |
| `PATCH` | `/warehouses/:id` | `warehouse:manage` | Update warehouse |
| `DELETE` | `/warehouses/:id` | `warehouse:manage` | Deactivate warehouse |

### 11.4 Product Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/products` | `product:create_draft` | Create draft product |
| `GET` | `/products` | `inventory:view` | List all products (admin) |
| `GET` | `/products/:id` | `inventory:view` | Get product details (admin) |
| `PATCH` | `/products/:id` | `product:create_draft` | Update base data |
| `PATCH` | `/products/:id/enrich` | `product:enrich` | Enrich product |
| `PATCH` | `/products/:id/publish` | `product:publish` | Publish product |
| `PATCH` | `/products/:id/archive` | `product:delete` | Archive product |
| `DELETE` | `/products/:id` | `product:delete` | Hard delete (super_admin) |

### 11.5 Inventory Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/inventory` | `inventory:view` | List inventory (scoped to warehouse) |
| `GET` | `/inventory/:productId` | `inventory:view` | Get stock for a product |
| `PATCH` | `/inventory/:productId/restock` | `inventory:update` | Add stock |
| `PATCH` | `/inventory/:productId/damage` | `inventory:update` | Mark damaged |
| `PATCH` | `/inventory/:productId/recount` | `inventory:update` | Physical recount |
| `GET` | `/inventory/low-stock` | `inventory:view` | Products below reorder level |

### 11.6 Storefront Routes (Public / Customer)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/storefront/products` | `storefront:browse` | List products (localized) |
| `GET` | `/storefront/products/:slug` | `storefront:browse` | Product detail (by slug) |
| `GET` | `/storefront/categories` | `storefront:browse` | Available categories |
| `POST` | `/storefront/detect-location` | Public | Detect user location |
| `POST` | `/storefront/set-location` | Public | Manual country selection |

### 11.7 Order Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/orders` | `order:view_own` | Place order (customer) |
| `GET` | `/orders` | `order:view_all` | List all orders (admin) |
| `GET` | `/orders/my` | `order:view_own` | Customer's own orders |
| `GET` | `/orders/:id` | `order:view_own` | Order detail |
| `PATCH` | `/orders/:id/status` | `order:manage` | Update order status |
| `POST` | `/orders/:id/cancel` | `order:view_own` | Cancel order (if eligible) |

### 11.8 Reports Routes

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/reports/reconciliation` | `report:view` | List reconciliation reports |
| `GET` | `/reports/reconciliation/:id` | `report:view` | Report detail |
| `GET` | `/reports/inventory-summary` | `report:view` | Inventory overview |
| `GET` | `/reports/audit-log` | `report:view` | Audit trail |

---

## 12. Error Handling & Logging Strategy

### 12.1 Standardized API Response Format

```js
// Success
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "statusCode": 409,
  "message": "Insufficient stock for SKU #12345",
  "error": {
    "code": "INVENTORY_INSUFFICIENT",
    "details": {
      "requested": 5,
      "available": 2
    }
  },
  "stack": "..." // only in development
}
```

### 12.2 Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT expired |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | RBAC denied |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist |
| `VALIDATION_ERROR` | 400 | Request body/params invalid |
| `INVENTORY_INSUFFICIENT` | 409 | Not enough stock |
| `DUPLICATE_RESOURCE` | 409 | SKU/email already exists |
| `WAREHOUSE_UNAVAILABLE` | 503 | No warehouse for region |
| `RECONCILIATION_FAILED` | 500 | Cron job failure |

### 12.3 Logging Strategy

```
Logger: Pino (structured JSON logs)

Levels:
  - fatal: System crash, DB connection lost
  - error: Unhandled exceptions, failed transactions
  - warn:  Reconciliation discrepancies, near-zero stock
  - info:  API requests, order lifecycle events
  - debug: Query details, cache hits/misses (dev only)

Format:
  {
    "level": "info",
    "timestamp": "2026-06-25T02:00:00Z",
    "requestId": "uuid-v4",      // correlation ID
    "service": "inventory",
    "action": "restock",
    "userId": "ObjectId",
    "meta": { ... }
  }

Output:
  - Development: Pretty-printed to console
  - Production: JSON to stdout → collected by log aggregator (ELK / CloudWatch)
```

---

## 13. Security Considerations

| Concern | Solution |
|---|---|
| **Password Storage** | bcrypt with 12 salt rounds |
| **JWT Security** | Short-lived access tokens (15 min), httpOnly refresh cookies, token rotation |
| **Input Validation** | Joi/Zod on every endpoint, sanitize MongoDB operators (`$gt`, `$where`) |
| **Rate Limiting** | express-rate-limit: 100 req/min general, 5 req/min auth endpoints |
| **CORS** | Whitelist specific origins, no wildcards in production |
| **Helmet** | Security headers (CSP, X-Frame-Options, HSTS) |
| **Data Sanitization** | mongo-sanitize to prevent NoSQL injection |
| **Audit Trail** | Every mutation logged with actor, timestamp, IP |
| **Sensitive Data** | Never return passwordHash, refreshTokens in API responses |
| **Dependency Audit** | `npm audit` in CI pipeline, Snyk integration |

---

## 14. Deployment & DevOps

### 14.1 Environment Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Development │ ──► │   Staging   │ ──► │ Production  │
│             │     │             │     │             │
│ Local       │     │ Docker      │     │ Docker +    │
│ MongoDB     │     │ Compose     │     │ K8s / ECS   │
│ Redis mock  │     │ MongoDB     │     │ MongoDB     │
│             │     │ Atlas (dev) │     │ Atlas (prod)│
└─────────────┘     └─────────────┘     └─────────────┘
```

### 14.2 Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=exporthub

# Redis
REDIS_URL=redis://...

# Auth
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# GeoIP
MAXMIND_LICENSE_KEY=...
MAXMIND_DB_PATH=./data/GeoLite2-Country.mmdb

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Email (for alerts)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
ALERT_EMAIL_FROM=alerts@exporthub.com
ALERT_EMAIL_TO=admin@exporthub.com
```

### 14.3 Docker Setup

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

---

## 15. Implementation Phases

### Phase 1 — Foundation (Week 1-2)

| # | Task | Deliverable |
|---|---|---|
| 1.1 | Project scaffolding | Express app, folder structure, ESLint, Prettier |
| 1.2 | MongoDB connection module | `config/db.js` with retry logic |
| 1.3 | Redis connection module | `config/redis.js` with fallback |
| 1.4 | Environment validation | `config/environment.js` (Joi schema) |
| 1.5 | Error handling foundation | `ApiError`, `ApiResponse`, `errorHandler` middleware |
| 1.6 | Logger setup | Pino with request correlation IDs |
| 1.7 | All Mongoose models | User, Warehouse, Product, InventoryRecord, Order, AuditLog, ReconciliationReport |

### Phase 2 — Auth & RBAC (Week 2-3)

| # | Task | Deliverable |
|---|---|---|
| 2.1 | Registration & login | `auth.service.js` with bcrypt + JWT |
| 2.2 | Token refresh flow | Refresh token rotation, httpOnly cookies |
| 2.3 | `authenticate` middleware | JWT verification, user extraction |
| 2.4 | `authorize` middleware | Role-permission checking with warehouse scoping |
| 2.5 | User CRUD | Admin can create/manage staff users |
| 2.6 | Rate limiting | Per-endpoint rate limits |

### Phase 3 — Warehouse & Geo Module (Week 3-4)

| # | Task | Deliverable |
|---|---|---|
| 3.1 | Warehouse CRUD | Full admin management of warehouses |
| 3.2 | MaxMind GeoLite2 integration | Local DB-based IP geolocation |
| 3.3 | Manual country selection API | Endpoint + session persistence |
| 3.4 | Warehouse assignment algorithm | Country → Warehouse mapping logic |
| 3.5 | Redis geo-cache | Cache IP lookups with 24h TTL |

### Phase 4 — Product Pipeline (Week 4-5)

| # | Task | Deliverable |
|---|---|---|
| 4.1 | Product draft creation | Warehouse staff creates base product |
| 4.2 | Product enrichment API | Marketer enriches with marketing data |
| 4.3 | Product publish flow | Admin reviews and publishes |
| 4.4 | Product status state machine | Enforce valid transitions |
| 4.5 | Image upload integration | S3/Cloudinary for product images |

### Phase 5 — Inventory Engine (Week 5-6)

| # | Task | Deliverable |
|---|---|---|
| 5.1 | InventoryRecord CRUD | Stock management endpoints |
| 5.2 | Atomic stock mutations | MongoDB transactions for all operations |
| 5.3 | EventBus setup | Central event emitter with listeners |
| 5.4 | Inventory event listeners | Cache invalidation, audit logging, visibility toggling |
| 5.5 | Low-stock alerts | Reorder level notifications |

### Phase 6 — Storefront Engine (Week 6-7)

| # | Task | Deliverable |
|---|---|---|
| 6.1 | Localized product listing | Aggregation pipeline with warehouse + pricing filters |
| 6.2 | Product detail by slug | Single product with full enrichment data |
| 6.3 | Category listing | Available categories per region |
| 6.4 | Redis caching layer | 5-min TTL with event-driven invalidation |
| 6.5 | Search & filtering | Category, price range, sort |

### Phase 7 — Order System (Week 7-8)

| # | Task | Deliverable |
|---|---|---|
| 7.1 | Cart validation | Stock check + price verification |
| 7.2 | Stock reservation | Atomic reserve on checkout |
| 7.3 | Order creation | Full order lifecycle |
| 7.4 | Order routing to warehouse | Auto-assign + warehouse view |
| 7.5 | Reservation expiry job | 15-min cleanup of abandoned carts |
| 7.6 | Order status management | Status transitions with events |

### Phase 8 — Reconciliation & Reports (Week 8-9)

| # | Task | Deliverable |
|---|---|---|
| 8.1 | Reconciliation cron job | Nightly audit per warehouse |
| 8.2 | Discrepancy detection | Variance calculation + severity |
| 8.3 | Alert system | Email notifications by severity |
| 8.4 | Reconciliation reports API | View/download reports |
| 8.5 | Audit log API | Searchable activity trail |

### Phase 9 — Hardening & QA (Week 9-10)

| # | Task | Deliverable |
|---|---|---|
| 9.1 | Unit tests | Models, services, utilities (≥80% coverage) |
| 9.2 | Integration tests | API endpoint testing with supertest |
| 9.3 | Load testing | Artillery/k6 on critical paths (storefront, checkout) |
| 9.4 | Security audit | OWASP checklist, dependency audit |
| 9.5 | API documentation | Swagger/OpenAPI spec auto-generated |
| 9.6 | Docker + CI/CD | Dockerfile, docker-compose, GitHub Actions pipeline |

---

> **Total Estimated Timeline: 10 weeks**
>
> This plan focuses entirely on the backend system. Frontend/UI implementation is a separate workstream that consumes these APIs.
