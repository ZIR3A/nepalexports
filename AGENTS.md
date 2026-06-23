<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# E-commerce Design Project Rules

## AI Agent Guidelines

1. **JavaScript Only:** This project strictly uses JavaScript. Do not generate TypeScript (`.ts` or `.tsx`) files.
2. **Tailwind CSS v4:** We are using Tailwind v4. Do not attempt to modify or look for a `tailwind.config.js` file. All theme configurations reside within `src/app/globals.css` using CSS `@theme`.
3. **UI/UX Standard:** You must prioritize high-end, premium web design. Always incorporate Framer Motion animations, Radix UI accessibility, and sleek Tailwind layouts. The user must be "wowed" at first glance.
4. **Mocked Routing State:** Components in `src/components/pages/` receive a `setPage` prop from `AppContext`. This is a legacy from the Vite SPA architecture that intercepts strings like `"cart"` and uses Next.js `router.push('/cart')`. When writing new components, you may continue to use `setPage` from `useAppContext()` to trigger navigations seamlessly.
