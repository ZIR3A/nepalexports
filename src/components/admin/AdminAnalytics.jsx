import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SALES_DATA } from "@/data/products";

export default function AdminAnalytics() {
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Conversion Rate", value: "3.8%", change: "+0.4%" },
          { label: "Avg Order Value", value: "£86", change: "+£8" },
          { label: "Cart Abandonment", value: "62%", change: "-3%" },
          { label: "Repeat Purchase", value: "28%", change: "+5%" },
        ].map(m => (
          <div key={m.label} className="bg-card border border-border p-5">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-3">{m.label}</p>
            <p className="font-mono text-2xl font-medium text-foreground">{m.value}</p>
            <p className="font-mono text-[11px] text-emerald-400 mt-1">{m.change}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border p-6">
        <h3 className="font-medium text-foreground mb-6">Monthly Orders &amp; Revenue</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={SALES_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,237,232,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#7a7570", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid rgba(240,237,232,0.08)", borderRadius: 0 }}
              labelStyle={{ color: "#f0ede8", fontFamily: "DM Mono", fontSize: 11 }}
            />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#7a9e7e" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
