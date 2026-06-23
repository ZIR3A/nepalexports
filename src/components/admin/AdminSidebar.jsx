import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart2, Package, Grid, User, List, MapPin, TrendingUp, CreditCard, Settings, ArrowRight, FolderTree, ArrowRightLeft } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navSections = [
    {
      title: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", icon: BarChart2 },
        { id: "orders", label: "Orders", icon: Package },
        { id: "products", label: "Products", icon: Grid },
        { id: "categories", label: "Categories", icon: FolderTree },
        { id: "customers", label: "Customers", icon: User },
      ]
    },
    {
      title: "Inventory",
      items: [
        { id: "inventory", label: "Inventory", icon: List },
        { id: "warehouses", label: "Warehouses", icon: MapPin },
        { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
      ]
    },
    {
      title: "Finance",
      items: [
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "finance", label: "Finance", icon: CreditCard },
      ]
    },
    {
      title: "System",
      items: [
        { id: "settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-60 bg-sidebar border-r border-border flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="font-display text-xl text-foreground">DRAPE</span>
          <span className="font-mono text-[9px] text-accent ml-0.5">ADMIN</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map(section => (
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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-accent/20 flex items-center justify-center">
            <span className="font-mono text-[11px] text-accent">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Admin User</p>
            <p className="font-mono text-[9px] text-muted-foreground">Super Admin</p>
          </div>
        </div>
        <Link
          href="/"
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <ArrowRight size={12} className="rotate-180" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
}
