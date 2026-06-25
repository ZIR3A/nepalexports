import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/providers/RoleGuard";
import { RequireRole } from "@/components/providers/RequireRole";

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products?admin=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  const simulateWmsSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync delay
      await new Promise(res => setTimeout(res, 2000));
      alert("WMS Sync Simulated Successfully!");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("WMS Sync Failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_admin']}>
      <div>
        <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Product Management</h2>
          <p className="text-sm text-muted-foreground">Manage products synced from the WMS.</p>
        </div>
        <RequireRole allowedRoles={['super_admin']}>
          <Button onClick={simulateWmsSync} disabled={isSyncing} variant="outline" size="sm" className="flex items-center gap-2 border-accent text-accent hover:bg-accent/10">
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 
            Simulate WMS Sync
          </Button>
        </RequireRole>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-accent" /></TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No products found.</TableCell></TableRow>
            ) : (
              products.map(p => (
                <TableRow key={p._id}>
                  <TableCell className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted overflow-hidden">
                      {p.media?.[0]?.url ? <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 m-2.5 text-muted-foreground" />}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </TableCell>
                  <TableCell>{p.mainCategory?.name || p.category}</TableCell>
                  <TableCell>
                    {p.pricing && p.pricing.length > 0 ? (
                      p.pricing.map((pr, i) => (
                        <div key={i} className="text-sm">
                          {pr.currency} {pr.basePrice}
                          {pr.salePrice ? <span className="text-[10px] text-muted-foreground ml-1">(Sale: {pr.salePrice})</span> : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Not set</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${p.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {p.isActive ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/products/${p._id}`)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p._id)} className="text-red-500"><Trash2 size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>


      </div>
    </RoleGuard>
  );
}
