"use client";
import { useState, useEffect } from "react";
import { Plus, ArrowRightLeft, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transfers");
      const data = await res.json();
      setTransfers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const openEditModal = (t) => {
    setEditingTransfer(t);
    setNewStatus(t.status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      const res = await fetch(`/api/transfers/${editingTransfer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchTransfers();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Error updating");
    }
  };

  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Packed': 'bg-blue-100 text-blue-800',
    'Dispatched': 'bg-purple-100 text-purple-800',
    'In Transit': 'bg-yellow-100 text-yellow-800',
    'Customs Clearance': 'bg-orange-100 text-orange-800',
    'Arrived': 'bg-teal-100 text-teal-800',
    'Received': 'bg-green-100 text-green-800',
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Inventory Transfers</h2>
          <p className="text-sm text-muted-foreground">Manage stock movement between warehouses.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No transfers found.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map(t => (
                <TableRow key={t._id}>
                  <TableCell className="font-mono text-xs">{t.transferReference}</TableCell>
                  <TableCell className="flex items-center gap-2 text-sm">
                    {t.sourceWarehouse?.name} <ArrowRightLeft size={12} className="text-muted-foreground" /> {t.destinationWarehouse?.name}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider ${statusColors[t.status] || 'bg-gray-100'}`}>
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(t)}>
                      <Edit size={14} /> Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Transfer Status</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Updating the status to "Dispatched" will deduct inventory from the source. Updating to "Received" will add it to the destination.</p>
            <select className="w-full border p-2 rounded-md" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
