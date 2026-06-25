"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocation } from "@/context/LocationContext";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const AppContext = createContext();

export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  const [cart, setCartState] = useState([]);
  const [isCartInitialized, setIsCartInitialized] = useState(false);
  const [wishlist, setWishlist] = useState([1, 3]);
  
  // Pull location data from LocationContext
  const location = useLocation();

  // Initialize cart from local storage and DB
  useEffect(() => {
    const initCart = async () => {
      if (status === 'loading') return;
      
      let initialCart = [];
      
      // Fast hydration from local storage
      const localCart = localStorage.getItem('hybrid_cart');
      if (localCart) {
        try { initialCart = JSON.parse(localCart); } catch (e) {}
      }

      if (session?.user) {
        // Fetch from DB
        try {
          const res = await fetch('/api/cart');
          if (res.ok) {
            const dbCart = await res.json();
            if (Array.isArray(dbCart) && dbCart.length > 0) {
              initialCart = dbCart;
            }
          }
        } catch (err) {
          console.error("Failed to sync cart from DB", err);
        }
      } else {
        // No guest checkout/cart allowed per rules
        initialCart = [];
        localStorage.removeItem('hybrid_cart');
      }

      setCartState(initialCart);
      setIsCartInitialized(true);
    };
    initCart();
  }, [session, status]);

  // Flash Sale Background Listener
  useEffect(() => {
    if (!isCartInitialized || cart.length === 0) return;

    const interval = setInterval(() => {
      let changed = false;
      const now = new Date();
      
      const newCart = cart.map(item => {
        if (item.flashSale?.isActive && item.flashSale?.expiresAt) {
          const expiry = new Date(item.flashSale.expiresAt);
          if (now > expiry) {
            changed = true;
            // Flash sale expired, revert price
            return {
              ...item,
              price: item.originalPrice || item.basePrice,
              flashSale: null
            };
          }
        }
        return item;
      });

      if (changed) {
        setCart(newCart);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cart, isCartInitialized]);

  const setCart = (newCart) => {
    const resolvedCart = typeof newCart === 'function' ? newCart(cart) : newCart;
    setCartState(resolvedCart);
    
    // Save to local storage for fast hydration
    localStorage.setItem('hybrid_cart', JSON.stringify(resolvedCart));
    
    // Debounce DB sync
    if (session?.user) {
      if (window.cartSyncTimeout) clearTimeout(window.cartSyncTimeout);
      window.cartSyncTimeout = setTimeout(() => {
        fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resolvedCart)
        }).catch(err => console.error("Failed to sync cart to DB", err));
      }, 1000);
    }
  };

  const removeFromCart = async (id, color, size) => {
    const itemToRemove = cart.find(i => i.id === id && i.selectedColor === color && i.selectedSize === size);
    if (!itemToRemove) return;

    const previousCart = [...cart];
    
    // Optimistic UI update
    const newCart = cart.filter(i => !(i.id === id && i.selectedColor === color && i.selectedSize === size));
    setCartState(newCart);
    localStorage.setItem('hybrid_cart', JSON.stringify(newCart));

    if (session?.user) {
      try {
        const res = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, color, size })
        });
        if (!res.ok) throw new Error("Failed to delete item from database");
      } catch (err) {
        console.error(err);
        // Revert Optimistic Update
        setCartState(previousCart);
        localStorage.setItem('hybrid_cart', JSON.stringify(previousCart));
        toast.error("Failed to remove item from cart. Please try again.");
      }
    }
  };

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
    removeFromCart,
    wishlist,
    toggleWishlist,
    // Location data from LocationContext (spread for convenience)
    userCountry: location.countryCode,
    setUserCountry: location.setManualRegion,
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
