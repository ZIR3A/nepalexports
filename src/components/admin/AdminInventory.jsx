import { useState, useEffect } from "react";
import PhysicalStockTab from "./inventory/PhysicalStockTab";
import DraftsTab from "./inventory/DraftsTab";
import LiveCatalogTab from "./inventory/LiveCatalogTab";
import TransfersTab from "./inventory/TransfersTab";
import ClaimsTab from "./inventory/ClaimsTab";
import { useSession } from "next-auth/react";
import { RoleGuard } from "@/components/providers/RoleGuard";

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState("physical_stock");
  
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const { data: session } = useSession();
  const activeRole = session?.user?.role || "user";

  useEffect(() => {
    if (activeRole === "marketing_admin") {
      setActiveTab("live_catalog");
    } else {
      setActiveTab("physical_stock");
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [whRes, prodRes, logRes] = await Promise.all([
        fetch("/api/warehouses"),
        fetch("/api/products?admin=true"),
        fetch("/api/wms/audit")
      ]);
      const whData = await whRes.json();
      const prodData = await prodRes.json();
      const logData = await logRes.json();

      setWarehouses(whData);
      setProducts(Array.isArray(prodData) ? prodData : []);
      
      // Build flattened inventory for the Physical Stock tab
      const rows = [];
      if (Array.isArray(prodData)) {
        prodData.forEach(p => {
          p.variants?.forEach(v => {
            whData.forEach(wh => {
              const qty = p.inventoryMap?.[v._id]?.byWarehouse?.[wh._id] || 0;
              const reservedQty = p.inventoryMap?.[v._id]?.reservedByWarehouse?.[wh._id] || 0;
              
              // Only push to inventory view if there is a record or it's a primary warehouse,
              // or just push all for simplicity if we want to show 0 stocks.
              rows.push({
                id: `${p._id}-${v._id}-${wh._id}`,
                productId: p._id,
                variantId: v._id,
                sku: v.sku,
                name: p.name,
                warehouse: wh.name,
                warehouseId: wh._id,
                qty: qty,
                reservedQty: reservedQty,
                status: p.status,
              });
            });
          });
        });
      }
      setInventory(rows);
      setAuditLogs(Array.isArray(logData) ? logData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlerts = async () => {
    if (activeRole === "warehouse_manager") return; // Only marketing/super admin care about these alerts in the drafts tab
    try {
      const res = await fetch("/api/admin/alerts?unreadOnly=true");
      const alerts = await res.json();
      if (Array.isArray(alerts)) {
        const draftAlerts = alerts.filter(a => a.type === 'wms_product_received');
        setUnreadAlertsCount(draftAlerts.length);
      }
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAlerts();
    
    // Poll for new alerts every 10 seconds to simulate real-time
    const interval = setInterval(() => {
      fetchAlerts();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeRole]);

  // RBAC permissions
  const canSeePhysicalStock = activeRole === "super_admin" || activeRole === "admin" || activeRole === "warehouse_manager";
  const canSeeDraftsAndLive = activeRole === "super_admin" || activeRole === "admin" || activeRole === "marketing_admin";

  return (
    <RoleGuard allowedRoles={["super_admin", "admin", "warehouse_manager", "marketing_admin"]}>
      <div className="pb-20 max-w-7xl mx-auto">
        <div className="flex border-b border-border mb-8 gap-2">
          {canSeePhysicalStock && (
            <button
              onClick={() => setActiveTab("physical_stock")}
              className={`px-4 py-2 text-sm uppercase tracking-wider font-mono transition-colors ${activeTab === "physical_stock" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              Physical Stock
            </button>
          )}
          {canSeeDraftsAndLive && (
            <button
              onClick={() => {
                setActiveTab("drafts");
                if (unreadAlertsCount > 0) {
                  setUnreadAlertsCount(0);
                  fetch("/api/admin/alerts", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bulkReadType: "wms_product_received" })
                  });
                }
              }}
              className={`px-4 py-2 text-sm uppercase tracking-wider font-mono transition-colors flex items-center gap-2 relative ${activeTab === "drafts" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              Drafts
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
              {products.some(p => p.status === 'wms_draft' || p.status === 'enrichment_pending') && unreadAlertsCount === 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'drafts' ? 'bg-foreground' : 'bg-muted-foreground'}`}></span>
              )}
            </button>
          )}
          {canSeeDraftsAndLive && (
            <button
              onClick={() => setActiveTab("live_catalog")}
              className={`px-4 py-2 text-sm uppercase tracking-wider font-mono transition-colors ${activeTab === "live_catalog" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              Live Catalog
            </button>
          )}
          {canSeePhysicalStock && (
            <button
              onClick={() => setActiveTab("transfers")}
              className={`px-4 py-2 text-sm uppercase tracking-wider font-mono transition-colors ${activeTab === "transfers" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              Transfers (In-Transit)
            </button>
          )}
          {activeRole === "super_admin" && (
            <button
              onClick={() => setActiveTab("claims")}
              className={`px-4 py-2 text-sm uppercase tracking-wider font-mono transition-colors ${activeTab === "claims" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              Freight Claims
            </button>
          )}
        </div>

        <div>
          {activeTab === "physical_stock" && canSeePhysicalStock && (
            <PhysicalStockTab 
              warehouses={warehouses} 
              inventory={inventory} 
              auditLogs={auditLogs} 
              isLoading={isLoading} 
              activeRole={activeRole}
              onRefresh={fetchData} 
            />
          )}

          {activeTab === "drafts" && canSeeDraftsAndLive && (
            <DraftsTab 
              products={products} 
              isLoading={isLoading} 
              onRefresh={fetchData} 
            />
          )}

          {activeTab === "live_catalog" && canSeeDraftsAndLive && (
            <LiveCatalogTab 
              products={products} 
              isLoading={isLoading} 
              onRefresh={fetchData} 
            />
          )}

          {activeTab === "transfers" && canSeePhysicalStock && (
            <TransfersTab 
              warehouses={warehouses}
              products={products}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "claims" && activeRole === "super_admin" && (
            <ClaimsTab />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
