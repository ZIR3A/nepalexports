"use client";

import { useSession } from "next-auth/react";

/**
 * Conditionally renders children if the authenticated user has one of the allowed roles.
 * @param {Array<string>} allowedRoles - e.g., ['super_admin', 'marketing_admin']
 */
export function RequireRole({ allowedRoles, children }) {
  const { data: session, status } = useSession();

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  const userRole = session?.user?.role || "user";

  if (!allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
