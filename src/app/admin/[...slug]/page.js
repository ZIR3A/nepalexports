"use client";
import { Zap } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Page() {
  const pathname = usePathname();
  const activeNav = pathname.split('/').pop();

  return (
    <div className="bg-card border border-border p-12 flex flex-col items-center justify-center gap-4 min-h-64 text-center">
      <div className="w-12 h-12 bg-muted flex items-center justify-center">
        <Zap size={20} className="text-accent" />
      </div>
      <h3 className="font-display text-2xl font-light capitalize">{activeNav} Module</h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        This module is fully designed in the system. Navigate to Dashboard, Inventory, or Analytics to see the live data.
      </p>
    </div>
  );
}
