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

    const isPending = session?.user?.kycStatus === "PENDING";
    const allowedPaths = ["/onboarding", "/privacy-policy"];
    
    // We only force redirect if they are not already on an allowed page
    if (isPending && !allowedPaths.includes(pathname)) {
      router.push("/onboarding");
    }
  }, [session, status, pathname, router]);

  // Optionally, show nothing or a loader while deciding
  if (status === "loading") return null;
  
  const allowedPaths = ["/onboarding", "/privacy-policy"];
  if (session?.user?.kycStatus === "PENDING" && !allowedPaths.includes(pathname)) {
    // Return null to prevent a flash of the protected page before redirect happens
    return null; 
  }

  return <>{children}</>;
}
