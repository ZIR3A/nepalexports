import React, { useState, useEffect } from "react";
import { Loader2, Plane, Package, Ship, CheckCircle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TransfersTab({ warehouses, products, onRefresh }) {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    sourceWarehouse: "",
    destinationWarehouse: "",
    items: [{ productId: "", quantity: 1 }]
  });

  const [savingTransferId, setSavingTransferId] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState({});
  const [receivingTransferId, setReceivingTransferId] = useState(null);
  const [actualQuantities, setActualQuantities] = useState({});

  const fetchTransfers = async () => {
    try {
      const res = await fetch("/api/wms/internal/transfers");
      const data = await res.json();
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/wms/internal/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransfer)
      });
      if (res.ok) {
        setIsCreating(false);
        setNewTransfer({ sourceWarehouse: "", destinationWarehouse: "", items: [{ productId: "", quantity: 1 }] });
        await fetchTransfers();
      } else {
        const err = await res.json();
        alert("Failed to initiate transfer: " + err.error);
      }
    } catch (err) {
      alert("Error initiating transfer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMilestone = async (id, newStatus, trackingNum, actualQts = null) => {
    try {
      setSavingTransferId(id);
      const res = await fetch(`/api/wms/internal/transfers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus, 
          cargoTrackingNumber: trackingNum,
          actualQuantities: actualQts
        })
      });
      if (res.ok) {
        setExpandedId(null);
        await fetchTransfers();
        if (onRefresh) await onRefresh();
      } else {
        const err = await res.json();
        alert("Failed to update transfer: " + err.error);
      }
    } catch (err) {
      alert("Error updating transfer");
    } finally {
      setSavingTransferId(null);
    }
  };

  const milestones = [
    'Dispatched', 
    'At Port / Customs Export', 
    'In Transit', 
    'At Port / Customs Import', 
    'Received'
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-2xl font-light">Cargo & Transfers</h2>
          <p className="text-sm text-muted-foreground">Manage and track international cargo milestones between hubs.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-foreground text-background">
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Initiate Transfer</>}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-muted/30 p-6 rounded-lg border border-border space-y-6">
          <h3 className="font-medium text-lg">Initiate New Transfer</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Source Hub</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newTransfer.sourceWarehouse}
                onChange={e => setNewTransfer({...newTransfer, sourceWarehouse: e.target.value})}
              >
                <option value="">Select Origin...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Destination Hub</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newTransfer.destinationWarehouse}
                onChange={e => setNewTransfer({...newTransfer, destinationWarehouse: e.target.value})}
              >
                <option value="">Select Destination...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label>Cargo Items</Label>
            {newTransfer.items.map((item, i) => (
              <div key={i} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={item.productId}
                    onChange={e => {
                      const newItems = [...newTransfer.items];
                      newItems[i].productId = e.target.value;
                      setNewTransfer({...newTransfer, items: newItems});
                    }}
                  >
                    <option value="">Select Product...</option>
                    {products.filter(p => {
                      if (!newTransfer.sourceWarehouse) return true;
                      const vId = p.variants?.[0]?._id;
                      const qty = p.inventoryMap?.[vId]?.byWarehouse?.[newTransfer.sourceWarehouse] || 0;
                      return qty > 0;
                    }).map(p => {
                      let availableStr = "";
                      if (newTransfer.sourceWarehouse) {
                         const vId = p.variants?.[0]?._id;
                         const qty = p.inventoryMap?.[vId]?.byWarehouse?.[newTransfer.sourceWarehouse] || 0;
                         availableStr = ` - Available: ${qty}`;
                      }
                      return <option key={p._id} value={p._id}>{p.name} ({p.sku || 'No SKU'}){availableStr}</option>
                    })}
                  </select>
                  {item.productId && newTransfer.sourceWarehouse && (() => {
                    const selectedP = products.find(p => p._id === item.productId);
                    const vId = selectedP?.variants?.[0]?._id;
                    const availQty = selectedP?.inventoryMap?.[vId]?.byWarehouse?.[newTransfer.sourceWarehouse] || 0;
                    return (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available to transfer: <span className="font-medium text-foreground">{availQty}</span>
                      </p>
                    );
                  })()}
                </div>
                <div className="w-32 space-y-2">
                  <Input 
                    type="number" 
                    min={1} 
                    value={item.quantity} 
                    onChange={e => {
                      const newItems = [...newTransfer.items];
                      newItems[i].quantity = Number(e.target.value);
                      setNewTransfer({...newTransfer, items: newItems});
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreate} disabled={!newTransfer.sourceWarehouse || !newTransfer.destinationWarehouse || !newTransfer.items[0].productId || isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plane className="w-4 h-4 mr-2" />}
              Dispatch Cargo
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Ref #</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Route</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Milestone</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Tracking No.</th>
              <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !isCreating ? (
              <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No active transfers.</td></tr>
            ) : transfers.map((t) => (
              <React.Fragment key={t._id}>
                <tr className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === t._id ? null : t._id)}>
                  <td className="px-5 py-3 font-mono text-xs">{t.transferReference}</td>
                  <td className="px-5 py-3 text-sm flex items-center gap-2">
                    <span className="truncate max-w-[100px]">{t.sourceWarehouse?.name || 'Unknown'}</span>
                    <Plane className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate max-w-[100px]">{t.destinationWarehouse?.name || 'Unknown'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 text-[10px] rounded-full ${
                      t.status === 'Received' ? 'bg-emerald-500/10 text-emerald-500' : 
                      t.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono text-xs">
                    {t.cargoTrackingNumber || 'Pending AWB'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {expandedId === t._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </td>
                </tr>
                {expandedId === t._id && (
                  <tr className="border-b border-border bg-muted/10">
                    <td colSpan={5} className="p-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-medium mb-4">Cargo Contents</h4>
                          <div className="space-y-3">
                            {t.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-sm bg-background p-3 rounded border border-border">
                                <span className="font-medium">{item.product?.name || 'Unknown Product'}</span>
                                <span className="font-mono text-muted-foreground">Qty: {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-sm font-medium">Update Milestone</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Current Milestone</Label>
                              <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={t.status}
                                onChange={e => handleUpdateMilestone(t._id, e.target.value, trackingNumberInput[t._id] || t.cargoTrackingNumber)}
                                disabled={savingTransferId === t._id || t.status === 'Received'}
                              >
                                {milestones.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>AWB / Tracking Number</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={trackingNumberInput[t._id] ?? (t.cargoTrackingNumber || "")}
                                  onChange={e => setTrackingNumberInput({...trackingNumberInput, [t._id]: e.target.value})}
                                  placeholder="e.g. 123-45678901"
                                  disabled={savingTransferId === t._id || t.status === 'Received'}
                                />
                                {t.status !== 'Received' && (
                                  <Button variant="outline" onClick={() => handleUpdateMilestone(t._id, t.status, trackingNumberInput[t._id])} disabled={savingTransferId === t._id}>
                                    Save Tracking
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {t.status !== 'Received' && receivingTransferId !== t._id && (
                            <div className="pt-4 border-t border-border flex justify-end">
                              <Button 
                                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
                                onClick={() => {
                                  setReceivingTransferId(t._id);
                                  // Pre-fill expected quantities
                                  const initialQts = {};
                                  t.items.forEach(i => {
                                    initialQts[i.product?._id] = i.quantity;
                                  });
                                  setActualQuantities(initialQts);
                                }}
                                disabled={savingTransferId === t._id}
                              >
                                {savingTransferId === t._id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Receive Cargo at Destination
                              </Button>
                            </div>
                          )}

                          {receivingTransferId === t._id && (
                            <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg space-y-4">
                              <h4 className="font-medium text-emerald-700">Confirm Partial Receipt</h4>
                              <p className="text-xs text-muted-foreground mb-4">Please verify the intact quantities. Any missing items will automatically generate a Freight Claim.</p>
                              
                              <div className="space-y-3">
                                {t.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="font-medium truncate max-w-[200px]">{item.product?.name}</span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs text-muted-foreground">Expected: {item.quantity}</span>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs">Actual:</Label>
                                        <Input 
                                          type="number" 
                                          min={0}
                                          max={item.quantity}
                                          className="w-20 h-8"
                                          value={actualQuantities[item.product?._id] ?? item.quantity}
                                          onChange={e => setActualQuantities({
                                            ...actualQuantities, 
                                            [item.product?._id]: Number(e.target.value)
                                          })}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-end gap-2 pt-4 border-t border-emerald-500/20">
                                <Button variant="outline" size="sm" onClick={() => setReceivingTransferId(null)}>Cancel</Button>
                                <Button 
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                  onClick={() => {
                                    handleUpdateMilestone(t._id, 'Received', t.cargoTrackingNumber, actualQuantities);
                                    setReceivingTransferId(null);
                                  }}
                                  disabled={savingTransferId === t._id}
                                >
                                  {savingTransferId === t._id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Confirm & Log Receipt
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
