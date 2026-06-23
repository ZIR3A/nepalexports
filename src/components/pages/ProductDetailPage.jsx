import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Heart, Minus, Plus, Truck, RotateCcw, Shield, Loader2 } from "lucide-react";
import { PRODUCTS } from "../../data/products";
import ProductCard from "../ProductCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import StarRating from "../StarRating";

export default function ProductDetailPage({ setPage, cart, setCart, wishlist, toggleWishlist }) {
  const params = useParams();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product details");
        const data = await res.json();
        
        // Extract sizes and colors from variants
        const colors = [...new Set(data.variants.map(v => v.color).filter(c => c && c !== "N/A"))];
        const sizes = [...new Set(data.variants.map(v => v.size).filter(s => s && s !== "N/A"))];
        
        const mappedProduct = {
          id: data._id,
          name: data.name,
          description: data.description,
          price: data.basePrice,
          images: data.media.map(m => m.url),
          colors: colors.length > 0 ? colors : ["#000000"],
          sizes: sizes.length > 0 ? sizes : ["Standard"],
          rating: 5,
          reviews: Math.floor(Math.random() * 100),
          category: data.category,
          sku: data.variants[0]?.sku || "N/A"
        };
        
        setProduct(mappedProduct);
        setSelectedColor(mappedProduct.colors[0]);
        setSelectedSize(mappedProduct.sizes[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    setCart([...cart, { ...product, quantity, selectedColor, selectedSize }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="pt-[72px] min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={48} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-[72px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "The product you're looking for doesn't exist."}</p>
          <Button onClick={() => setPage("shop")}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  // Ensure we have images
  const images = product.images?.length > 0 ? product.images : [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop"
  ];

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground mb-8">
          <button onClick={() => setPage("home")} className="hover:text-foreground">Home</button>
          <ChevronRight size={10} />
          <button onClick={() => setPage("shop")} className="hover:text-foreground">Shop</button>
          <ChevronRight size={10} />
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Gallery */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-3 w-20 shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 overflow-hidden border transition-all ${
                    selectedImage === i ? "border-foreground" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover bg-muted" />
                </button>
              ))}
            </div>
            <div className="flex-1 relative overflow-hidden aspect-[3/4] bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:border-foreground/30 transition-all"
              >
                <Heart size={16} className={wishlist.includes(product.id) ? "fill-accent text-accent" : "text-foreground"} />
              </button>
            </div>
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[11px] text-muted-foreground">SKU: {product.sku}</span>
            </div>
            <h1 className="font-display text-4xl font-light mb-3">{product.name}</h1>
            <StarRating rating={product.rating} count={product.reviews} />

            <div className="flex items-center gap-4 mt-4 pb-6 border-b border-border">
              <span className="font-mono text-3xl font-medium text-foreground">रु{product.price}</span>
            </div>

            <div className="mt-6 space-y-6">
              {/* Color */}
              {product.colors.length > 0 && product.colors[0] !== "#000000" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">Color</span>
                    <span className="text-sm text-foreground">
                      {selectedColor}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {product.colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 border transition-all ${
                          selectedColor === c ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "border-border hover:border-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">Size</span>
                  <button className="font-mono text-[11px] text-accent hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`h-10 min-w-[40px] px-3 font-mono text-xs transition-all ${
                        selectedSize === s
                          ? "bg-foreground text-background"
                          : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground block mb-3">Quantity</span>
                <div className="flex items-center border border-border w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-mono text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={addToCart}
                className={`flex-1 py-4 font-medium text-sm tracking-wide transition-all ${
                  added
                    ? "bg-emerald-700 text-white"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {added ? "✓ Added to Cart" : "Add to Cart"}
              </button>
              <Button variant="default" size="lg" onClick={() => { addToCart(); setPage("checkout"); }}>
                Buy Now
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Orders over रु5000" },
                { icon: RotateCcw, label: "30-Day Returns", sub: "Free returns" },
                { icon: Shield, label: "Secure Payment", sub: "SSL encrypted" },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center text-center gap-2">
                  <b.icon size={18} className="text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-wide text-foreground">{b.label}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{b.sub}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-8 border-t border-border">
              <div className="flex border-b border-border">
                {["description", "shipping"].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
                      activeTab === t ? "border-b-2 border-foreground text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="py-6 text-sm text-muted-foreground leading-relaxed">
                {activeTab === "description" && (
                  <p>{product.description}</p>
                )}
                {activeTab === "shipping" && (
                  <div className="space-y-2">
                    <p><strong className="text-foreground">Local (Nepal):</strong> Standard 1-2 days (Free over रु5000)</p>
                    <p><strong className="text-foreground">International:</strong> 7-14 days. Duties may apply.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        <div className="mt-24">
          <h2 className="font-display text-3xl font-light mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {PRODUCTS.slice(1, 5).map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onView={() => { setPage(`product/${p.id}`) }}
                onAddToCart={(prod) => setCart([...cart, { ...prod, quantity: 1, selectedColor: prod.colors[0], selectedSize: "M" }])}
                onWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
