"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

export default function RelatedProducts({ 
  product, 
  setPage, 
  cart, 
  setCart, 
  wishlist, 
  toggleWishlist 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { warehouseId, currencySymbol, canPurchase, formatPrice } = useAppContext();

  useEffect(() => {
    if (!product || !warehouseId) return;

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          productId: product.id || product._id,
          warehouseId: warehouseId
        });
        
        if (product.category) {
          params.append("categoryId", product.category); // Assuming it might be ID
        }
        if (product.tags && product.tags.length > 0) {
          params.append("tags", product.tags.join(","));
        }

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (res.ok) {
          const rawProducts = await res.json();
          // Map to ProductCard format
          const mapped = rawProducts.map(p => ({
            id: p._id,
            name: p.name,
            price: p.localPrice || p.basePrice,
            image: p.media?.[0]?.url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop",
            hoverImage: p.media?.[1]?.url || p.media?.[0]?.url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop",
            colors: p.variants?.map(v => v.attributes?.color).filter(Boolean) || ["#000000"],
            rating: 5,
            reviews: Math.floor(Math.random() * 50) + 10,
            isUnavailable: false
          }));
          setRecommendations(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [product, warehouseId]);

  if (isLoading || recommendations.length === 0) {
    // Optionally return a skeleton here, but returning null for simplicity if empty
    return null;
  }

  return (
    <div className="mt-24">
      <h2 className="font-display text-3xl font-light mb-8">You May Also Like</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {recommendations.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onView={() => setPage(`product/${p.id}`)}
            onAddToCart={(prod) => setCart([...cart, { ...prod, quantity: 1, selectedColor: prod.colors[0], selectedSize: "M" }])}
            onWishlist={toggleWishlist}
            isWishlisted={wishlist.includes(p.id)}
            currencySymbol={currencySymbol}
            canPurchase={canPurchase}
          />
        ))}
      </div>
    </div>
  );
}
