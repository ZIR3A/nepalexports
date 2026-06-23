import { useState, useEffect } from "react";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export default function CartPage({ setPage, cart, setCart }) {
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  
  const [validationData, setValidationData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [stockErrors, setStockErrors] = useState([]);

  useEffect(() => {
    if (cart.length > 0) {
      const validateCart = async () => {
        setIsValidating(true);
        setValidationError(null);
        setStockErrors([]);
        try {
          // Validate against GB by default to check generic stock levels
          const res = await fetch("/api/checkout/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cart, country: "GB" })
          });
          const data = await res.json();
          if (!res.ok) {
            if (data.details) setStockErrors(data.details);
            else throw new Error(data.error || "Validation failed");
          } else {
            setValidationData(data);
          }
        } catch (err) {
          setValidationError(err.message);
        } finally {
          setIsValidating(false);
        }
      };
      // Debounce validation slightly
      const timeout = setTimeout(validateCart, 500);
      return () => clearTimeout(timeout);
    } else {
      setValidationData(null);
      setStockErrors([]);
    }
  }, [cart]);

  const updateQty = (id, color, size, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(i => !(i.id === id && i.selectedColor === color && i.selectedSize === size)));
    } else {
      setCart(cart.map(i =>
        i.id === id && i.selectedColor === color && i.selectedSize === size ? { ...i, quantity: qty } : i
      ));
    }
  };

  const discount = couponApplied && validationData ? validationData.subtotal * 0.15 : 0;
  const total = validationData ? validationData.total - discount : 0;

  if (cart.length === 0) {
    return (
      <div className="pt-[72px] min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingBag size={64} className="text-border" />
        <h2 className="font-display text-4xl font-light">Your cart is empty</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Looks like you haven&apos;t added anything yet. Explore our collection to find something you love.
        </p>
        <Button variant="default" size="lg" onClick={() => setPage("shop")}>
          Start Shopping <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="font-display text-4xl font-light">Shopping Cart ({cart.length})</h1>
          {isValidating && <Loader2 className="animate-spin text-muted-foreground" size={20} />}
        </div>

        {stockErrors.length > 0 && (
          <div className="mb-8 p-4 border border-red-500/50 bg-red-500/10 text-red-500 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle size={18} /> Some items in your cart have issues:
            </div>
            <ul className="list-disc list-inside text-sm pl-2">
              {stockErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {validationError && (
          <div className="mb-8 p-4 border border-red-500/50 bg-red-500/10 text-red-500 flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm">{validationError}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-0 border-t border-border">
            {cart.map((item, i) => (
              <div key={i} className="flex gap-6 py-6 border-b border-border">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 object-cover bg-muted shrink-0 cursor-pointer"
                  onClick={() => setPage("product")}
                  style={{ height: "7.5rem" }}
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="font-medium text-foreground cursor-pointer hover:text-accent transition-colors"
                        onClick={() => setPage("product")}
                      >
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div style={{ backgroundColor: item.selectedColor }} className="w-3 h-3 border border-border" />
                        <span className="font-mono text-[11px] text-muted-foreground">Size: {item.selectedSize}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateQty(item.id, item.selectedColor, item.selectedSize, 0)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => updateQty(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        disabled={isValidating}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        disabled={isValidating}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-mono text-lg font-medium text-foreground">
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card border border-border p-8 h-fit sticky top-24">
            <h2 className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-6">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">{validationData ? `£${validationData.subtotal.toFixed(2)}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-mono text-foreground">{validationData ? (validationData.shippingCost === 0 ? "Free" : `£${validationData.shippingCost.toFixed(2)}`) : "—"}</span>
              </div>
              {couponApplied && validationData && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount (LAUNCH15)</span>
                  <span className="font-mono">-£{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>VAT</span>
                <span className="font-mono">{validationData ? `£${validationData.taxAmount.toFixed(2)}` : "—"}</span>
              </div>
            </div>

            <div className="border-t border-border mt-4 pt-4 flex justify-between">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-mono text-xl font-medium text-foreground">{validationData ? `£${total.toFixed(2)}` : "—"}</span>
            </div>

            {/* Coupon */}
            <div className="mt-6 flex gap-2">
              <input
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 bg-muted border border-border px-3 py-2 text-sm outline-none focus:border-accent/50"
              />
              <button
                onClick={() => { if (coupon.toUpperCase() === "LAUNCH15") setCouponApplied(true); }}
                className="px-4 py-2 border border-border text-sm hover:border-foreground/30 transition-colors"
              >
                Apply
              </button>
            </div>

            <Button 
              variant="default" 
              size="lg" 
              className="mt-6 w-full" 
              onClick={() => setPage("checkout")}
              disabled={stockErrors.length > 0 || validationError || isValidating || !validationData}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Button>

            <button
              onClick={() => setPage("shop")}
              className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>

            <div className="flex items-center justify-center gap-4 mt-6">
              {["visa", "mastercard", "paypal", "apple-pay"].map(p => (
                <div key={p} className="w-10 h-6 bg-muted border border-border flex items-center justify-center">
                  <span className="font-mono text-[7px] text-muted-foreground uppercase">{p.slice(0, 4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
