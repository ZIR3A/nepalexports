"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChevronDown, Check, Globe } from "lucide-react";
import { useLocation } from "@/context/LocationContext";

const COUNTRIES = [
  { code: "NP", name: "Nepal", flag: "🇳🇵", currency: "NPR", symbol: "रु" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£" },
];

const OTHER_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
];

/**
 * First-visit modal that asks the user to select their shopping location.
 */
export function LocationModal() {
  const { hasSelected, isLoading, setManualCountry } = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [showOthers, setShowOthers] = useState(false);

  // Don't show if already selected or still loading
  if (hasSelected || isLoading || !isOpen) return null;

  const handleSelect = async (code) => {
    await setManualCountry(code);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border rounded-lg p-8 max-w-md w-full shadow-2xl"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-accent" />
            </div>
          </div>

          {/* Header */}
          <h2 className="font-display text-2xl text-center font-light text-foreground mb-2">
            Where are you shopping from?
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            We&apos;ll show you products available in your region with local pricing.
          </p>

          {/* Primary country options */}
          <div className="space-y-3 mb-4">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => handleSelect(c.code)}
                className="w-full flex items-center gap-4 p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-accent/5 transition-all group"
              >
                <span className="text-2xl">{c.flag}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {c.symbol} {c.currency}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
              </button>
            ))}
          </div>

          {/* Other countries */}
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Shopping from elsewhere?</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOthers ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showOthers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {OTHER_COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => handleSelect(c.code)}
                      className="flex items-center gap-2 p-3 border border-border rounded-md hover:border-accent/50 hover:bg-accent/5 transition-all text-sm"
                    >
                      <span>{c.flag}</span>
                      <span className="text-muted-foreground truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-3 font-mono">
                  International orders are fulfilled from our UK warehouse
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact location indicator for the Navbar.
 * Shows current country flag + currency, click to change.
 */
export function LocationIndicator() {
  const { countryCode, currency, currencySymbol, isLoading, setManualCountry, canPurchase, isThirdCountry } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const currentCountry = [...COUNTRIES, ...OTHER_COUNTRIES].find(c => c.code === countryCode);
  const flag = currentCountry?.flag || "🌐";

  const handleSelect = async (code) => {
    await setManualCountry(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-md hover:border-accent/30 transition-colors text-sm"
        aria-label="Change shopping region"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-accent rounded-full animate-spin" />
        ) : (
          <>
            <span className="text-base">{flag}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{currency}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-xl p-3 min-w-[220px]"
            >
              <p className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-2 mb-2">
                Shopping Region
              </p>
              <div className="space-y-1">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                      countryCode === c.code 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-sm flex-1 text-left">{c.name}</span>
                    {countryCode === c.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
                
                <div className="border-t border-border my-1.5" />
                
                {OTHER_COUNTRIES.slice(0, 3).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      countryCode === c.code 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-xs flex-1 text-left">{c.name}</span>
                    {countryCode === c.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              {isThirdCountry && !canPurchase && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-600">
                  Browsing only — purchasing unavailable in your region
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
