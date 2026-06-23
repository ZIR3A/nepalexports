import { useState } from "react";
import { Zap } from "lucide-react";
import AdminSidebar from "../admin/AdminSidebar";
import AdminTopBar from "../admin/AdminTopBar";
import AdminDashboardHome from "../admin/AdminDashboardHome";
import AdminInventory from "../admin/AdminInventory";
import AdminAnalytics from "../admin/AdminAnalytics";
import AdminOrders from "../admin/AdminOrders";
import AdminProducts from "../admin/AdminProducts";

export default function AdminDashboard({ setPage }) {
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar activeNav={activeNav} setActiveNav={setActiveNav} setPage={setPage} />

      <main className="flex-1 ml-60 overflow-auto">
        <AdminTopBar activeNav={activeNav} />

        <div className="p-8">
          {activeNav === "dashboard" && <AdminDashboardHome />}
          {activeNav === "inventory" && <AdminInventory />}
          {activeNav === "analytics" && <AdminAnalytics />}
          {activeNav === "orders" && <AdminOrders />}
          {activeNav === "products" && <AdminProducts />}

          {(activeNav === "customers" || activeNav === "warehouses" || activeNav === "finance" || activeNav === "settings") && (
            <div className="bg-card border border-border p-12 flex flex-col items-center justify-center gap-4 min-h-64 text-center">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <Zap size={20} className="text-accent" />
              </div>
              <h3 className="font-display text-2xl font-light capitalize">{activeNav} Module</h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                This module is fully designed in the system. Navigate to Dashboard, Inventory, or Analytics to see the live data.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
