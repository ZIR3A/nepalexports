"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import WarehouseGrid from "./warehouses/WarehouseGrid";
import WarehouseFormModal from "./warehouses/WarehouseFormModal";

// Dynamically import the map to avoid SSR issues
const WarehouseMap = dynamic(() => import("./warehouses/WarehouseMap"), { ssr: false });

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/warehouses");
      const data = await res.json();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateNew = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;
    try {
      await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      fetchWarehouses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouse Management</h1>
          <p className="text-sm text-muted-foreground">Manage global fulfillment centers and regional geofences.</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Warehouse
        </Button>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <h2 className="text-sm font-medium mb-4">Global Network Map</h2>
        <WarehouseMap warehouses={warehouses} />
      </div>

      <div className="pt-4">
        {loading ? (
          <div className="text-center py-10">Loading warehouses...</div>
        ) : (
          <WarehouseGrid warehouses={warehouses} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>

      {isModalOpen && (
        <WarehouseFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingWarehouse}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchWarehouses();
          }}
        />
      )}
    </div>
  );
}
