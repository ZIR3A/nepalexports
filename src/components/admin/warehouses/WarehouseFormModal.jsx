"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

// Map must be dynamically loaded because it uses window
const WarehouseMap = dynamic(() => import("./WarehouseMap"), { ssr: false });

export default function WarehouseFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [managerOptions, setManagerOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    fetch("/api/regions?admin=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRegions(data);
      })
      .catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    country: "",
    countryCode: "",
    currency: "NPR",
    status: "Active",
    isDefaultInternational: false,
    capabilities: ["Standard"],
    geofenceRadiusKM: 50,
    coordinates: [27.7172, 85.3240], // Default KTM
    managerId: "" 
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        managerId: initialData.managerId?._id || initialData.managerId || "",
        coordinates: initialData.address?.coordinates?.coordinates || [27.7172, 85.3240]
      });
      if (initialData.managerId) {
        setSearchTerm(initialData.managerId.name || initialData.managerId.email || "");
      }
    }
  }, [initialData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && showDropdown) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
          if(res.ok) {
            const data = await res.json();
            setManagerOptions(data);
          }
        } catch (e) {}
        setIsSearching(false);
      } else if (!searchTerm) {
        setManagerOptions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, showDropdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      address: {
        ...formData.address,
        coordinates: {
          type: "Point",
          coordinates: formData.coordinates
        }
      }
    };
    
    if (!payload.managerId) {
      delete payload.managerId;
    }

    try {
      const url = isEditing ? `/api/warehouses/${initialData._id}` : `/api/warehouses`;
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to save warehouse");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleCapability = (cap) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Warehouse' : 'Create New Warehouse'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Warehouse Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Nepal Central Hub" />
            </div>
            <div className="space-y-2">
              <Label>Location Code</Label>
              <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. KTM-01" />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Region Configuration</Label>
              <Select 
                value={formData.countryCode} 
                onValueChange={v => {
                  const selectedRegion = regions.find(r => r.countryCode === v);
                  if (selectedRegion) {
                    setFormData({
                      ...formData, 
                      countryCode: selectedRegion.countryCode,
                      country: selectedRegion.countryName,
                      currency: selectedRegion.currency
                    });
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select a Region" /></SelectTrigger>
                <SelectContent>
                  {regions.map(r => (
                    <SelectItem key={r.countryCode} value={r.countryCode}>
                      {r.countryName} ({r.currency})
                    </SelectItem>
                  ))}
                  {!regions.find(r => r.countryCode === formData.countryCode) && formData.countryCode && (
                    <SelectItem value={formData.countryCode}>{formData.country} ({formData.countryCode}) - Legacy</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Country and Currency are automatically set by the selected Region.</p>
            </div>
            
            <div className="space-y-2 relative">
              <Label>Manager (Optional)</Label>
              <Input 
                value={searchTerm} 
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (e.target.value === "") setFormData({...formData, managerId: ""});
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name or email" 
              />
              {showDropdown && (searchTerm || isSearching) && (
                <div className="absolute z-50 w-full bg-popover border border-border mt-1 rounded-md shadow-lg top-full max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Searching...</div>
                  ) : managerOptions.length > 0 ? (
                    managerOptions.map(user => (
                      <div 
                        key={user._id} 
                        className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col"
                        onClick={() => {
                          setFormData({...formData, managerId: user._id});
                          setSearchTerm(user.name || user.email);
                          setShowDropdown(false);
                        }}
                      >
                        <span className="text-sm font-medium">{user.name || 'No Name'}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">No users found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Map Location & Geofence</h3>
            <p className="text-xs text-muted-foreground">Click on the map to set the exact physical coordinates of the warehouse.</p>
            <WarehouseMap 
              selectedLocation={formData.coordinates[0] ? [formData.coordinates[1], formData.coordinates[0]] : null} 
              geofenceRadius={formData.geofenceRadiusKM}
              onLocationSelect={(latlng) => setFormData({...formData, coordinates: [latlng[1], latlng[0]]})} // GeoJSON is [lng, lat]
            />
            
            <div className="space-y-3 mt-4">
              <div className="flex justify-between">
                <Label>Serviceable Geofence Radius (KM)</Label>
                <span className="text-sm font-mono">{formData.geofenceRadiusKM} km</span>
              </div>
              <Slider 
                value={[formData.geofenceRadiusKM]} 
                onValueChange={(val) => setFormData({...formData, geofenceRadiusKM: val[0]})} 
                max={2000} 
                step={10} 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Storage Capabilities</h3>
            <div className="flex gap-4">
              {['Standard', 'Refrigerated', 'Frozen'].map(cap => (
                <label key={cap} className="flex items-center gap-2 cursor-pointer border border-border p-3 rounded-md hover:bg-muted">
                  <input type="checkbox" checked={formData.capabilities.includes(cap)} onChange={() => toggleCapability(cap)} />
                  <span className="text-sm">{cap}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label>Default International Fallback</Label>
                <p className="text-xs text-muted-foreground">Check this if this warehouse should handle orders from unassigned global countries. (Only one warehouse can be true).</p>
              </div>
              <Switch checked={formData.isDefaultInternational} onCheckedChange={(c) => setFormData({...formData, isDefaultInternational: c})} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Warehouse'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
