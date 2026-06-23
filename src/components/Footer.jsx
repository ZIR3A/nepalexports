import { Camera, MessageSquare, Globe, Video, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

export default function Footer({ setPage }) {
  return (
    <footer className="bg-card border-t border-border mt-24">
      {/* Newsletter */}
      <div className="border-b border-border py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-display text-3xl font-light">Stay in the loop</h3>
            <p className="text-muted-foreground text-sm mt-2">New drops, exclusive offers, early access — delivered to you.</p>
          </div>
          <div className="flex w-full lg:w-auto max-w-md">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-muted border border-border px-4 py-3 text-sm outline-none focus:border-accent/50 transition-colors"
            />
            <Button variant="default" className="shrink-0">Subscribe</Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-2 lg:grid-cols-5 gap-12">
        {/* Brand */}
        <div className="col-span-2">
          <div className="flex items-center gap-0 mb-4">
            <span className="font-display text-2xl font-light">DRAPE</span>
            <span className="font-mono text-[10px] text-accent ml-1">®</span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Premium fashion crafted for the modern individual. Designed in London, inspired by Kathmandu.
          </p>
          <div className="flex items-center gap-4 mt-6">
            {[Camera, MessageSquare, MessageCircle, Video].map((Icon, i) => (
              <button key={i} className="text-muted-foreground hover:text-accent transition-colors">
                <Icon size={16} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Globe size={14} className="text-muted-foreground" />
            <span className="font-mono text-[11px] text-muted-foreground">UK · Nepal</span>
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: "Shop", links: [
              { label: "New Arrivals", page: "shop" },
              { label: "All Products", page: "shop" },
              { label: "Flash Sale", page: "flash-sale" },
              { label: "Gift Cards", page: "shop" },
            ]
          },
          {
            title: "Company", links: [
              { label: "About Us", page: "about" },
              { label: "Our Story", page: "about" },
              { label: "Sustainability", page: "about" },
              { label: "Careers", page: "about" },
            ]
          },
          {
            title: "Support", links: [
              { label: "FAQ", page: "home" },
              { label: "Shipping", page: "home" },
              { label: "Returns", page: "home" },
              { label: "Contact Us", page: "home" },
            ]
          }
        ].map(col => (
          <div key={col.title}>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">{col.title}</p>
            <div className="flex flex-col gap-3">
              {col.links.map(l => (
                <button
                  key={l.label}
                  onClick={() => setPage(l.page)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-6 border-t border-border flex flex-col lg:flex-row items-center justify-between gap-4">
        <p className="font-mono text-[10px] text-muted-foreground">
          © 2025 DRAPE. All rights reserved. Company No. 1234567. VAT No. GB123456789
        </p>
        <div className="flex items-center gap-6">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(t => (
            <button key={t} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              {t}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
