import { TrendingUp, Package, User, RotateCcw, Eye, Download } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SALES_DATA } from "@/data/products";

export default function AdminDashboardHome() {
  const metrics = [
    { label: "Total Revenue", value: "£61,400", change: "+18.2%", positive: true, icon: TrendingUp },
    { label: "Total Orders", value: "318", change: "+12.4%", positive: true, icon: Package },
    { label: "Active Customers", value: "1,842", change: "+8.7%", positive: true, icon: User },
    { label: "Return Rate", value: "3.2%", change: "-0.8%", positive: true, icon: RotateCcw },
  ];

  const recentOrders = [
    { id: "#DRP-28441", customer: "Arjun Sharma", country: "UK", amount: 110, status: "Delivered", date: "15 Jun" },
    { id: "#DRP-28440", customer: "Sita Rana", country: "NP", amount: 68, status: "Processing", date: "15 Jun" },
    { id: "#DRP-28439", customer: "James Taylor", country: "UK", amount: 142, status: "Shipped", date: "14 Jun" },
    { id: "#DRP-28438", customer: "Maya Patel", country: "UK", amount: 45, status: "Delivered", date: "14 Jun" },
    { id: "#DRP-28437", customer: "Raj Kumar", country: "NP", amount: 88, status: "Cancelled", date: "13 Jun" },
  ];

  const statusColors = {
    Delivered: "text-emerald-400",
    Processing: "text-accent",
    Shipped: "text-blue-400",
    Cancelled: "text-red-400",
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{m.label}</span>
              <m.icon size={16} className="text-accent" />
            </div>
            <p className="font-mono text-2xl font-medium text-foreground">{m.value}</p>
            <span className={`font-mono text-[11px] mt-1 ${m.positive ? "text-emerald-400" : "text-red-400"}`}>
              {m.change} vs last month
            </span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-foreground">Revenue Overview</h3>
            <div className="flex gap-2">
              {["7D", "1M", "3M", "1Y"].map((t, i) => (
                <button key={t} className={`font-mono text-[10px] px-3 py-1 transition-colors ${i === 2 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SALES_DATA}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,237,232,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(240,237,232,0.08)", borderRadius: 0 }}
                labelStyle={{ color: "#f0ede8", fontFamily: "DM Mono", fontSize: 11 }}
                itemStyle={{ color: "#c9a84c", fontFamily: "DM Mono", fontSize: 11 }}
                formatter={(v) => [`£${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} fill="url(#revenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border p-6">
          <h3 className="font-medium text-foreground mb-6">Orders by Country</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { country: "UK", orders: 218 },
              { country: "NP", orders: 87 },
              { country: "US", orders: 8 },
              { country: "EU", orders: 5 },
            ]} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(240,237,232,0.08)", borderRadius: 0 }}
                labelStyle={{ color: "#f0ede8", fontFamily: "DM Mono", fontSize: 11 }}
                itemStyle={{ color: "#c9a84c", fontFamily: "DM Mono", fontSize: 11 }}
              />
              <Bar dataKey="orders" fill="#c9a84c" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-foreground">Recent Orders</h3>
          <button className="text-xs text-accent hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Order", "Customer", "Country", "Amount", "Status", "Date", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order.id} className={`hover:bg-muted transition-colors ${i < recentOrders.length - 1 ? "border-b border-border" : ""}`}>
                  <td className="px-5 py-4 font-mono text-sm text-accent">{order.id}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{order.customer}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] bg-muted px-2 py-1 text-muted-foreground">{order.country}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-foreground">£{order.amount}</td>
                  <td className="px-5 py-4">
                    <span className={`font-mono text-xs ${statusColors[order.status]}`}>{order.status}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{order.date}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Eye size={13} /></button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Download size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
