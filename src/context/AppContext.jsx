"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AppContext = createContext();

export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([1, 3]);
  const [userCountry, setUserCountry] = useState("GB");

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
    userCountry,
    setUserCountry,
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
