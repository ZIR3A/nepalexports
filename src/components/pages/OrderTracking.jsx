import { ChevronRight, CheckCircle, Circle } from "lucide-react";
import { PRODUCTS } from "../../data/products";

export default function OrderTracking({ setPage }) {
  const steps = [
    { label: "Order Placed", time: "15 Jun, 10:32 AM", done: true },
    { label: "Processing", time: "15 Jun, 11:45 AM", done: true },
    { label: "Packed", time: "15 Jun, 3:00 PM", done: true },
    { label: "Shipped", time: "16 Jun, 9:15 AM", done: true },
    { label: "Out for Delivery", time: "17 Jun, Expected", done: false },
    { label: "Delivered", time: "17 Jun, Expected", done: false },
  ];

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="max-w-[900px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground mb-8">
          <button onClick={() => setPage("account")} className="hover:text-foreground">Account</button>
          <ChevronRight size={10} />
          <span className="text-foreground">Track Order</span>
        </div>

        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-light">Order Tracking</h1>
            <p className="text-muted-foreground mt-1">Order <span className="font-mono text-accent">#DRP-28441</span></p>
          </div>
          <div className="bg-card border border-accent/30 px-4 py-2">
            <span className="font-mono text-xs text-accent">In Transit</span>
          </div>
        </div>

        {/* Tracking number */}
        <div className="bg-card border border-border p-5 mb-8 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">Tracking Number</p>
            <p className="font-mono text-lg text-foreground">RM123456789GB</p>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">Carrier</p>
            <p className="text-sm font-medium text-foreground">Royal Mail</p>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">Est. Delivery</p>
            <p className="text-sm font-medium text-foreground">17 June 2025</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border p-8">
          <h3 className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-8">Delivery Timeline</h3>
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={s.label} className="flex gap-6 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 flex items-center justify-center z-10 transition-all ${
                    s.done ? "bg-emerald-700 border border-emerald-700" : "bg-muted border border-border"
                  }`}>
                    {s.done
                      ? <CheckCircle size={16} className="text-white" />
                      : <Circle size={16} className="text-muted-foreground" />
                    }
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px flex-1 my-1 ${s.done ? "bg-emerald-700" : "bg-border"}`} style={{ minHeight: "2.5rem" }} />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <p className={`font-medium text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{s.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="mt-8 border border-border">
          <div className="p-5 border-b border-border">
            <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground">Items in this Order</p>
          </div>
          {PRODUCTS.slice(0, 2).map(p => (
            <div key={p.id} className="flex gap-4 p-5 border-b border-border last:border-0">
              <img src={p.image} alt={p.name} className="w-14 h-16 object-cover bg-muted" />
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">Size: M · Color: Black</p>
                </div>
                <p className="font-mono text-sm text-foreground">£{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
