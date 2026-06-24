---
trigger: always_on
---

# UI Design & Project Consistency Rules

You are an AI coding assistant working on the `next-ecom-design` project. Always adhere strictly to these guidelines.

## 1. Core Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** JavaScript only (`.js` and `.jsx`). Do not use TypeScript.
- **Styling:** Tailwind CSS v4. Note that Tailwind v4 does not use `tailwind.config.js`, it uses CSS variables and `@theme` directives in `src/app/globals.css`.
- **UI Libraries:** Radix UI primitives, Framer Motion for animations, Lucide React for icons.

## 2. Design Aesthetics (CRITICAL)
- **Premium Feel:** The UI must wow the user. Use best practices in modern web design (vibrant colors, glassmorphism, dynamic animations, dark modes).
- **Micro-interactions:** Add subtle animations for user experience (e.g., hover effects, layout transitions).
- **Colors & Typography:** Avoid plain generic colors. Use harmonious, curated color palettes. Use modern typography (e.g. Geist, Inter).

## 3. Architecture & Routing Quirks
- **File Structure:** Next.js routes exist inside `src/app/` but mostly just act as shells that import the actual page logic from `src/components/pages/`.
- **Navigation Bridging:** This project was migrated from a Vite SPA. It uses a custom `AppContext` to provide a mock `setPage` function to all legacy components. When you need to navigate, you can still use `setPage("shop")` which internally fires Next.js `router.push('/shop')`.

## 4. Component Creation
# UI Design & Project Consistency Rules

You are an AI coding assistant working on the `next-ecom-design` project. Always adhere strictly to these guidelines.

## 1. Core Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** JavaScript only (`.js` and `.jsx`). Do not use TypeScript.
- **Styling:** Tailwind CSS v4. Note that Tailwind v4 does not use `tailwind.config.js`, it uses CSS variables and `@theme` directives in `src/app/globals.css`.
- **UI Libraries:** Radix UI primitives, Framer Motion for animations, Lucide React for icons.

## 2. Design Aesthetics (CRITICAL)
- **Premium Feel:** The UI must wow the user. Use best practices in modern web design (vibrant colors, glassmorphism, dynamic animations, dark modes).
- **Micro-interactions:** Add subtle animations for user experience (e.g., hover effects, layout transitions).
- **Colors & Typography:** Avoid plain generic colors. Use harmonious, curated color palettes. Use modern typography (e.g. Geist, Inter).

## 3. Architecture & Routing Quirks
- **File Structure:** Next.js routes exist inside `src/app/` but mostly just act as shells that import the actual page logic from `src/components/pages/`.
- **Navigation Bridging:** This project was migrated from a Vite SPA. It uses a custom `AppContext` to provide a mock `setPage` function to all legacy components. When you need to navigate, you can still use `setPage("shop")` which internally fires Next.js `router.push('/shop')`.

## 4. Component Creation
- **Reusability:** Build necessary components using the existing design system tokens and Tailwind utilities. Keep them focused and reusable.
- **Server vs Client Components:** By default Next.js components are server components. If you are using React hooks (`useState`, `useEffect`, or Context), ensure you prepend `"use client";` at the top of the file.

## 5. Development Workflow & Documentation
- **Component Priority:** ALWAYS use existing UI components first before creating new ones.
- **Architecture Consistency:** ALWAYS follow the current design architecture perfectly.
- **Business Logic Explanations:** For any new feature, create a full flow of the feature, detailing what it touches and its business logic impact in a way that non-technical stakeholders can understand.
- **Documentation:** For any updates or new features, update the corresponding feature documentation. Place these updates inside the `docs/` folder (create it if it doesn't exist).
- **Activity Logging:** For every new API endpoint that modifies data (e.g., POST, PUT, DELETE), if it's feasible, wrap it with `withActivityTracker` to automatically push actions into the Activity Logs.
