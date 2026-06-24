"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function RoleGuard({ allowedRoles, fallbackRoute = "/admin", children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    const userRole = session?.user?.role || "user";

    if (!allowedRoles.includes(userRole)) {
      router.push(fallbackRoute); // Redirect unauthorized users
    }
  }, [session, status, allowedRoles, fallbackRoute, router]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userRole = session?.user?.role || "user";
  if (!allowedRoles.includes(userRole)) {
    return null; // Prevent flash of unauthorized content
  }

  return <>{children}</>;
}
