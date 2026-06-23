import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Product Management</h2>
          <p className="text-sm text-muted-foreground">Add new products and manage inventory.</p>
        </div>
        <Button onClick={() => router.push('/admin/products/new')} variant="default" size="sm" className="flex items-center gap-2">
          <Plus size={14} /> Add Product
        </Button>
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
                    <div>£{p.basePrice}</div>
                    {p.localPrice ? <div className="text-[10px] text-muted-foreground">Rs. {p.localPrice}</div> : null}
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
  );
}
