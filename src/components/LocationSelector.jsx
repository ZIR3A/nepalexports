"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChevronDown, Check, Globe } from "lucide-react";
import { useLocation } from "@/context/LocationContext";

// Removing static lists since we fetch dynamic activeRegions

/**
 * Helper to get a flag emoji based on country code
 */
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

/**
 * First-visit modal that asks the user to select their shopping location.
 */
export function LocationModal() {
  const { hasSelected, isLoading, setManualRegion, activeRegions } = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  // Don't show if already selected or still loading
  if (hasSelected || isLoading || !isOpen) return null;

  const handleSelect = async (countryCode) => {
    await setManualRegion(countryCode);
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

          {/* Primary region options */}
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
            {activeRegions?.length > 0 ? (
              activeRegions.map((r) => (
                <button
                  key={r.countryCode}
                  onClick={() => handleSelect(r.countryCode)}
                  className="w-full flex items-center gap-4 p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-accent/5 transition-all group"
                >
                  <span className="text-2xl">{getFlagEmoji(r.countryCode || 'GB')}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {r.countryName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {r.currency}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                </button>
              ))
            ) : (
              <div className="text-center p-4 text-muted-foreground text-sm border border-border border-dashed rounded-lg">
                No regions available.
              </div>
            )}
          </div>
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
  const { countryCode, currency, isLoading, setManualRegion, activeRegions, canPurchase, isThirdCountry } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const flag = getFlagEmoji(countryCode || 'GB');

  const handleSelect = async (code) => {
    await setManualRegion(code);
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
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {activeRegions?.length > 0 ? (
                  activeRegions.map((r) => (
                    <button
                      key={r.countryCode}
                      onClick={() => handleSelect(r.countryCode)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                        countryCode === r.countryCode 
                          ? "bg-accent/10 text-accent" 
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-xl leading-none">{getFlagEmoji(r.countryCode || 'GB')}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{r.countryName}</p>
                        <p className="text-[10px] font-mono opacity-70">{r.currency}</p>
                      </div>
                      {countryCode === r.countryCode && <Check className="w-4 h-4" />}
                    </button>
                  ))
                ) : (
                  <div className="text-center p-3 text-muted-foreground text-xs">
                    No regions available.
                  </div>
                )}
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
