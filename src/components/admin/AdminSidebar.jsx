"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart2, Package, Grid, User, List, MapPin, TrendingUp, CreditCard, Settings, ArrowRight, FolderTree, ArrowRightLeft, Bell } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeRole = session?.user?.role || "user";

  const navSections = [
    {
      title: "Main",
      roles: ["super_admin", "marketing_admin"],
      items: [
        { id: "dashboard", label: "Dashboard", icon: BarChart2 },
        { id: "orders", label: "Orders", icon: Package },
        { id: "products", label: "Products", icon: Grid },
        { id: "categories", label: "Categories", icon: FolderTree },
        { id: "warehouses", label: "Warehouses", icon: MapPin },
        { id: "customers", label: "Customers", icon: User },
      ]
    },
    {
      title: "Inventory",
      roles: ["super_admin", "warehouse_manager"],
      items: [
        { id: "inventory", label: "Inventory", icon: List },
        { id: "warehouses", label: "Warehouses", icon: MapPin },
        { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
      ]
    },
    {
      title: "Finance",
      roles: ["super_admin"],
      items: [
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "finance", label: "Finance", icon: CreditCard },
      ]
    },
    {
      title: "System",
      roles: ["super_admin", "admin", "marketing_admin"],
      items: [
        { id: "activity-logs", label: "Activity Logs", icon: List },
        { id: "alerts", label: "Alerts", icon: Bell },
        { id: "settings", label: "Settings", icon: Settings },
      ].filter(item => {
        // Activity logs only visible to super_admin and admin
        if (item.id === "activity-logs") {
          return activeRole === "super_admin" || activeRole === "admin";
        }
        return true;
      })
    }
  ];

  const filteredSections = navSections.filter(section => section.roles.includes(activeRole));

  const roleDisplayNames = {
    super_admin: "Super Admin",
    admin: "Admin",
    marketing_admin: "Marketing Team",
    warehouse_manager: "Warehouse Mgr",
  };

  return (
    <aside className="w-60 bg-sidebar border-r border-border flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="font-display text-xl text-foreground">DRAPE</span>
          <span className="font-mono text-[9px] text-accent ml-0.5">ADMIN</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredSections.map(section => (
          <div key={section.title}>
            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted-foreground px-2 mb-2">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === `/admin/${item.id}` || (item.id === "dashboard" && pathname === "/admin");
                return (
                  <Link
                    key={item.id}
                    href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-foreground/10 text-foreground border-l-2 border-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 border-l-2 border-transparent"
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-accent/20 flex items-center justify-center shrink-0">
              <span className="font-mono text-[11px] text-accent">
                {roleDisplayNames[activeRole]?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="w-full bg-transparent text-sm font-medium text-foreground truncate">
                {roleDisplayNames[activeRole] || "User"}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">Role</p>
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 mt-2"
        >
          <ArrowRight size={12} className="rotate-180" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
}
