import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle, Truck, AlertCircle, Loader2, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/context/AppContext";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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
  const { data: session, update } = useSession();
  const { userCountry } = useAppContext();
  const isKycPending = session?.user?.kycStatus === "PENDING";

  // State A: Start at step 1 for KYC, State B: Skip Contact Info if Completed (maybe start at Shipping or Payment)
  // We'll keep standard steps but inject KYC fields into Information/Shipping if pending
  const [step, setStep] = useState(isKycPending ? 1 : 2);
  
  const [email, setEmail] = useState(session?.user?.email || "");
  const [firstName, setFirstName] = useState(session?.user?.firstName || "");
  const [lastName, setLastName] = useState(session?.user?.lastName || "");
  const [address, setAddress] = useState(session?.user?.address?.street || "");
  const [city, setCity] = useState(session?.user?.address?.city || "");
  const [country, setCountry] = useState(session?.user?.address?.country || userCountry || "GB");
  const [payment, setPayment] = useState("card");

  // KYC specific state
  const [phone, setPhone] = useState(session?.user?.phoneNumber || "");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isLocating, setIsLocating] = useState(false);

  // Dynamic Regions
  const [regions, setRegions] = useState([]);

  // Fetch Regions
  useEffect(() => {
    fetch('/api/regions')
      .then(res => res.json())
      .then(data => setRegions(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch regions", err));
  }, []);

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
    
    // Prepare kycData if pending
    const kycData = isKycPending ? {
      phone,
      coordinates,
      firstName,
      lastName,
      address: {
        street: address,
        city,
        country
      }
    } : null;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kycData,
          items: validationData.items,
          customerDetails: { email, firstName, lastName },
          shippingAddress: { address, city, country },
          billing: {
            currency: validationData.currency,
            subtotal: validationData.subtotal,
            shippingCost: validationData.shippingCost,
            taxAmount: validationData.taxAmount,
            importFees: validationData.importFees || 0,
            total: validationData.total
          },
          paymentMethod: payment,
          warehouses: validationData.warehouseIds || [validationData.warehouseId].filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      
      setOrderId(data.orderNumber);
      setCart([]); // Clear cart
      if (isKycPending) {
        await update(); // Update session to reflect COMPLETED kycStatus
      }
      setStep(4);
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchCoordinates = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        alert("Failed to fetch coordinates. Please enable location services.");
        setIsLocating(false);
      }
    );
  };

  const formatMoney = (amount) => {
    if (!validationData) return `£${amount.toFixed(2)}`;
    const cur = validationData.currency;
    const symbol = cur === "NPR" ? "रु" : cur === "USD" ? "$" : cur === "EUR" ? "€" : "£";
    return cur === "NPR" ? `${symbol}${amount.toFixed(0)}` : `${symbol}${amount.toFixed(2)}`;
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
                    {isKycPending && (
                      <div className="mt-4 p-4 border border-amber-500/30 bg-amber-500/5 rounded-md">
                        <h4 className="text-sm font-medium mb-4 text-amber-600">Action Required: KYC Verification</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Verified Phone Number</label>
                            <PhoneInput
                              international
                              defaultCountry="GB"
                              value={phone}
                              onChange={setPhone}
                              className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus-within:border-accent/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Exact Delivery Coordinates</label>
                            <div className="flex gap-2">
                              <InputField 
                                label="" 
                                value={coordinates.lat && coordinates.lng ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : ""} 
                                onChange={() => {}} 
                                placeholder="Click to fetch coordinates ->" 
                              />
                              <Button type="button" variant="outline" onClick={handleFetchCoordinates} disabled={isLocating}>
                                {isLocating ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                        {regions.map(r => (
                          <option key={r.countryCode} value={r.countryCode}>{r.countryName}</option>
                        ))}
                        {regions.length === 0 && <option value="GB">United Kingdom</option>}
                      </select>
                      {country !== userCountry && userCountry && (
                        <div className="mt-2 p-3 border border-amber-500/50 bg-amber-500/10 text-amber-600 text-xs flex items-center gap-2">
                          <AlertCircle size={14} />
                          Notice: Your selected shipping country ({country}) differs from your physical region ({userCountry}). 
                        </div>
                      )}
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
              <div className="space-y-6">
                {/* Local Items */}
                {(() => {
                  const itemsToRender = validationData ? validationData.items : cart;
                  const localItems = itemsToRender.filter(i => i.fulfillmentStatus !== 'AVAILABLE_VIA_IMPORT');
                  const importItems = itemsToRender.filter(i => i.fulfillmentStatus === 'AVAILABLE_VIA_IMPORT');

                  return (
                    <>
                      {localItems.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                            <Truck size={14} className="text-emerald-600" /> Local Delivery
                          </h4>
                          {localItems.map((item, i) => (
                            <div key={`local-${i}`} className="flex gap-3">
                              <div className="relative shrink-0">
                                {item.image || (item.images && item.images[0]) ? (
                                  <img src={item.image || item.images[0]} alt={item.name} className="w-14 object-cover bg-muted" style={{ height: "4.5rem" }} />
                                ) : (
                                  <div className="w-14 bg-muted flex items-center justify-center border border-border" style={{ height: "4.5rem" }}>
                                    <span className="font-mono text-[8px] text-muted-foreground uppercase text-center break-words px-1">Drape</span>
                                  </div>
                                )}
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
                      )}

                      {/* Import Items */}
                      {importItems.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-border">
                          <h4 className="text-xs font-medium text-amber-600/90 mb-2 flex items-center gap-2">
                            <AlertCircle size={14} /> Cross-Border Import
                          </h4>
                          {importItems.map((item, i) => (
                            <div key={`import-${i}`} className="flex gap-3 opacity-90">
                              <div className="relative shrink-0">
                                {item.image || (item.images && item.images[0]) ? (
                                  <img src={item.image || item.images[0]} alt={item.name} className="w-14 object-cover bg-muted" style={{ height: "4.5rem" }} />
                                ) : (
                                  <div className="w-14 bg-muted flex items-center justify-center border border-border" style={{ height: "4.5rem" }}>
                                    <span className="font-mono text-[8px] text-muted-foreground uppercase text-center break-words px-1">Drape</span>
                                  </div>
                                )}
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600/90 text-background font-mono text-[9px] flex items-center justify-center">
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
                      )}
                    </>
                  );
                })()}
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
                  <span className="text-muted-foreground">Tax {validationData && validationData.taxRate > 0 ? `(${validationData.taxRate}%)` : ""}</span>
                  <span className="font-mono">{validationData ? formatMoney(validationData.taxAmount) : "—"}</span>
                </div>
                {validationData?.importFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-600/90 font-medium text-xs self-center">Import Surcharge</span>
                    <span className="font-mono text-amber-600/90">{formatMoney(validationData.importFees)}</span>
                  </div>
                )}
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
