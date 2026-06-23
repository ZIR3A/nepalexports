import { useState, useEffect } from "react";
import { User, Package, Heart, MapPin, CreditCard, Settings, LogOut, Award, Loader2 } from "lucide-react";
import { PRODUCTS } from "../../data/products";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export default function AccountDashboard({ setPage }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      // In a real app, this uses session. For now, we mock the email query.
      const res = await fetch("/api/orders/me?email=arjun@example.com");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const statusColor = (s) =>
    s === "Delivered" ? "text-emerald-400" :
    s === "Shipped" ? "text-blue-400" :
    s === "Processing" ? "text-accent" : "text-muted-foreground";

  const navItems = [
    { id: "overview", label: "Overview", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border p-6 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="font-display text-lg text-accent">A</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Arjun Sharma</p>
                  <p className="font-mono text-[10px] text-muted-foreground">arjun@example.com</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="accent" size="tag">Gold Member</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">2,450 pts</span>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    activeSection === item.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors">
                <LogOut size={15} />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === "overview" && (
              <div>
                <h2 className="font-display text-3xl font-light mb-6">Welcome back, Arjun</h2>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Total Orders", value: isLoadingOrders ? "-" : orders.length, icon: Package },
                    { label: "Wishlist Items", value: "8", icon: Heart },
                    { label: "Loyalty Points", value: "2,450", icon: Award },
                  ].map(stat => (
                    <div key={stat.label} className="bg-card border border-border p-5">
                      <stat.icon size={18} className="text-accent mb-3" />
                      <p className="font-mono text-2xl font-medium text-foreground">{stat.value}</p>
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground">Recent Orders</h3>
                    <button onClick={() => setActiveSection("orders")} className="text-xs text-accent hover:underline">View all</button>
                  </div>
                  <div className="border border-border">
                    {isLoadingOrders ? (
                      <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">No recent orders.</div>
                    ) : (
                      orders.slice(0, 3).map((order, i) => (
                        <div
                          key={order._id}
                          className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted transition-colors ${i < 2 ? "border-b border-border" : ""}`}
                          onClick={() => setPage("tracking")}
                        >
                          <div>
                            <p className="font-mono text-sm text-foreground">{order.orderNumber}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} items</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-medium ${statusColor(order.status)}`}>{order.status}</p>
                            <p className="font-mono text-sm text-foreground mt-0.5">
                              {order.billing.currency === 'NPR' ? 'रु' : '£'}{order.billing.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "orders" && (
              <div>
                <h2 className="font-display text-3xl font-light mb-6">Order History</h2>
                <div className="border border-border divide-y divide-border">
                  {isLoadingOrders ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
                  ) : orders.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">You haven't placed any orders yet.</div>
                  ) : (
                    orders.map(order => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-5 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setPage("tracking")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted flex items-center justify-center">
                            <Package size={18} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium text-foreground">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium ${statusColor(order.status)}`}>{order.status}</span>
                          <p className="font-mono text-sm text-foreground mt-0.5">
                            {order.billing.currency === 'NPR' ? 'रु' : '£'}{order.billing.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSection === "settings" && (
              <div>
                <h2 className="font-display text-3xl font-light mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div className="border border-border p-6">
                    <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-4">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[["First Name", "Arjun"], ["Last Name", "Sharma"], ["Email", "arjun@example.com"], ["Phone", "+44 7700 900000"]].map(([label, val]) => (
                        <div key={label}>
                          <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground block mb-2">{label}</label>
                          <input defaultValue={val} className="w-full bg-muted border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50" />
                        </div>
                      ))}
                    </div>
                    <Button variant="default" size="sm" className="mt-4">Save Changes</Button>
                  </div>
                  <div className="border border-border p-6">
                    <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-4">Preferences</h3>
                    <div className="space-y-3">
                      {["Order updates", "New arrivals", "Flash sales", "Back in stock"].map(pref => (
                        <label key={pref} className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm text-foreground">{pref}</span>
                          <div className="w-10 h-5 bg-accent relative cursor-pointer">
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-accent-foreground" />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeSection === "wishlist" || activeSection === "addresses" || activeSection === "payment") && (
              <div>
                <h2 className="font-display text-3xl font-light mb-6">
                  {activeSection === "wishlist" ? "My Wishlist" : activeSection === "addresses" ? "Saved Addresses" : "Payment Methods"}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {activeSection === "wishlist" && PRODUCTS.slice(0, 4).map(p => (
                    <div key={p.id} className="flex gap-4 border border-border p-4">
                      <img src={p.image} alt={p.name} className="w-20 h-24 object-cover bg-muted" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="font-mono text-sm text-accent mt-1">£{p.price}</p>
                        <Button variant="outline" size="sm" className="mt-3 text-xs">Add to Cart</Button>
                      </div>
                    </div>
                  ))}
                  {activeSection === "addresses" && [
                    { type: "Home", name: "Arjun Sharma", address: "123 Oxford Street, London, W1D 1AB, UK" },
                    { type: "Work", name: "Arjun Sharma", address: "45 Thamel Road, Kathmandu, 44600, Nepal" },
                  ].map(addr => (
                    <div key={addr.type} className="border border-border p-5">
                      <div className="flex justify-between mb-3">
                        <Badge size="tag">{addr.type}</Badge>
                        <button className="text-xs text-accent hover:underline">Edit</button>
                      </div>
                      <p className="font-medium text-sm text-foreground">{addr.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                    </div>
                  ))}
                  {activeSection === "payment" && [
                    { type: "Visa", last4: "4242", expiry: "12/26" },
                    { type: "Mastercard", last4: "8888", expiry: "08/27" },
                  ].map(card => (
                    <div key={card.last4} className="border border-border p-5">
                      <div className="flex justify-between mb-3">
                        <Badge size="tag">{card.type}</Badge>
                        <button className="text-xs text-red-400 hover:underline">Remove</button>
                      </div>
                      <p className="font-mono text-sm text-foreground">•••• •••• •••• {card.last4}</p>
                      <p className="font-mono text-[11px] text-muted-foreground mt-1">Expires {card.expiry}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
