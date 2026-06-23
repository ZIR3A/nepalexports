import { useState, useEffect } from "react";
import { Zap, Loader2 } from "lucide-react";
import ProductCard from "../ProductCard";

export default function FlashSalePage({ setPage, cart, setCart, wishlist, toggleWishlist }) {
  const [saleProducts, setSaleProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [targetDate, setTargetDate] = useState(null);

  useEffect(() => {
    fetchFlashSaleProducts();
  }, []);

  const fetchFlashSaleProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products?flashSale=true");
      const data = await res.json();
      
      if (data && data.length > 0) {
        setSaleProducts(data);
        
        // Find the earliest expiration date to use as the main countdown
        const expiresAtDates = data.map(p => new Date(p.flashSale.expiresAt).getTime());
        const earliestExpiry = Math.min(...expiresAtDates);
        setTargetDate(earliestExpiry);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        // Automatically refetch or clear products if sale ends
        setSaleProducts([]);
      } else {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="pt-[72px] min-h-screen">
      {/* Hero */}
      <div className="relative py-20 bg-gradient-to-b from-red-950/40 to-background overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap size={16} className="text-red-400" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-red-400 uppercase">Flash Sale</span>
            <Zap size={16} className="text-red-400" />
          </div>
          <h1 className="font-display text-6xl lg:text-8xl font-light mb-6">Up to 40% Off</h1>
          <p className="text-muted-foreground mb-10 text-lg">Limited time. Limited stock. No exceptions.</p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-4">
            {[
              { val: String(timeLeft.h).padStart(2, "0"), label: "HRS" },
              { val: String(timeLeft.m).padStart(2, "0"), label: "MIN" },
              { val: String(timeLeft.s).padStart(2, "0"), label: "SEC" },
            ].map((t, i) => (
              <div key={t.label} className="flex items-center gap-4">
                <div className="bg-card border border-border px-6 py-4 min-w-[80px] text-center">
                  <p className="font-mono text-3xl font-medium text-accent">{t.val}</p>
                  <p className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground mt-1">{t.label}</p>
                </div>
                {i < 2 && <span className="font-mono text-2xl text-muted-foreground">:</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sale products */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
        ) : saleProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No active flash sales right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {saleProducts.map(p => (
              <ProductCard
                key={p._id}
                product={{
                  ...p,
                  id: p._id,
                  price: p.flashSale.price,
                  originalPrice: p.basePrice,
                  image: p.media?.[0]?.url || ""
                }}
                onView={() => setPage("product")}
                onAddToCart={(prod) => setCart([...cart, { ...prod, quantity: 1, selectedColor: prod.variants?.[0]?.color || "N/A", selectedSize: prod.variants?.[0]?.size || "N/A" }])}
                onWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(p._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
