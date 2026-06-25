import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Heart, Minus, Plus, Truck, RotateCcw, Shield, Loader2 } from "lucide-react";
import RelatedProducts from "../RelatedProducts";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import StarRating from "../StarRating";
import { useAppContext } from "../../context/AppContext";
import { getPriceForRegion } from "@/lib/pricingUtils";

export default function ProductDetailPage({ setPage, cart, setCart, wishlist, toggleWishlist }) {
  const params = useParams();
  const id = params?.id;
  const { userCountry, locationLoading, warehouseId } = useAppContext();

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
        setError(null);
        let url = `/api/products/${id}`;
        if (warehouseId) {
          url += `?warehouseId=${warehouseId}`;
        }
        const res = await fetch(url);
        
        if (!res.ok) {
          let errMsg = "Failed to fetch product details";
          try {
            const errData = await res.json();
            if (errData.message) errMsg = errData.message;
          } catch(e) {}
          throw new Error(errMsg);
        }
        
        const data = await res.json();
        
        // Extract sizes and colors from new variants attributes map
        const colors = [...new Set(data.variants.map(v => v.attributes?.color).filter(c => c && c !== "N/A"))];
        const sizes = [...new Set(data.variants.map(v => v.attributes?.size).filter(s => s && s !== "N/A"))];
        
        const pricing = getPriceForRegion(data, userCountry);
        const displayPrice = pricing.salePrice || pricing.basePrice;

        const mappedProduct = {
          id: data._id,
          name: data.name,
          description: data.description,
          price: displayPrice,
          basePrice: pricing.basePrice,
          salePrice: pricing.salePrice,
          currency: pricing.currency || 'NPR',
          images: data.media.map(m => m.url),
          colors: colors.length > 0 ? colors : ["#000000"],
          sizes: sizes.length > 0 ? sizes : ["Standard"],
          rating: 5,
          reviews: Math.floor(Math.random() * 100),
          category: data.mainCategory?.name || data.category,
          productType: data.mainCategory?.productType || 'standard',
          sku: data.sku || data.variants[0]?.sku || "N/A",
          attributes: data.attributes || {},
          foodCompliance: data.foodCompliance || null,
          logisticsAttributes: data.logisticsAttributes || null,
          inventoryMap: data.inventoryMap || {},
          variantsData: data.variants || [],
          pricing: data.pricing || []
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
  }, [id, warehouseId, userCountry]);

  const addToCart = () => {
    if (!product) return;
    setCart([...cart, { ...product, quantity, selectedColor, selectedSize }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading || locationLoading) {
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

  const hasRegionalPricing = product.pricing && product.pricing.some(pr => pr.country === userCountry && pr.isActive);
  if (!hasRegionalPricing) {
    return (
      <div className="pt-[72px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">Not Available</h2>
          <p className="text-muted-foreground mb-6">This product is not currently available for shipping to your region.</p>
          <Button onClick={() => setPage("shop")}>Continue Shopping</Button>
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

            <div className="flex items-center gap-4 mt-4 pb-4 border-b border-border mb-6">
              {product.salePrice && product.salePrice < product.basePrice ? (
                <>
                  <span className="font-mono text-3xl font-medium text-foreground">
                    {product.currency === 'GBP' ? '£' : product.currency === 'NPR' ? 'रु' : product.currency}
                    {product.salePrice}
                  </span>
                  <span className="font-mono text-xl text-muted-foreground line-through">
                    {product.currency === 'GBP' ? '£' : product.currency === 'NPR' ? 'रु' : product.currency}
                    {product.basePrice}
                  </span>
                  <span className="bg-red-500/10 text-red-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    Sale
                  </span>
                </>
              ) : (
                <span className="font-mono text-3xl font-medium text-foreground">
                  {product.currency === 'GBP' ? '£' : product.currency === 'NPR' ? 'रु' : product.currency}
                  {product.basePrice}
                </span>
              )}
            </div>

            {/* Dietary Tags */}
            {product.productType === 'food' && product.foodCompliance?.dietaryTags && product.foodCompliance.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.foodCompliance.dietaryTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 text-xs rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Smart Availability Logic */}
            <div className="pb-6 border-b border-border">
              {(() => {
                // Find selected variant inventory
                const selectedVariant = product.variantsData?.find(v => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize);
                const invData = selectedVariant && product.inventoryMap[selectedVariant._id] ? product.inventoryMap[selectedVariant._id] : { total: 0, byCountry: { NP: 0, GB: 0, Transit: 0 } };
                
                const localStock = invData.byCountry[userCountry] || 0;
                const totalOtherStock = invData.total - localStock;

                if (localStock > 0) {
                  return (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-sm">
                      <Truck size={14} />
                      <span className="font-mono text-[11px] uppercase tracking-wider">In Stock • Fast Delivery (2-3 Days)</span>
                    </div>
                  );
                } else if (totalOtherStock > 0) {
                  return (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 w-fit px-3 py-1.5 rounded-sm">
                      <Truck size={14} />
                      <span className="font-mono text-[11px] uppercase tracking-wider">Available via Import • Est. 10-14 Days</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 w-fit px-3 py-1.5 rounded-sm">
                      <span className="font-mono text-[11px] uppercase tracking-wider">Out of Stock</span>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="mt-6 space-y-6">
              {product.productType === 'food' ? (
                <>
                  {/* Flavor / Variant */}
                  {product.colors.length > 0 && product.colors[0] !== "#000000" && product.colors[0] !== "N/A" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">Flavor / Variant</span>
                        <span className="text-sm text-foreground">{selectedColor}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map(c => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`h-10 px-4 font-mono text-xs transition-all ${
                              selectedColor === c
                                ? "bg-foreground text-background"
                                : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weight / Volume */}
                  {product.sizes.length > 0 && product.sizes[0] !== "One Size" && product.sizes[0] !== "N/A" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">Weight / Volume / Pack</span>
                        <span className="text-sm text-foreground">{selectedSize}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map(s => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`h-10 px-4 font-mono text-xs transition-all ${
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
                  )}
                </>
              ) : (
                <>
                  {/* Color */}
                  {product.colors.length > 0 && product.colors[0] !== "#000000" && product.colors[0] !== "N/A" && (
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
                </>
              )}

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

            {/* Allergens Warning */}
            {((product.foodCompliance?.allergenWarnings && product.foodCompliance.allergenWarnings.length > 0) || (product.attributes?.allergens && product.attributes.allergens.length > 0)) && (
              <div className="mt-6 p-4 border border-red-500/30 bg-red-500/5 rounded-md flex items-start gap-3">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <div>
                  <h4 className="text-sm font-medium text-red-500 mb-1">Allergen Warning</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(product.foodCompliance?.allergenWarnings || product.attributes?.allergens || []).map(a => (
                      <span key={a} className="px-2 py-1 bg-red-500/10 text-red-600 text-xs font-medium rounded-sm border border-red-500/20">
                        Contains {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              {(() => {
                const selectedVariant = product.variantsData?.find(v => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize);
                const invData = selectedVariant && product.inventoryMap[selectedVariant._id] ? product.inventoryMap[selectedVariant._id] : { total: 0 };
                const outOfStock = invData.total === 0;

                if (outOfStock) {
                  return (
                    <Button variant="outline" className="flex-1 py-6 border-foreground/30 text-foreground" onClick={() => alert("We'll notify you when it's back!")}>
                      Notify Me
                    </Button>
                  );
                }

                return (
                  <>
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
                  </>
                );
              })()}
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
                {product.productType === 'food' 
                  ? ["description", "ingredients", "nutrition", "storage"].map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
                          activeTab === t ? "border-b-2 border-foreground text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "storage" ? "Storage & Details" : t === "nutrition" ? "Nutritional Facts" : t}
                      </button>
                    ))
                  : ["description", "materials", "size_guide"].map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
                          activeTab === t ? "border-b-2 border-foreground text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "materials" ? "Materials & Care" : t === "size_guide" ? "Size Guide" : t}
                      </button>
                    ))
                }
              </div>
              <div className="py-6 text-sm text-muted-foreground leading-relaxed">
                {activeTab === "description" && (
                  <p>{product.description}</p>
                )}

                {/* Apparel Tabs */}
                {activeTab === "materials" && (
                  <div className="space-y-4">
                    <p><strong>Material:</strong> {product.attributes?.material || "Standard Fabric"}</p>
                    <p><strong>Care Instructions:</strong> {product.attributes?.careInstructions || "Machine wash cold. Tumble dry low."}</p>
                  </div>
                )}
                {activeTab === "size_guide" && (
                  <div className="space-y-4">
                    <p>Size guide information specific to apparel will be rendered here.</p>
                  </div>
                )}

                {/* Food Tabs */}
                {activeTab === "ingredients" && product.foodCompliance && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2 font-mono uppercase text-xs tracking-wider">Ingredients</h4>
                    <p className="text-foreground leading-relaxed">{product.foodCompliance.ingredientsList || "No ingredients listed."}</p>
                  </div>
                )}
                {activeTab === "nutrition" && product.foodCompliance?.nutritionalFacts && (
                  <div>
                    <h4 className="font-medium text-foreground mb-3 font-mono uppercase text-xs tracking-wider">Nutritional Facts</h4>
                    <div className="border border-border rounded-sm overflow-hidden text-sm">
                      {Object.entries(product.foodCompliance.nutritionalFacts).map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-border last:border-0 p-3 bg-muted/10">
                          <span className="font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-foreground text-right">{val}</span>
                        </div>
                      ))}
                      {Object.keys(product.foodCompliance.nutritionalFacts).length === 0 && (
                        <div className="p-3 bg-muted/10">No nutritional facts available.</div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "storage" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {product.logisticsAttributes?.storageConditions && (
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">Storage Conditions</span>
                          <span className="text-foreground mt-1">{product.logisticsAttributes.storageConditions}</span>
                        </div>
                      )}
                      {product.logisticsAttributes?.shelfLife && (
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">Shelf Life</span>
                          <span className="text-foreground mt-1">{product.logisticsAttributes.shelfLife}</span>
                        </div>
                      )}
                      {(!product.logisticsAttributes || Object.keys(product.logisticsAttributes).length === 0) && (
                        <p>No specific storage details provided.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts 
          product={product} 
          setPage={setPage} 
          cart={cart} 
          setCart={setCart} 
          wishlist={wishlist} 
          toggleWishlist={toggleWishlist} 
        />
      </div>
    </div>
  );
}
