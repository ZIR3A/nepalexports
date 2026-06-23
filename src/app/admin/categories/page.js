"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, FolderTree, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    productType: "standard",
    parentCategory: "" // "" means it's a main category
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = (parentId = "") => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", productType: "standard", parentCategory: parentId });
    setIsModalOpen(true);
  };

  const openEditModal = (cat, parentId = "") => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      productType: cat.productType || "standard",
      parentCategory: parentId
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        parentCategory: formData.parentCategory || null
      };

      const url = editingCategory ? `/api/categories/${editingCategory._id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        alert("Failed to save: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving category.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        fetchCategories();
      } else {
        alert("Failed to delete: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting category.");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Categories Management</h2>
          <p className="text-sm text-muted-foreground">Manage your product hierarchy and types.</p>
        </div>
        <Button onClick={() => openAddModal()} variant="default" size="sm" className="flex items-center gap-2">
          <Plus size={14} /> Add Main Category
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Product Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No categories found. Create your first main category.
                </TableCell>
              </TableRow>
            ) : (
              categories.map(mainCat => (
                <React.Fragment key={mainCat._id}>
                  {/* Main Category Row */}
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium flex items-center gap-2">
                      <FolderTree size={16} className="text-muted-foreground" /> {mainCat.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{mainCat.slug}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent uppercase tracking-wider font-mono">
                        {mainCat.productType || "standard"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openAddModal(mainCat._id)} title="Add Subcategory">
                        <Plus size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(mainCat)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(mainCat._id)} className="text-red-500">
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Sub Categories */}
                  {mainCat.subCategories?.map(subCat => (
                    <TableRow key={subCat._id}>
                      <TableCell className="pl-10 flex items-center gap-2 text-muted-foreground">
                        <ArrowRight size={14} /> <span className="text-foreground">{subCat.name}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{subCat.slug}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                          {subCat.productType || "standard"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(subCat, mainCat._id)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(subCat._id)} className="text-red-500">
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : (formData.parentCategory ? "Add Subcategory" : "Add Main Category")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Clothing" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g. clothing" />
            </div>
            <div className="space-y-2">
              <Label>Product Type</Label>
              <select className="w-full border p-2 bg-background rounded-md text-sm" value={formData.productType} onChange={e => setFormData({ ...formData, productType: e.target.value })}>
                <option value="standard">Standard</option>
                <option value="clothing">Clothing (Variants)</option>
                <option value="food">Food (Batches)</option>
                <option value="electronics">Electronics</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Determines how products in this category behave (e.g. FIFO tracking for food).</p>
            </div>
            {formData.parentCategory && (
              <div className="space-y-2 mt-2 p-3 bg-muted rounded-md border border-border">
                <p className="text-xs text-muted-foreground">This is a subcategory.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingCategory ? "Save Changes" : "Create Category"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
