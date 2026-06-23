import { Heart, ArrowRight } from "lucide-react";
import { PRODUCTS } from "../../data/products";
import ProductCard from "../ProductCard";
import { Button } from "../ui/button";

export default function WishlistPage({ setPage, wishlist, toggleWishlist, cart, setCart }) {
  const wishlisted = PRODUCTS.filter(p => wishlist.includes(p.id));

  if (wishlisted.length === 0) {
    return (
      <div className="pt-[72px] min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <Heart size={64} className="text-border" />
        <h2 className="font-display text-4xl font-light">Your wishlist is empty</h2>
        <p className="text-muted-foreground text-center max-w-sm">Save items you love and come back to them anytime.</p>
        <Button variant="default" size="lg" onClick={() => setPage("shop")}>Browse Products <ArrowRight size={16} /></Button>
      </div>
    );
  }

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-light">Wishlist ({wishlisted.length})</h1>
          <Button variant="default" onClick={() => {
            wishlisted.forEach(p => setCart([...cart, { ...p, quantity: 1, selectedColor: p.colors[0], selectedSize: "M" }]));
            setPage("cart");
          }}>
            Add All to Cart
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {wishlisted.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onView={() => setPage("product")}
              onAddToCart={(prod) => setCart([...cart, { ...prod, quantity: 1, selectedColor: prod.colors[0], selectedSize: "M" }])}
              onWishlist={toggleWishlist}
              isWishlisted={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
