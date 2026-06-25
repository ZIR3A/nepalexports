"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

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
      warehouseId: null,
      warehouseName: null,
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

  // Auto-detect if no choice is saved
  useEffect(() => {
    if (locationData.hasSelected) return;

    // Auto-detect via IP geolocation
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
        warehouseId: data.warehouseId,
        warehouseName: data.warehouseName,
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
      // Default to GB if detection fails
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

  // Allow user to manually set their country
  const setManualCountry = useCallback(async (countryCode) => {
    try {
      setLocationData(prev => ({ ...prev, isLoading: true }));
      
      // Call the geo API with the manual country to get warehouse assignment
      // We pass it as a query param so the server can resolve the right warehouse
      const res = await fetch(`/api/geo/detect?country=${countryCode}`);
      if (!res.ok) throw new Error("Failed to resolve country");
      const data = await res.json();

      const newData = {
        countryCode: data.countryCode,
        countryName: data.countryName,
        warehouseId: data.warehouseId,
        warehouseName: data.warehouseName,
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

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      
      // Force a hard reload to ensure all app states, carts, and catalogs reset cleanly for the new region
      window.location.reload();
    } catch (err) {
      console.error("Manual country set error:", err);
      setLocationData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Format a price with the user's currency
  const formatPrice = useCallback((amount) => {
    if (!amount && amount !== 0) return "";
    const { currency, currencySymbol } = locationData;
    if (currency === "NPR") {
      return `${currencySymbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${currencySymbol}${Number(amount).toFixed(2)}`;
  }, [locationData.currency, locationData.currencySymbol]);

  const value = {
    ...locationData,
    setManualCountry,
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
