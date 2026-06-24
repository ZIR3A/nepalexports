import { useState, useEffect } from "react";
import { User, Package, Heart, MapPin, CreditCard, Settings, LogOut, Award, Loader2 } from "lucide-react";
import { PRODUCTS } from "../../data/products";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useSession, signOut } from "next-auth/react";

export default function AccountDashboard({ setPage }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchOrders();
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const res = await fetch("/api/users/me");
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setProfileFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phoneNumber: data.user.phoneNumber || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setIsUpdating(true);
      const res = await fetch("/api/users/me", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePreference = (key) => {
    const currentPrefs = profile?.preferences || {};
    updateProfile({ preferences: { ...currentPrefs, [key]: !currentPrefs[key] } });
  };

  const handleAddMockCard = () => {
    const currentCards = profile?.paymentMethods || [];
    const mockCard = {
      type: Math.random() > 0.5 ? 'Visa' : 'Mastercard',
      last4: Math.floor(1000 + Math.random() * 9000).toString(),
      expiry: `${Math.floor(1 + Math.random() * 11).toString().padStart(2, '0')}/${Math.floor(25 + Math.random() * 5)}`
    };
    updateProfile({ paymentMethods: [...currentCards, mockCard] });
  };

  const handleRemoveCard = (cardId) => {
    const currentCards = profile?.paymentMethods || [];
    updateProfile({ paymentMethods: currentCards.filter(c => c._id !== cardId) });
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await fetch("/api/orders/me");
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
                <div className="w-12 h-12 bg-accent/20 border border-accent/30 flex items-center justify-center overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-lg text-accent">
                      {profile?.firstName?.charAt(0) || session?.user?.name?.charAt(0) || "A"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{profile?.firstName} {profile?.lastName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{session?.user?.email}</p>
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
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === "overview" && (
              <div>
                <h2 className="font-display text-3xl font-light mb-6">Welcome back, {profile?.firstName || session?.user?.name?.split(' ')[0]}</h2>
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
                      {[
                        ["First Name", "firstName"], 
                        ["Last Name", "lastName"], 
                        ["Phone", "phoneNumber"]
                      ].map(([label, key]) => (
                        <div key={label}>
                          <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground block mb-2">{label}</label>
                          <input 
                            value={profileFormData[key]}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-muted border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50" 
                          />
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => updateProfile(profileFormData)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="animate-spin" size={14} /> : "Save Changes"}
                    </Button>
                  </div>
                  <div className="border border-border p-6">
                    <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-4">Preferences</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Order updates", key: "orderUpdates" }, 
                        { label: "New arrivals", key: "newArrivals" }, 
                        { label: "Flash sales", key: "flashSales" }, 
                        { label: "Back in stock", key: "backInStock" }
                      ].map(pref => (
                        <label key={pref.key} className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm text-foreground">{pref.label}</span>
                          <div 
                            className={`w-10 h-5 relative cursor-pointer transition-colors ${profile?.preferences?.[pref.key] ? "bg-accent" : "bg-muted"}`}
                            onClick={() => handleTogglePreference(pref.key)}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 transition-all ${profile?.preferences?.[pref.key] ? "right-0.5 bg-accent-foreground" : "left-0.5 bg-muted-foreground"}`} />
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
                  {activeSection === "wishlist" && profile?.wishlist?.length > 0 ? profile.wishlist.map(p => (
                    <div key={p._id} className="flex gap-4 border border-border p-4">
                      <img src={p.media?.[0]?.url || ""} alt={p.name} className="w-20 h-24 object-cover bg-muted" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="font-mono text-sm text-accent mt-1">£{p.basePrice}</p>
                        <Button variant="outline" size="sm" className="mt-3 text-xs">View Product</Button>
                      </div>
                    </div>
                  )) : activeSection === "wishlist" && (
                    <div className="col-span-2 border border-border p-8 text-center text-muted-foreground text-sm">
                      Your wishlist is empty.
                    </div>
                  )}
                  {activeSection === "addresses" && profile?.address ? (
                    <div className="border border-border p-5">
                      <div className="flex justify-between mb-3">
                        <Badge size="tag">Primary</Badge>
                        <button className="text-xs text-accent hover:underline">Edit</button>
                      </div>
                      <p className="font-medium text-sm text-foreground">{profile.firstName} {profile.lastName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile.address.street}, {profile.address.city}, {profile.address.state} {profile.address.postalCode}, {profile.address.country}
                      </p>
                    </div>
                  ) : activeSection === "addresses" ? (
                    <div className="border border-border p-5 text-muted-foreground text-sm flex items-center justify-center">
                      No addresses saved.
                    </div>
                  ) : null}
                  {activeSection === "payment" && profile?.paymentMethods?.map(card => (
                    <div key={card._id} className="border border-border p-5">
                      <div className="flex justify-between mb-3">
                        <Badge size="tag">{card.type}</Badge>
                        <button 
                          onClick={() => handleRemoveCard(card._id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="font-mono text-sm text-foreground">•••• •••• •••• {card.last4}</p>
                      <p className="font-mono text-[11px] text-muted-foreground mt-1">Expires {card.expiry}</p>
                    </div>
                  ))}
                  {activeSection === "payment" && (
                    <div className="col-span-2 flex justify-start mt-2">
                      <Button onClick={handleAddMockCard} variant="outline" size="sm">
                        Add Mock Card
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
