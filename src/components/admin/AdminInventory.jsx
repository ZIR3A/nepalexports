import { MapPin, AlertCircle, Filter, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mocking some food/logistics batches
const MOCK_BATCHES = [
  { id: 1, name: "Organic Green Tea", sku: "F-GT-01", category: "Beverages", batchNo: "B-2023-11", mfg: "2023-11-01", exp: "2024-11-01", qty: 450, warehouse: "UK Warehouse" },
  { id: 2, name: "Organic Green Tea", sku: "F-GT-01", category: "Beverages", batchNo: "B-2024-02", mfg: "2024-02-15", exp: "2025-02-15", qty: 1200, warehouse: "UK Warehouse" },
  { id: 3, name: "Himalayan Honey", sku: "F-HH-02", category: "Pantry", batchNo: "B-2023-08", mfg: "2023-08-10", exp: "2024-08-10", qty: 85, warehouse: "Nepal Warehouse" },
  { id: 4, name: "Roasted Almonds", sku: "F-RA-05", category: "Snacks", batchNo: "B-2024-05", mfg: "2024-05-01", exp: "2024-07-01", qty: 320, warehouse: "UK Warehouse" },
  { id: 5, name: "Spiced Chai Mix", sku: "F-SC-08", category: "Beverages", batchNo: "B-2024-01", mfg: "2024-01-20", exp: "2024-12-20", qty: 600, warehouse: "Nepal Warehouse" },
];

export default function AdminInventory() {
  const isExpiringSoon = (expDate) => {
    const daysLeft = (new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 60;
  };

  const isExpired = (expDate) => {
    return new Date(expDate) < new Date();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Inventory & Logistics</h2>
          <p className="text-sm text-muted-foreground">Manage batches, FIFO routing, and expiry dates.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { name: "Nepal Warehouse", location: "Kathmandu", batches: 124, value: "NPR 4,20,000", alert: 5 },
          { name: "UK Warehouse", location: "London", batches: 312, value: "£24,400", alert: 12 },
        ].map(wh => (
          <div key={wh.name} className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-accent" />
                <div>
                  <p className="font-medium text-foreground">{wh.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{wh.location}</p>
                </div>
              </div>
              {wh.alert > 0 && (
                <span className="flex items-center gap-1 text-orange-400 font-mono text-[10px] bg-orange-400/10 px-2 py-1">
                  <Clock size={12} /> {wh.alert} batches expiring
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-border pt-4">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">Active Batches</p>
                <p className="font-mono text-xl text-foreground mt-1">{wh.batches}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">Stock Value</p>
                <p className="font-mono text-xl text-foreground mt-1">{wh.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-foreground">Batch Tracking Table</h3>
          <div className="flex gap-3">
            <Button variant="outline" size="sm"><Filter size={12} /> Filter</Button>
            <Button variant="default" size="sm"><Download size={12} /> Export</Button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Product", "Batch No", "Warehouse", "Mfg Date", "Expiry Date", "Qty", "Status"].map(h => (
                <th key={h} className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_BATCHES.map((b, i) => {
              const expiring = isExpiringSoon(b.exp);
              const expired = isExpired(b.exp);
              
              return (
                <tr key={b.id} className={`hover:bg-muted transition-colors ${i < MOCK_BATCHES.length - 1 ? "border-b border-border" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{b.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{b.sku}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{b.batchNo}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{b.warehouse}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{b.mfg}</td>
                  <td className={`px-5 py-3 font-mono text-xs ${expired ? "text-red-400" : expiring ? "text-orange-400" : "text-foreground"}`}>{b.exp}</td>
                  <td className="px-5 py-3 font-mono text-sm text-foreground">{b.qty}</td>
                  <td className="px-5 py-3">
                    {expired ? (
                      <span className="font-mono text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Expired</span>
                    ) : expiring ? (
                      <span className="font-mono text-[10px] text-orange-400 flex items-center gap-1"><Clock size={10} /> Expiring Soon</span>
                    ) : (
                      <span className="font-mono text-[10px] text-emerald-400">Good</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
