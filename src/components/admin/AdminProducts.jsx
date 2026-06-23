import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Trash2, Edit, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", description: "", basePrice: "", category: "", isActive: true, imageUrl: ""
  });
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", basePrice: "", category: "", isActive: true, imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      basePrice: product.basePrice,
      category: product.category,
      isActive: product.isActive,
      imageUrl: product.media?.[0]?.url || ""
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, imageUrl: data.url });
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || "No description provided",
        basePrice: Number(formData.basePrice) || 0,
        category: formData.category || "Uncategorized",
        isActive: formData.isActive,
        media: formData.imageUrl ? [{ url: formData.imageUrl, type: "image" }] : []
      };

      const url = editingProduct ? `/api/products/${editingProduct._id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const err = await res.json();
        alert("Failed to save product: " + (err.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving product.");
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Product Management</h2>
          <p className="text-sm text-muted-foreground">Add new products and manage inventory.</p>
        </div>
        <Button onClick={openAddModal} variant="default" size="sm" className="flex items-center gap-2">
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
                  <TableCell>{p.category}</TableCell>
                  <TableCell>£{p.basePrice}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${p.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {p.isActive ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(p)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p._id)} className="text-red-500"><Trash2 size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Product Name" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. T-Shirts" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price (£)</Label>
                <Input type="number" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} placeholder="45" />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} />
                  <Label>Active Status</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Product details..." />
            </div>
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="Image URL or upload" />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4 mr-2" />} Upload
                </Button>
              </div>
              {formData.imageUrl && (
                <div className="mt-2 w-24 h-24 bg-muted overflow-hidden border border-border">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
