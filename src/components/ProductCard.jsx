import { useState } from "react";
import { motion } from "motion/react";
import { Heart, Eye } from "lucide-react";
import { Badge } from "./ui/badge";
import StarRating from "./StarRating";

export default function ProductCard({ product, onView, onAddToCart, onWishlist, isWishlisted }) {
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-muted aspect-[3/4] cursor-pointer" onClick={onView}>
        <img
          src={hovered ? product.hoverImage : product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-700"
        />
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge
              variant={
                product.badge === "SALE" ? "sale" :
                product.badge === "NEW" ? "new" :
                product.badge === "LIMITED" ? "limited" : "default"
              }
             size="tag">
              {product.badge}
            </Badge>
          </div>
        )}
        {/* Hover actions */}
        <div
          className={`absolute inset-0 bg-background/20 flex items-end justify-center pb-4 gap-2 transition-all duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="bg-foreground text-background text-xs font-medium px-5 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Quick Add
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="bg-background/80 backdrop-blur-sm p-2.5 border border-border hover:border-foreground/30"
          >
            <Eye size={14} className="text-foreground" />
          </button>
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}
          className={`absolute top-3 right-3 p-2 transition-all ${isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <Heart size={15} className={isWishlisted ? "fill-accent text-accent" : "text-foreground fill-transparent"} />
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <button onClick={onView} className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </button>
          <div className="flex items-center gap-1">
            {product.originalPrice && (
              <span className="font-mono text-xs text-muted-foreground line-through">£{product.originalPrice}</span>
            )}
            <span className={`font-mono text-sm font-medium ${product.originalPrice ? "text-red-400" : "text-foreground"}`}>
              £{product.price}
            </span>
          </div>
        </div>
        <StarRating rating={product.rating} count={product.reviews} />
        {/* Color swatches */}
        <div className="flex items-center gap-1.5">
          {product.colors.map(c => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              style={{ backgroundColor: c }}
              className={`w-3.5 h-3.5 transition-all ${selectedColor === c ? "ring-1 ring-offset-1 ring-offset-background ring-accent" : ""}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
