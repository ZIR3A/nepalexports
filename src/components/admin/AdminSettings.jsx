"use client";
import { useState, useEffect } from "react";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRegion, setEditingRegion] = useState(null);

  const fetchRegions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/regions?admin=true");
      const data = await res.json();
      if (Array.isArray(data)) setRegions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const isNew = !editingRegion._id;
      const url = isNew ? "/api/regions" : `/api/regions/${editingRegion._id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRegion)
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to save region");
        return;
      }
      
      setEditingRegion(null);
      fetchRegions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this region?")) return;
    try {
      const res = await fetch(`/api/regions/${id}`, { method: "DELETE" });
      if (res.ok) fetchRegions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-light">System Settings</h2>
          <p className="text-sm text-muted-foreground">Manage global storefront settings and regions.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium">Supported Regions</h3>
          <Button size="sm" className="gap-2" onClick={() => setEditingRegion({ countryCode: "", countryName: "", currency: "", taxRate: 0, isActive: true })}>
            <Plus size={14} /> Add Region
          </Button>
        </div>

        {editingRegion ? (
          <form onSubmit={handleSave} className="bg-muted/30 p-6 rounded-md border border-border mb-6">
            <h4 className="font-medium mb-4">{editingRegion._id ? "Edit Region" : "New Region"}</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Country Code (e.g. US, GB)</Label>
                <Input required value={editingRegion.countryCode} onChange={e => setEditingRegion({ ...editingRegion, countryCode: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>Country Name</Label>
                <Input required value={editingRegion.countryName} onChange={e => setEditingRegion({ ...editingRegion, countryName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Currency (e.g. USD, GBP)</Label>
                <Input required value={editingRegion.currency} onChange={e => setEditingRegion({ ...editingRegion, currency: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" required value={editingRegion.taxRate} onChange={e => setEditingRegion({ ...editingRegion, taxRate: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <input type="checkbox" id="isActive" checked={editingRegion.isActive} onChange={e => setEditingRegion({ ...editingRegion, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Active (Visible on Storefront)</Label>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingRegion(null)}>Cancel</Button>
              <Button type="submit">Save Region</Button>
            </div>
          </form>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Country Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Tax Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : regions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No regions found.</TableCell></TableRow>
              ) : (
                regions.map(r => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.countryCode}</TableCell>
                    <TableCell>{r.countryName}</TableCell>
                    <TableCell>{r.currency}</TableCell>
                    <TableCell>{r.taxRate}%</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${r.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditingRegion(r)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r._id)} className="text-red-500"><Trash2 size={14} /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
