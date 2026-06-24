"use client";

import { createContext, useContext, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocation } from "@/context/LocationContext";

const AppContext = createContext();

export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([1, 3]);
  
  // Pull location data from LocationContext
  const location = useLocation();

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const setPage = (pageName) => {
    if (pageName === "home") {
      router.push("/");
    } else {
      router.push(`/${pageName}`);
    }
  };

  let page = pathname === "/" ? "home" : pathname.replace("/", "");

  const value = {
    page,
    setPage,
    cart,
    setCart,
    wishlist,
    toggleWishlist,
    // Location data from LocationContext (spread for convenience)
    userCountry: location.countryCode,
    setUserCountry: location.setManualCountry,
    warehouseId: location.warehouseId,
    currency: location.currency,
    currencySymbol: location.currencySymbol,
    canPurchase: location.canPurchase,
    isThirdCountry: location.isThirdCountry,
    formatPrice: location.formatPrice,
    locationLoading: location.isLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
