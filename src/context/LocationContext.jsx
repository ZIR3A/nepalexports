"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/utils/currency";

const LocationContext = createContext();

const STORAGE_KEY = "exporthub_user_location";

export function LocationProvider({ children }) {
  const [locationData, setLocationData] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            isLoading: false,
            hasSelected: true,
          };
        } catch (e) {}
      }
    }
    return {
      countryCode: null,
      countryName: null,
      currency: "GBP",
      currencySymbol: "£",
      taxRate: 0,
      isThirdCountry: false,
      thirdCountryMode: null,
      canPurchase: true,
      isLoading: true,
      hasSelected: false,
    };
  });

  const [activeRegions, setActiveRegions] = useState([]);

  useEffect(() => {
    // Fetch active regions globally
    const fetchRegions = async () => {
      try {
        const res = await fetch('/api/regions');
        if (res.ok) {
          const data = await res.json();
          setActiveRegions(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch regions', err);
      }
    };
    fetchRegions();
  }, []);

  // Auto-detect if no choice is saved
  useEffect(() => {
    if (locationData.hasSelected) return;
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      setLocationData(prev => ({ ...prev, isLoading: true }));
      const res = await fetch("/api/geo/detect");
      if (!res.ok) throw new Error("Geo detection failed");
      const data = await res.json();

      setLocationData({
        countryCode: data.countryCode,
        countryName: data.countryName,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        taxRate: data.taxRate || 0,
        isThirdCountry: data.isThirdCountry,
        thirdCountryMode: data.thirdCountryMode,
        canPurchase: data.canPurchase,
        isLoading: false,
        hasSelected: false,
      });
    } catch (err) {
      console.error("Location detection error:", err);
      // Fallback
      setLocationData(prev => ({
        ...prev,
        countryCode: "GB",
        countryName: "United Kingdom",
        currency: "GBP",
        currencySymbol: "£",
        canPurchase: true,
        isThirdCountry: false,
        isLoading: false,
        hasSelected: false,
      }));
    }
  };

  // Allow user to manually set their region
  const setManualRegion = useCallback(async (countryCode) => {
    try {
      setLocationData(prev => ({ ...prev, isLoading: true }));
      
      const res = await fetch(`/api/geo/detect?country=${countryCode}`);
      if (!res.ok) throw new Error("Failed to resolve region");
      const data = await res.json();

      const newData = {
        countryCode: data.countryCode,
        countryName: data.countryName,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        taxRate: data.taxRate || 0,
        isThirdCountry: data.isThirdCountry,
        thirdCountryMode: data.thirdCountryMode,
        canPurchase: data.canPurchase,
        isLoading: false,
        hasSelected: true,
      };

      setLocationData(newData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      window.location.reload();
    } catch (err) {
      console.error("Manual region set error:", err);
      setLocationData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Format a price with the user's currency
  const formatPrice = useCallback((amount) => {
    return formatCurrency(amount, locationData.currency, locationData.currencySymbol);
  }, [locationData.currency, locationData.currencySymbol]);

  const value = {
    ...locationData,
    activeRegions,
    setManualRegion,
    detectLocation,
    formatPrice,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return ctx;
}
