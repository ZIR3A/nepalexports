import { useState, useEffect } from "react";
import { Loader2, FileDown, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClaimsTab() {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchClaims = async () => {
    try {
      const res = await fetch("/api/wms/internal/claims");
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/wms/internal/claims`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        await fetchClaims();
      } else {
        alert("Failed to update claim status");
      }
    } catch (err) {
      alert("Error updating claim");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (claims.length === 0) return;
    
    const headers = ["Transfer Ref", "Date", "SKU", "Missing Qty", "Tracking Number", "Status"];
    const csvContent = [
      headers.join(","),
      ...claims.map(c => [
        c.transferReference,
        new Date(c.createdAt).toLocaleDateString(),
        c.product?.sku || 'Unknown',
        c.missingQuantity,
        c.cargoTrackingNumber || 'N/A',
        c.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `freight_claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-2xl font-light">Freight Claims</h2>
          <p className="text-sm text-muted-foreground">Manage and export lost or damaged cargo reconciliation logs.</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={claims.length === 0}>
          <FileDown className="w-4 h-4 mr-2" /> Export Claim Report
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Transfer / Tracking</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Date</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Product</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Missing</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No freight claims found. All shipments received fully.</p>
                </td>
              </tr>
            ) : claims.map((c) => (
              <tr key={c._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-mono text-sm">{c.transferReference}</div>
                  <div className="text-xs text-muted-foreground mt-1">AWB: {c.cargoTrackingNumber || 'N/A'}</div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm font-medium">{c.product?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">SKU: {c.product?.sku || 'Unknown'}</div>
                </td>
                <td className="px-5 py-4 font-mono text-red-500 font-medium">
                  {c.missingQuantity} units
                </td>
                <td className="px-5 py-4">
                  <select 
                    className={`flex h-8 items-center justify-between rounded-md border border-input px-3 py-1 text-xs outline-none ${
                      c.status === 'Resolved' || c.status === 'Reimbursed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                      c.status === 'Claim Filed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                      'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}
                    value={c.status}
                    onChange={e => handleUpdateStatus(c._id, e.target.value)}
                    disabled={updatingId === c._id}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Claim Filed">Claim Filed</option>
                    <option value="Reimbursed">Reimbursed</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
