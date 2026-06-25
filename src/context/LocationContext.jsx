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

  const [activeWarehouses, setActiveWarehouses] = useState([]);

  useEffect(() => {
    // Fetch active warehouses globally
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/warehouses');
        if (res.ok) {
          const data = await res.json();
          setActiveWarehouses(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch warehouses', err);
      }
    };
    fetchWarehouses();
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

  // Allow user to manually set their warehouse
  const setManualWarehouse = useCallback(async (warehouseId) => {
    try {
      setLocationData(prev => ({ ...prev, isLoading: true }));
      
      // We pass the warehouse ID to the backend detection route (or a new assignment route)
      // to resolve the exact details for this user now shopping from this warehouse
      const res = await fetch(`/api/geo/detect?warehouseId=${warehouseId}`);
      if (!res.ok) throw new Error("Failed to resolve warehouse");
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      window.location.reload();
    } catch (err) {
      console.error("Manual warehouse set error:", err);
      setLocationData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Format a price with the user's currency
  const formatPrice = useCallback((amount) => {
    return formatCurrency(amount, locationData.currency, locationData.currencySymbol);
  }, [locationData.currency, locationData.currencySymbol]);

  const value = {
    ...locationData,
    activeWarehouses,
    setManualWarehouse,
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
