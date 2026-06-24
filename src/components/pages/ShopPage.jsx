import { useState, useEffect } from "react";
import { ChevronRight, Grid, List, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import ProductCard from "../ProductCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import StarRating from "../StarRating";

export default function ShopPage({ setPage, cart, setCart, wishlist, toggleWishlist, warehouseId, currency, currencySymbol, formatPrice, canPurchase, isThirdCountry }) {
  const [viewMode, setViewMode] = useState("grid");
  const [sort, setSort] = useState("featured");
  const [priceRange, setPriceRange] = useState([0, currency === "NPR" ? 50000 : 200]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset price range when currency changes
  useEffect(() => {
    setPriceRange([0, currency === "NPR" ? 50000 : 200]);
  }, [currency]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Build URL with warehouse filter
        let url = '/api/products';
        const params = new URLSearchParams();
        if (warehouseId) params.set('warehouseId', warehouseId);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        // Map backend schema to frontend format expected by ProductCard
        const mappedProducts = data.map(p => {
          const colors = [...new Set(p.variants.map(v => v.color).filter(c => c && c !== "N/A"))];
          const displayPrice = currency === 'NPR' ? (p.localPrice || p.basePrice) : p.basePrice;
          return {
            id: p._id,
            name: p.name,
            price: displayPrice,
            localPrice: p.localPrice,
            basePrice: p.basePrice,
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
        setError(err.message);
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

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colorOptions = [
    { label: "Black", value: "#1a1a1a" },
    { label: "White", value: "#f0ede8" },
    { label: "Gold", value: "#c9a84c" },
    { label: "Green", value: "#2d3a2e" },
  ];

  const maxPrice = currency === "NPR" ? 50000 : 200;

  return (
    <div className="pt-[72px] min-h-screen">
      {/* Third-country banner */}
      {isThirdCountry && !canPurchase && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Browsing mode — purchasing is unavailable in your region.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground mb-4">
            <button onClick={() => setPage("home")} className="hover:text-foreground transition-colors">Home</button>
            <ChevronRight size={10} />
            <span className="text-foreground">Shop All</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-4xl font-light">All Products</h1>
              <p className="text-muted-foreground text-sm mt-1">{products.length} products</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="bg-muted border border-border px-4 py-2 text-sm text-foreground outline-none focus:border-accent/50"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="rating">Best Rated</option>
              </select>
              <div className="flex border border-border">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 flex gap-8">
        {/* Sidebar filters */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Price Range ({currency})</p>
              <div className="space-y-3">
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([0, Number(e.target.value)])}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between font-mono text-xs text-muted-foreground">
                  <span>{currencySymbol}0</span>
                  <span>{currencySymbol}{currency === "NPR" ? priceRange[1].toLocaleString() : priceRange[1]}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSizes(prev =>
                      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                    )}
                    className={`w-10 h-10 font-mono text-xs transition-all ${
                      selectedSizes.includes(s)
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Color</p>
              <div className="space-y-2">
                {colorOptions.map(c => (
                  <label key={c.label} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(c.value)}
                      onChange={() => setSelectedColors(prev =>
                        prev.includes(c.value) ? prev.filter(x => x !== c.value) : [...prev, c.value]
                      )}
                      className="hidden"
                    />
                    <div
                      style={{ backgroundColor: c.value }}
                      className={`w-5 h-5 border transition-all ${
                        selectedColors.includes(c.value) ? "ring-1 ring-accent ring-offset-1 ring-offset-background" : "border-border"
                      }`}
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => { setSelectedSizes([]); setSelectedColors([]); setPriceRange([0, maxPrice]); }}>
              <RefreshCw size={13} /> Clear Filters
            </Button>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={24} />
              Loading products...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className={`grid gap-4 lg:gap-6 ${
              viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            }`}>
              {products.map(p =>
                viewMode === "grid" ? (
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
                ) : (
                  <div key={p.id} className={`flex gap-6 border border-border p-4 group ${p.isUnavailable ? "opacity-60" : ""}`}>
                    <img src={p.image} alt={p.name} className={`w-32 h-40 object-cover bg-muted shrink-0 ${p.isUnavailable ? "grayscale" : ""}`} />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {p.badge && <Badge variant={p.badge === "SALE" ? "sale" : p.badge === "NEW" ? "new" : "limited"} size="tag">{p.badge}</Badge>}
                        {p.isUnavailable && (
                          <Badge variant="outline" size="tag" className="text-muted-foreground border-muted-foreground/30">Out of Stock</Badge>
                        )}
                        <h3
                          className="text-lg font-medium text-foreground mt-2 cursor-pointer hover:text-accent transition-colors"
                          onClick={() => setPage(`product/${p.id}`)}
                        >
                          {p.name}
                        </h3>
                        <StarRating rating={p.rating} count={p.reviews} />
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono text-lg font-medium text-foreground">
                            {currencySymbol}{currency === "NPR" ? Math.round(p.price).toLocaleString() : Number(p.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        {canPurchase && !p.isUnavailable && (
                          <Button variant="default" size="sm" onClick={() => addToCart(p)}>Add to Cart</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setPage(`product/${p.id}`)}>View Details</Button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
