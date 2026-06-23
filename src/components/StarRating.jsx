import { Star } from "lucide-react";

export default function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={11} className={i <= Math.round(rating) ? "fill-accent text-accent" : "text-border fill-transparent"} />
        ))}
      </div>
      {count !== undefined && (
        <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
      )}
    </div>
  );
}
