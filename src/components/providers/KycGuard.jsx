"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function KycGuard({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // The interceptor has been disabled so users can browse freely
    // KYC will be enforced during the checkout flow instead
  }, [session, status, pathname, router]);

  // Optionally, show nothing or a loader while deciding
  if (status === "loading") return null;
  
  // The user is allowed to proceed regardless of KYC status
  // KYC validation is strictly handled at checkout

  return <>{children}</>;
}
