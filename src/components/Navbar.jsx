import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { PRODUCTS } from "../data/products";
import { ThemeToggle } from "./ui/ThemeToggle";
import { useAppContext } from "../context/AppContext";
import { LocationIndicator } from "./LocationSelector";
import { useSession } from "next-auth/react";

const fonts = `
  body { font-family: 'DM Sans', sans-serif; }
  .font-display { font-family: 'Fraunces', serif; }
  .font-mono { font-family: 'DM Mono', monospace; }
  * { scrollbar-width: thin; scrollbar-color: #2e2e2e transparent; }
  *::-webkit-scrollbar { width: 4px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 2px; }
`;

export default function Navbar({ page, setPage, cartCount, wishlistCount }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { userCountry, setUserCountry } = useAppContext();
  const { data: session } = useSession();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navLinks = [
    { label: "New In", page: "shop" },
    { label: "Shop All", page: "shop" },
    { label: "Collections", page: "shop" },
    { label: "Flash Sale", page: "flash-sale" },
    { label: "About", page: "about" },
  ];

  return (
    <>
      <style>{fonts}</style>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-accent text-accent-foreground text-center py-2">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase">
            Free shipping on orders over £80 · Ships to Nepal &amp; UK · Use code LAUNCH15 for 15% off
          </p>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => setPage("home")} className="flex items-center gap-0 cursor-pointer">
            <span className="font-display text-2xl font-light tracking-tight text-foreground">DRAPE</span>
            <span className="font-mono text-[10px] text-accent ml-1 mt-1">®</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(l => (
              <button
                key={l.label}
                onClick={() => setPage(l.page)}
                className={`font-mono text-[11px] tracking-[0.12em] uppercase transition-colors hover:text-foreground ${
                  l.page === "flash-sale" ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Search size={18} />
            </button>
            <button onClick={() => setPage("wishlist")} className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-accent text-accent-foreground font-mono text-[9px] flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            {session ? (
              <button onClick={() => setPage("account")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <User size={18} />
              </button>
            ) : (
              <button onClick={() => setPage("auth")} className="font-mono text-[11px] tracking-[0.12em] uppercase transition-colors hover:text-foreground text-muted-foreground mx-2">
                Login
              </button>
            )}
            <button onClick={() => setPage("cart")} className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-foreground text-background font-mono text-[9px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <LocationIndicator />
            <ThemeToggle />
            <button className="lg:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(true)}>
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col"
          >
            <div className="max-w-2xl mx-auto w-full px-6 pt-24">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <Search size={20} className="text-muted-foreground" />
                <input
                  autoFocus
                  placeholder="Search products, collections..."
                  className="flex-1 bg-transparent text-foreground text-xl outline-none placeholder:text-muted-foreground font-light"
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>
              <div className="mt-8">
                <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase mb-4">Trending Searches</p>
                <div className="flex flex-wrap gap-2">
                  {["Oversized Tee", "Black Edition", "New Drop", "Nepal Collection", "Limited Edition"].map(t => (
                    <button
                      key={t}
                      onClick={() => { setSearchOpen(false); setPage("shop"); }}
                      className="border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-8">
                <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase mb-4">Suggested</p>
                <div className="grid grid-cols-3 gap-4">
                  {PRODUCTS.slice(0, 3).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSearchOpen(false); setPage("product"); }}
                      className="flex items-center gap-3 text-left group"
                    >
                      <img src={p.image} alt={p.name} className="w-12 h-14 object-cover bg-muted" />
                      <div>
                        <p className="text-sm text-foreground group-hover:text-accent transition-colors">{p.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">£{p.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[100] w-80 bg-card border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="font-display text-xl">DRAPE</span>
              <button onClick={() => setMenuOpen(false)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-2">
              {navLinks.map(l => (
                <button
                  key={l.label}
                  onClick={() => { setPage(l.page); setMenuOpen(false); }}
                  className="text-left py-3 border-b border-border text-foreground hover:text-accent transition-colors font-medium"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
