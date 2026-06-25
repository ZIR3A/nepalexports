import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, Star, Loader2, AlertTriangle } from "lucide-react";
import ProductCard from "../ProductCard";
import { Button } from "../ui/button";
import StarRating from "../StarRating";
import { getPriceForRegion } from "@/lib/pricingUtils";

export default function HomePage({ setPage, cart, setCart, wishlist, toggleWishlist, warehouseId, currency, currencySymbol, formatPrice, canPurchase, isThirdCountry, userCountry }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["New Arrivals", "Best Sellers", "On Sale"];
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Build URL with warehouse filter for localized results
        let url = '/api/products';
        const params = new URLSearchParams();
        if (warehouseId) params.set('warehouseId', warehouseId);
        if (params.toString()) url += `?${params.toString()}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        const mappedProducts = data.slice(0, 8).map(p => {
          const colors = [...new Set(p.variants.map(v => v.color).filter(c => c && c !== "N/A"))];
          const pricing = getPriceForRegion(p, userCountry);
          const displayPrice = pricing.salePrice || pricing.basePrice;
          
          return {
            id: p._id,
            name: p.name,
            price: displayPrice,
            localPrice: pricing.salePrice,
            basePrice: pricing.basePrice,
            image: p.media[0]?.url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop",
            hoverImage: p.media[1]?.url || p.media[0]?.url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop",
            colors: colors.length > 0 ? colors : ["#000000"],
            rating: 5,
            reviews: Math.floor(Math.random() * 100),
            category: p.category,
            badge: null,
            isUnavailable: p.isUnavailable || false,
            localStock: p.localStock || 0,
          };
        });
        
        setProducts(mappedProducts);
      } catch (err) {
        console.error("Fetch products failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (warehouseId) {
      fetchProducts();
    }
  }, [warehouseId, currency]);

  const addToCart = (product) => {
    if (!canPurchase || product.isUnavailable) return;
    setCart([...cart, { ...product, quantity: 1, selectedColor: product.colors[0], selectedSize: "M" }]);
  };

  return (
    <div className="pt-[72px]">
      {/* Third-country view-only banner */}
      {isThirdCountry && !canPurchase && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You&apos;re browsing from a region without a local warehouse. Products are shown for reference only — purchasing is currently unavailable.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&h=1200&fit=crop&auto=format"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col justify-end pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-accent" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Summer Drop 2025</span>
            </div>
            <h1 className="font-display text-6xl lg:text-8xl font-light leading-[0.92] text-foreground mb-6">
              Wear the<br />
              <em className="not-italic text-accent">Uncommon</em>
            </h1>
            <p className="text-muted-foreground text-lg font-light max-w-sm mb-10 leading-relaxed">
              Premium fashion from the valleys of Nepal to the streets of London. Crafted for those who refuse to blend in.
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg" variant="default" onClick={() => setPage("shop")}>
                Shop Collection <ArrowRight size={16} />
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setPage("about")}>
                Our Story
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-12 hidden lg:flex items-center gap-2 text-muted-foreground">
          <div className="w-px h-12 bg-border relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 right-0 bg-accent"
              animate={{ height: ["0%", "100%"], top: ["0%", "0%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ writingMode: "vertical-rl" }}>Scroll</span>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-y border-border bg-card">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Products", value: "50+", sub: "Premium pieces" },
            { label: "Countries", value: "2", sub: "UK & Nepal" },
            { label: "Reviews", value: "4.8★", sub: "Average rating" },
            { label: "Shipping", value: "Free", sub: currency === "NPR" ? "Orders over रु5000" : "Orders over £80" },
          ].map(s => (
            <div key={s.label} className="text-center lg:border-r border-border last:border-0">
              <p className="font-mono text-2xl font-medium text-foreground">{s.value}</p>
              <p className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product tabs */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 py-24">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="font-display text-4xl lg:text-5xl font-light">The Collection</h2>
            <p className="text-muted-foreground mt-2">Carefully selected pieces for every occasion</p>
          </div>
          <div className="flex gap-1 border border-border p-1">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2 text-xs font-mono tracking-wide transition-all ${
                  activeTab === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onView={() => setPage(`product/${p.id}`)}
                onAddToCart={addToCart}
                onWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(p.id)}
                currencySymbol={currencySymbol}
                canPurchase={canPurchase && !p.isUnavailable}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No products found.
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg" onClick={() => setPage("shop")}>
            View All Products <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      {/* Editorial banner */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&h=900&fit=crop&auto=format"
          alt="Store"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-xl px-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-px bg-accent" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Flash Sale Live</span>
              <div className="w-12 h-px bg-accent" />
            </div>
            <h2 className="font-display text-5xl lg:text-6xl font-light text-foreground mb-6">
              Up to 40% Off<br />Selected Items
            </h2>
            <Button variant="default" size="lg" onClick={() => setPage("flash-sale")}>
              Shop the Sale <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Brand story teaser */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-accent" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Our Story</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-light leading-tight mb-6">
              Born in Nepal,<br />Refined in London
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              DRAPE was founded on the belief that fashion should transcend borders. Inspired by the rich textile traditions of Nepal and the sharp tailoring culture of London, we create pieces that carry stories.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Every garment is ethically produced, designed to last, and made to be worn everywhere — from mountain trails to city streets.
            </p>
            <Button variant="outline" onClick={() => setPage("about")}>
              Read Our Story <ArrowRight size={16} />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=1000&fit=crop&auto=format"
              alt="Brand story"
              className="w-full aspect-[4/5] object-cover bg-muted"
            />
            <div className="absolute -bottom-6 -left-6 bg-card border border-border p-6 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-accent text-accent" />)}
              </div>
              <p className="text-sm text-foreground font-medium">&quot;The quality is exceptional. Feels premium in every way.&quot;</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-2">— Priya M., London</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-24">
        <h2 className="font-display text-4xl font-light mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "T-Shirts", count: 24, img: "photo-1521572163474-6864f9cf17ab" },
            { name: "Hoodies", count: 12, img: "photo-1556821840-3a63f15732ce" },
            { name: "Premium", count: 8, img: "photo-1558618666-fcd25c85cd64" },
          ].map(cat => (
            <button
              key={cat.name}
              onClick={() => setPage("shop")}
              className="relative aspect-[3/2] overflow-hidden group"
            >
              <img
                src={`https://images.unsplash.com/${cat.img}?w=700&h=500&fit=crop&auto=format`}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-muted"
              />
              <div className="absolute inset-0 bg-background/50 group-hover:bg-background/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <h3 className="font-display text-3xl font-light text-foreground">{cat.name}</h3>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">{cat.count} Products</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-card border-y border-border py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-px bg-accent" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Testimonials</span>
              <div className="w-12 h-px bg-accent" />
            </div>
            <h2 className="font-display text-4xl font-light">What our customers say</h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <StarRating rating={4.8} />
              <span className="font-mono text-sm text-muted-foreground">4.8 / 5.0 from 1,240 reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { name: "Amir K.", location: "London", text: "The fabric quality is outstanding. I've ordered 4 tees now and each one exceeds expectations.", rating: 5 },
              { name: "Sita R.", location: "Kathmandu", text: "Finally a brand that ships reliably to Nepal with great packaging. The oversized fit is perfect.", rating: 5 },
              { name: "James T.", location: "Manchester", text: "Clean minimal designs that hold up wash after wash. Worth every penny for the quality.", rating: 4 },
            ].map(r => (
              <div key={r.name} className="border border-border p-6">
                <StarRating rating={r.rating} />
                <p className="text-sm text-foreground mt-4 leading-relaxed">&quot;{r.text}&quot;</p>
                <div className="flex items-center gap-3 mt-6">
                  <div className="w-8 h-8 bg-muted flex items-center justify-center font-mono text-xs">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{r.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
