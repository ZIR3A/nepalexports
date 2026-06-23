# Project Vision: Global Nepali Marketplace Ecommerce Platform

I want to build a scalable, modern ecommerce platform focused on connecting Nepal and the global Nepali diaspora, starting with Nepal + UK simultaneously and expanding internationally in the future.

The goal is to create a premium marketplace experience where customers can purchase Nepali-origin products, own-brand products, food items, lifestyle products, and future categories through a single platform.

The platform should feel like a combination of:
- Amazon (marketplace scalability)
- Shopify (commerce flexibility)
- Netflix (personalized discovery experience)
- Modern luxury brand websites (visual experience)

The first phase will launch with our own branded products, especially fashion items like T-shirts, but the architecture must support future categories like food, electronics, cultural products, and more.

---

# Business Model

Type:
- Ecommerce marketplace
- Own brand + future marketplace expansion

Initial Countries:
- Nepal
- United Kingdom

Future:
- Global expansion targeting Nepali communities worldwide

Main Audience:
- Customers in Nepal
- Nepali diaspora living abroad
- Customers interested in Nepali products and culture

---

# Core Goals

Build a platform that is:

- Highly scalable
- Multi-country ready
- Multi-currency supported
- Multi-warehouse supported
- Tax compliant - region wise
- AI-ready
- Mobile-friendly
- Premium user experience focused

---

# Customer Experience

Customers should be able to:

1. Create account
- Google login
- Email authentication

2. Browse products

Features:
- Categories
- Search
- Filters
- Recommendations
- Trending products
- Recently viewed products
- Personalized suggestions

3. Product pages

Each product supports:

- Images
- Videos
- Description
- Reviews
- Ratings
- Variants
- Size
- Color
- Quantity
- Availability by country

Example:

Classic Nepal Heritage T-Shirt

Variants:

Size:
- S
- M
- L
- XL

Color:
- Black
- White
- Red

---

# Product System

The product architecture must support multiple product types.

Product Types:

## Fashion

Example:
T-shirt

Supports:
- Size
- Color
- Fabric
- Style

---

## Food Products

Example:
Frozen momo

Supports:

- Weight
- Expiry date
- Batch number
- Storage requirement

---

## Future Products

Must support:

- Electronics
- Accessories
- Cultural items
- Digital products

---

# Currency System

The platform uses automatic currency conversion.

Base currency:

NPR

Customer location determines:

Nepal:
NPR

UK:
GBP

Other countries:
Local currency

Example:

Database:

Product price:
2500 NPR

Display:

Nepal:
Rs 2500

UK:
£14.50

---

# Tax System

Product prices exclude tax.

During checkout:

System detects:

- Customer country
- Tax rules
- VAT/GST requirements

Then automatically calculates:

Product price
+
Tax
+
Shipping

=

Final checkout price

Example:

UK:

Product:
£20

VAT:
20%

Total:
£24

---

# Warehouse System

The platform supports multiple warehouses.

Initial warehouses:

1. Nepal Warehouse

2. UK Warehouse


Inventory structure:

Product

↓

Warehouse Stock


Example:

Black T-shirt Large:

Nepal:
50 units

UK:
100 units


---

# Inventory Management

Admin can:

- Add stock
- Remove stock
- Transfer stock
- View inventory
- Track low stock


Custom low-stock rules:

Example:

Product:

Current stock:
5

Minimum stock:
20


System:

- Sends notification
- Creates restock alert

---

# Stock Transfer Workflow

Use:

Flow A

Meaning:

Admin manually controls transfer between warehouses.

Example:

Nepal warehouse:

500 units

Transfer:

100 units

to UK warehouse


Process:

Request

↓

Approval

↓

Shipping

↓

Stock update

---

# Cart and Checkout

Features:

- Multi-product cart
- Country-aware checkout
- Currency conversion
- Tax calculation
- Shipping calculation
- Payment processing

---

# Order Management

Order lifecycle:

Created

↓

Payment confirmed

↓

Inventory reserved

↓

Warehouse assigned

↓

Packed

↓

Shipped

↓

Delivered


---

# Returns System

Rules:

Return window:

7 days


Approval:

Admin controlled


Refund:

Wallet credit


Flow:

Customer request

↓

Admin review

↓

Approve/reject

↓

Wallet refund


---

# User Features

Customer dashboard:

- Profile
- Orders
- Wishlist
- My Lists
- Wallet
- Addresses
- Notifications


"My Lists" should work similar to Netflix lists.

Users can save products into collections.

---

# Admin Dashboard

Roles:

Super Admin

Permission-based users


Admin modules:

## Products

- Create product
- Edit product
- Manage variants
- Manage categories


## Inventory

- Stock overview
- Warehouse stock
- Transfers


## Orders

- View orders
- Update status
- Manage returns


## Customers

- Customer data
- Purchase history


## Analytics

Dashboard:

- Revenue
- Profit
- Customer growth
- Best-selling products
- Inventory value


---

# Notifications

Support:

Email

Push notifications


Events:

- Order confirmation
- Shipping updates
- Delivery updates
- Low stock alerts
- Promotions

---

# Customer Support

Primary:

WhatsApp integration


---

# Recommended Architecture

Frontend:

Next.js
TypeScript
Tailwind CSS
Framer Motion

# Backend Architecture Requirement

The backend/server must be built using Node.js only with JavaScript.

Do not use:

- TypeScript
- NestJS
- Laravel
- Django
- Spring Boot
- Other backend languages/frameworks

Use:

Runtime:
Node.js

Backend Framework:
Express.js OR Fastify

Language:
JavaScript (ES6+)

Architecture Style:

Clean modular JavaScript backend architecture.

---

# Backend Folder Structure

server/

├── src/

│
├── config/
│   ├── database.js
│   ├── environment.js
│   └── constants.js
│
├── modules/
│
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.model.js
│   │   └── auth.routes.js
│
│   ├── users/
│
│   ├── products/
│
│   ├── categories/
│
│   ├── inventory/
│
│   ├── warehouses/
│
│   ├── orders/
│
│   ├── payments/
│
│   ├── taxes/
│
│   ├── currency/
│
│   ├── notifications/
│
│   └── analytics/
│
├── middleware/
│
├── utils/
│
├── database/
│
├── jobs/
│
├── uploads/
│
└── server.js


---

# Database

Use:

PostgreSQL


ORM:

Prisma ORM OR Sequelize


Database design must support:

- Multi-country ecommerce
- Multiple currencies
- Multiple warehouses
- Product variants
- Different product types
- Tax calculation
- Inventory tracking
- Order history
- Customer wallet
- Returns


---

# API Architecture

Use REST API.

Examples:


Authentication:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/google


Products:

GET /api/products

GET /api/products/:id


Cart:

GET /api/cart

POST /api/cart/add


Orders:

POST /api/orders

GET /api/orders/:id


Inventory:

GET /api/inventory

POST /api/inventory/transfer


---

# Security

Implement:

- JWT authentication
- Refresh tokens
- Role-based access control
- Password hashing using bcrypt
- API validation
- Rate limiting
- Secure environment variables
- CORS protection


---

# Background Processing

Use Node.js background workers.

Recommended:

BullMQ + Redis


For:

- Email notifications
- Push notifications
- Stock alerts
- Currency updates
- Analytics calculations


---

# Real-Time System

Use:

Socket.IO


For:

- Live order updates
- Admin alerts
- Inventory notifications


---

# Payment Integration

Backend handles:


Nepal:

- eSewa
- Khalti


UK:

- Stripe


Payment flow:


Customer

↓

Frontend

↓

Node.js API

↓

Payment Provider

↓

Webhook verification

↓

Order confirmation


---

# Storage

Use:

AWS S3
or
Cloudflare R2


For:

- Product images
- Product videos
- User uploads


---

# Deployment

Frontend:

Next.js
JavaScript
Tailwind CSS
Framer Motion

Deployment:
Vercel

Backend:

Node.js
Express.js
JavaScript

Database:

MongoDB
Mongoose

Realtime:

Socket.IO

Queue / Background:

Redis + BullMQ

Storage:

Vercel storage


Deployment:
Vercel

---

# File Storage Architecture Requirement

The application should use a storage abstraction pattern.

Initial Storage Provider:

Vercel Blob


Future migration targets:

- AWS S3
- Cloudflare R2
- Google Cloud Storage
- Any S3-compatible storage


Important:

Do not directly call Vercel Blob functions throughout the application.

Create a separate storage service layer so changing storage providers requires minimal code changes.


---

# Storage Service Architecture


Backend structure:


src/

├── services/

│
└── storage/

    ├── storage.service.js

    ├── storage.provider.js

    ├── providers/

        ├── vercelBlob.provider.js

        ├── awsS3.provider.js

        └── cloudflareR2.provider.js



---

# Storage Interface


All storage providers must follow the same functions:


uploadFile()

deleteFile()

getFileUrl()

replaceFile()

uploadMultipleFiles()



Example:


Product Module


↓

Storage Service


↓

Active Storage Provider



The Product module should never know whether the file is stored in:

- Vercel Blob
- AWS S3
- Cloudflare R2



---

# Current Implementation


Active Provider:


Vercel Blob


Example:


Storage Service


↓

Vercel Blob Provider


↓

Vercel Storage



---

# Product Media Handling


Products should store only metadata:


Example:


Product:


{
 name:"Heritage T-Shirt",

 media:[

 {
  type:"image",

  url:"stored-file-url",

  provider:"vercel-blob",

  key:"products/tshirt/main.jpg"
 },

 {
  type:"video",

  url:"stored-video-url",

  provider:"vercel-blob",

  key:"products/tshirt/video.mp4"
 }

 ]

}



Do not store binary files in MongoDB.



---

# Upload Flow


Admin uploads product image:


Admin Dashboard

↓

Backend API

↓

Storage Service

↓

Active Provider

↓

Vercel Blob

↓

Return URL

↓

Save metadata in MongoDB



---

# Future Migration Example


Current:


storage.provider.js


exports.provider = vercelBlob



Future:


Change only:


storage.provider.js


exports.provider = awsS3



No changes required in:


- Products
- Orders
- Users
- Inventory
- Frontend



---

# Storage Requirements


Must support:


Images:

- Product images
- Category banners
- User avatars


Videos:

- Product videos
- Marketing videos


Files:

- Documents
- Future assets



---

# Optimization


Implement:


- Image compression before upload
- File size validation
- File type validation
- Unique file naming
- Folder structure


Example:


products/

 └── product-id/

      ├── images/

      └── videos/


users/

 └── user-id/



---

# Security


Storage system must include:


- Protected uploads
- Signed URLs when required
- Permission checks
- Admin-only product uploads


---

# Development Rule


The storage system must be provider-independent.

The application architecture should treat storage as a replaceable service, not a permanent dependency.

# Development Principles

Build using scalable JavaScript architecture.

Avoid:

- Hardcoded country rules
- Hardcoded product types
- Hardcoded warehouse logic


The backend must be flexible enough to support:

- Fashion products
- Food products
- Future marketplace sellers
- AI features
- Mobile applications

without rewriting the core system.
---

# Payment System

Nepal:

- eSewa
- Khalti


UK:

- Stripe


Future:

International payment providers

---

# AI Features (Future Ready)

Prepare architecture for:

AI product recommendations

AI customer assistant

AI search

AI shopping assistant

Demand prediction

Inventory forecasting

Personalized homepage

---

# Design Direction

The website should feel:

- Premium
- Modern
- Global
- Trustworthy
- Cultural but not outdated


Visual inspiration:

- Apple product presentation
- Netflix discovery
- Amazon commerce
- Luxury fashion websites


---

# Development Approach

Build in phases:

Phase 1:

- Ecommerce foundation
- Own brand products
- Nepal + UK
- Inventory
- Payments
- Orders


Phase 2:

- Food products
- More categories
- Advanced warehouse


Phase 3:

- Marketplace sellers
- AI features
- Global expansion


---

# Important Development Rules

Always build with scalability in mind.

Avoid hardcoded country logic.

Avoid hardcoded product types.

Use modular architecture.

Every feature should support future expansion.

The system should be production-grade, secure, maintainable, and enterprise-ready.