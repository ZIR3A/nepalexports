import { useState, useEffect } from "react";
import { Eye, Search, Filter, Loader2 } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    Delivered: "text-emerald-400 bg-emerald-400/10",
    Processing: "text-accent bg-accent/10",
    Shipped: "text-blue-400 bg-blue-400/10",
    Cancelled: "text-red-400 bg-red-400/10",
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">Order Management</h2>
          <p className="text-sm text-muted-foreground">View all customer orders and manage fulfillment.</p>
        </div>
      </div>

      <div className="bg-card border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input type="text" placeholder="Search orders..." className="bg-muted pl-9 pr-4 py-2 text-sm border-none outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <button className="px-4 py-2 bg-muted text-sm flex items-center gap-2 hover:bg-foreground/5"><Filter size={14} /> Filter</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Action"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
              ) : (
                orders.map((order, i) => (
                  <tr key={order._id} className={`hover:bg-muted transition-colors ${i < orders.length - 1 ? "border-b border-border" : ""}`}>
                    <td className="px-5 py-4 font-mono text-sm text-accent">{order.orderNumber}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-foreground">{order.customerDetails.firstName} {order.customerDetails.lastName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerDetails.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground">{order.items.length} items</td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground">{order.billing.currency === 'NPR' ? 'रु' : '£'}{order.billing.total.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`font-mono text-xs px-2 py-1 outline-none cursor-pointer ${statusColors[order.status] || "text-foreground bg-muted"}`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Eye size={13} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
