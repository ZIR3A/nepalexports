import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle, Truck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50 transition-colors"
      />
    </div>
  );
}

export default function CheckoutPage({ setPage, cart, setCart }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("GB");
  const [payment, setPayment] = useState("card");

  // Dynamic Validation State
  const [validationData, setValidationData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const steps = ["Information", "Shipping", "Payment", "Confirmation"];

  // Effect to validate cart whenever country changes or we reach shipping step
  useEffect(() => {
    if (step >= 2) {
      const validateCart = async () => {
        setIsValidating(true);
        setValidationError(null);
        try {
          const res = await fetch("/api/checkout/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cart, country })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Validation failed");
          setValidationData(data);
        } catch (err) {
          setValidationError(err.message);
          setValidationData(null);
        } finally {
          setIsValidating(false);
        }
      };
      validateCart();
    }
  }, [step, country, cart]);

  const handleCheckout = async () => {
    if (!validationData) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validationData.items,
          customerDetails: { email, firstName, lastName },
          shippingAddress: { address, city, country },
          billing: {
            currency: validationData.currency,
            subtotal: validationData.subtotal,
            shippingCost: validationData.shippingCost,
            taxAmount: validationData.taxAmount,
            total: validationData.total
          },
          paymentMethod: payment,
          warehouseId: validationData.warehouseId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      
      setOrderId(data.orderNumber);
      setCart([]); // Clear cart
      setStep(4);
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount) => {
    if (!validationData) return `£${amount.toFixed(2)}`;
    return validationData.currency === "NPR" ? `रु${amount.toFixed(0)}` : `£${amount.toFixed(2)}`;
  };

  if (step === 4) {
    return (
      <div className="pt-[72px] min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-24 h-24 bg-emerald-700/20 border border-emerald-700/40 flex items-center justify-center"
        >
          <CheckCircle size={40} className="text-emerald-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-5xl font-light mb-4">Order Confirmed!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Thank you for your order. We&apos;ve sent a confirmation to your email.
            Your order number is <span className="font-mono text-accent">#{orderId}</span>.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button variant="default" size="lg" onClick={() => setPage("tracking")}>
              Track Order <Truck size={16} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => setPage("home")}>
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-12">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 flex items-center justify-center font-mono text-xs border transition-all ${
                  i + 1 < step ? "bg-emerald-700 border-emerald-700 text-white" :
                  i + 1 === step ? "bg-foreground border-foreground text-background" :
                  "border-border text-muted-foreground"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${
                  i + 1 === step ? "text-foreground" : "text-muted-foreground"
                }`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-20 h-px mx-2 mb-5 transition-colors ${i + 1 < step ? "bg-emerald-700" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {validationError && (
          <div className="mb-8 p-4 border border-red-500/50 bg-red-500/10 text-red-500 flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm">{validationError}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-3xl font-light mb-8">Contact Information</h2>
                  <div className="bg-muted border border-border p-4 mb-6 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Already have an account?</span>
                    <button onClick={() => setPage("auth")} className="text-sm text-accent hover:underline">Sign In</button>
                  </div>
                  <div className="space-y-4">
                    <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="First Name" value={firstName} onChange={setFirstName} placeholder="John" />
                      <InputField label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="ship" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-3xl font-light mb-8">Shipping Address</h2>
                  <div className="space-y-4">
                    <InputField label="Address" value={address} onChange={setAddress} placeholder="123 Oxford Street" />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="City" value={city} onChange={setCity} placeholder="London" />
                      <InputField label="Postcode" value="" onChange={() => {}} placeholder="SW1A 1AA" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Country</label>
                      <select
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none"
                      >
                        <option value="GB">United Kingdom</option>
                        <option value="NP">Nepal</option>
                        <option value="US">United States</option>
                        <option value="EU">European Union</option>
                      </select>
                    </div>
                    {isValidating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
                        <Loader2 size={14} className="animate-spin" /> Recalculating shipping and taxes...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-3xl font-light mb-8">Payment</h2>
                  <div className="space-y-3 mb-6">
                    {country === "NP" ? (
                      <>
                        <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${payment === "esewa" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/30"}`}>
                          <input type="radio" name="payment" value="esewa" checked={payment === "esewa"} onChange={() => setPayment("esewa")} className="accent-accent" />
                          <div>
                            <p className="text-sm font-medium text-foreground">eSewa</p>
                            <p className="font-mono text-[11px] text-muted-foreground">Pay via eSewa mobile wallet</p>
                          </div>
                        </label>
                        <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${payment === "khalti" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/30"}`}>
                          <input type="radio" name="payment" value="khalti" checked={payment === "khalti"} onChange={() => setPayment("khalti")} className="accent-accent" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Khalti</p>
                            <p className="font-mono text-[11px] text-muted-foreground">Pay via Khalti digital wallet</p>
                          </div>
                        </label>
                      </>
                    ) : (
                      <>
                        <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${payment === "card" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/30"}`}>
                          <input type="radio" name="payment" value="card" checked={payment === "card"} onChange={() => setPayment("card")} className="accent-accent" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Credit / Debit Card</p>
                            <p className="font-mono text-[11px] text-muted-foreground">Visa, Mastercard, Amex via Stripe</p>
                          </div>
                        </label>
                        <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${payment === "paypal" ? "border-accent bg-accent/5" : "border-border hover:border-foreground/30"}`}>
                          <input type="radio" name="payment" value="paypal" checked={payment === "paypal"} onChange={() => setPayment("paypal")} className="accent-accent" />
                          <div>
                            <p className="text-sm font-medium text-foreground">PayPal</p>
                            <p className="font-mono text-[11px] text-muted-foreground">Fast & secure</p>
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                  {payment === "card" && (
                    <div className="space-y-4 border border-border p-6">
                      <InputField label="Card Number" value="" onChange={() => {}} placeholder="4242 4242 4242 4242" />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Expiry" value="" onChange={() => {}} placeholder="MM / YY" />
                        <InputField label="CVC" value="" onChange={() => {}} placeholder="123" />
                      </div>
                      <InputField label="Cardholder Name" value="" onChange={() => {}} placeholder="John Doe" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={isValidating || isSubmitting}>Back</Button>
              )}
              <Button
                variant="default"
                size="lg"
                className="flex-1"
                disabled={isValidating || isSubmitting || validationError}
                onClick={() => { 
                  if (step < 3) setStep(step + 1); 
                  else handleCheckout(); 
                }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : step === 3 ? "Place Order" : "Continue"} 
                {!isSubmitting && <ArrowRight size={16} />}
              </Button>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border p-6 sticky top-24">
              <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Order Summary</h3>
              <div className="space-y-3">
                {(validationData ? validationData.items : cart).map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-14 object-cover bg-muted" style={{ height: "4.5rem" }} />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground text-background font-mono text-[9px] flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-foreground">{item.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{item.selectedSize}</p>
                      </div>
                      <span className="font-mono text-sm text-foreground">{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{validationData ? formatMoney(validationData.subtotal) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">{validationData ? formatMoney(validationData.shippingCost) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">{validationData ? formatMoney(validationData.taxAmount) : "—"}</span>
                </div>
                <div className="flex justify-between font-medium text-base border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span className="font-mono text-accent">{validationData ? formatMoney(validationData.total) : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
