import { useState, useEffect } from "react";
import { Search, Loader2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PhysicalStockTab({ warehouses, inventory, auditLogs, isLoading, activeRole, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWarehouseFilter, setActiveWarehouseFilter] = useState("all");
  const [showLogModal, setShowLogModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isFoodItem, setIsFoodItem] = useState(false);

  // New states for inline adjustments
  const [adjustmentCounts, setAdjustmentCounts] = useState({});

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = activeWarehouseFilter === "all" || item.warehouseId === activeWarehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  const handleLogNewItem = async (e) => {
    e.preventDefault();
    setIsLogging(true);
    const fd = new FormData(e.target);
    const payload = {
      sku: fd.get("sku"),
      name: fd.get("name"),
      quantity: Number(fd.get("quantity")),
      weight: fd.get("weight"),
      warehouseId: fd.get("warehouseId"),
      userId: "local_user",
      userRole: activeRole,
      isFoodItem,
      batchNumber: isFoodItem ? fd.get("batchNumber") : undefined,
      expiryDate: isFoodItem ? fd.get("expiryDate") : undefined,
      storageConditions: isFoodItem ? fd.get("storageConditions") : undefined
    };

    try {
      const res = await fetch("/api/wms/internal/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowLogModal(false);
        onRefresh();
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Failed to log new item");
    } finally {
      setIsLogging(false);
    }
  };

  const adjustStock = async (item, delta) => {
    if (delta === 0) return;
    
    const actionType = delta > 0 ? "add_stock" : "remove_stock";
    const amount = Math.abs(delta);

    const payload = {
      sku: item.sku,
      warehouseId: item.warehouseId,
      quantityChange: delta,
      actionType,
      reason: "Manual inline adjustment",
      userId: "local_user",
      userRole: activeRole
    };

    try {
      const res = await fetch("/api/wms/internal/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAdjustmentCounts(prev => ({ ...prev, [item.id]: 0 }));
        onRefresh();
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Failed to adjust stock");
    }
  };

  const handleInlineChange = (itemId, val) => {
    const num = parseInt(val, 10);
    setAdjustmentCounts(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-light">Physical Stock</h2>
          <p className="text-sm text-muted-foreground">Manage physical warehouse inventory (WMS View).</p>
        </div>
        <Button onClick={() => setShowLogModal(true)} className="gap-2 bg-foreground text-background">
          <Plus size={14} /> Log New Physical Item
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search by SKU or Name..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border border-border bg-background/50 rounded-md px-3 h-10 text-sm outline-none min-w-[180px]"
              value={activeWarehouseFilter}
              onChange={(e) => setActiveWarehouseFilter(e.target.value)}
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">SKU</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Product</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Warehouse</th>
              <th className="text-center px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Available</th>
              <th className="text-center px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-amber-500">Reserved</th>
              <th className="text-center px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg mb-2">📦</span>
                    <span className="font-medium text-foreground">No inventory found for this location</span>
                    <span className="text-xs mt-1">Try adjusting your warehouse filter or search term.</span>
                  </div>
                </td>
              </tr>
            ) : filteredInventory.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs font-medium">{item.sku}</td>
                <td className="px-5 py-3 text-sm">{item.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{item.warehouse}</td>
                <td className="px-5 py-3 font-mono text-sm text-center font-bold text-foreground">{item.qty}</td>
                <td className="px-5 py-3 font-mono text-sm text-center text-amber-500">{item.reservedQty || 0}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => adjustStock(item, -1)}>
                      <Minus size={12} />
                    </Button>
                    <Input 
                      className="w-16 h-7 text-center font-mono text-xs" 
                      value={adjustmentCounts[item.id] !== undefined ? adjustmentCounts[item.id] : ''}
                      onChange={(e) => handleInlineChange(item.id, e.target.value)}
                      placeholder="±0"
                    />
                    <Button variant="outline" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={() => adjustStock(item, 1)}>
                      <Plus size={12} />
                    </Button>
                    {adjustmentCounts[item.id] !== undefined && adjustmentCounts[item.id] !== 0 && (
                      <Button variant="default" size="sm" className="h-7 text-xs px-2" onClick={() => adjustStock(item, adjustmentCounts[item.id])}>
                        Apply
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium">Recent Audit Logs</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Date</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">User</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Action</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">SKU</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Change</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Reason</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : auditLogs.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No audit logs found.</td></tr>
            ) : auditLogs.slice(0, 20).map((log) => (
              <tr key={log._id} className="border-b border-border">
                <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-5 py-3 text-sm">{log.userId} <span className="text-[10px] text-muted-foreground block">{log.userRole}</span></td>
                <td className="px-5 py-3 text-sm">
                  {log.action === 'add_stock' && <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">Stock Added</span>}
                  {log.action === 'remove_stock' && <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-xs">Stock Removed</span>}
                  {log.action === 'log_new_item' && <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded text-xs">New Item Logged</span>}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-medium">{log.sku}</td>
                <td className={`px-5 py-3 font-mono text-xs font-bold ${log.quantityChange > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{log.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md p-6 rounded-lg shadow-xl">
            <h3 className="font-display text-xl mb-4">Log New Physical Item</h3>
            <p className="text-sm text-muted-foreground mb-6">This creates a base WMS Draft that the marketing team will enrich later.</p>
            <form onSubmit={handleLogNewItem} className="space-y-4">
              <div className="space-y-2">
                <Label>SKU (Barcode)</Label>
                <Input name="sku" required />
              </div>
              <div className="space-y-2">
                <Label>Base Name</Label>
                <Input name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Quantity</Label>
                  <Input type="number" name="quantity" min="0" required />
                </div>
                <div className="space-y-2">
                  <Label>Weight (e.g. 1.2kg)</Label>
                  <Input name="weight" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Warehouse Location</Label>
                <select name="warehouseId" required className="w-full border border-border bg-background p-2 rounded-md text-sm outline-none">
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input type="checkbox" id="isFoodItem" checked={isFoodItem} onChange={e => setIsFoodItem(e.target.checked)} />
                <Label htmlFor="isFoodItem" className="cursor-pointer">Is this a Packaged Food / Perishable Item?</Label>
              </div>
              {isFoodItem && (
                <div className="p-4 bg-muted/20 border border-border rounded-md space-y-4">
                  <h4 className="font-medium text-sm text-amber-600">Compliance & Logistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batch / Lot Number</Label>
                      <Input name="batchNumber" required={isFoodItem} />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" name="expiryDate" required={isFoodItem} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Storage Conditions</Label>
                      <select name="storageConditions" required={isFoodItem} className="w-full border border-border bg-background p-2 rounded-md text-sm outline-none">
                        <option value="Room Temperature">Room Temperature</option>
                        <option value="Refrigerated">Refrigerated</option>
                        <option value="Frozen">Frozen</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => { setShowLogModal(false); setIsFoodItem(false); }} disabled={isLogging}>Cancel</Button>
                <Button type="submit" disabled={isLogging}>{isLogging ? <Loader2 className="animate-spin" /> : "Log Item"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
