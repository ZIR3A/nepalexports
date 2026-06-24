import { useState } from "react";
import { Loader2, EyeOff, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveCatalogTab({ products, isLoading, onRefresh }) {
  const [isToggling, setIsToggling] = useState({});

  const liveProducts = products.filter(p => p.status === 'published');

  const toggleVisibility = async (id, currentStatus) => {
    setIsToggling(prev => ({ ...prev, [id]: true }));
    try {
      const payload = {
        status: currentStatus === 'published' ? 'enrichment_pending' : 'published',
        isActive: currentStatus !== 'published'
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert("Failed to toggle visibility: " + err.message);
      }
    } catch (err) {
      alert("Error toggling visibility.");
    } finally {
      setIsToggling(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light">Live Catalog</h2>
        <p className="text-sm text-muted-foreground">The master list of products actively visible to customers.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Product</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Category</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Price</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Quick Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : liveProducts.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No active products found in the catalog.</td></tr>
            ) : liveProducts.map((p) => (
              <tr key={p._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                    {p.media?.[0]?.url ? (
                      <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Img</div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{p.name}</span>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{p.mainCategory?.name || p.category || 'Uncategorized'}</td>
                <td className="px-5 py-3">
                  <div className="text-sm font-medium">£{p.basePrice}</div>
                  {p.localPrice && <div className="text-[10px] text-muted-foreground">NPR {p.localPrice}</div>}
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 text-[10px] rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1 w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={() => toggleVisibility(p._id, p.status)}
                    disabled={isToggling[p._id]}
                  >
                    {isToggling[p._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    Hide Product
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
