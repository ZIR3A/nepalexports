"use client";

import { motion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

export default function AppLayout({ children }) {
  const { page, setPage, cart, wishlist } = useAppContext();

  const isFullscreen = page.startsWith("admin") || page === "auth";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {!isFullscreen && (
        <Navbar
          page={page}
          setPage={setPage}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          wishlistCount={wishlist.length}
        />
      )}

        <motion.div
        key={page.startsWith("admin") ? "admin" : page}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>

      {!isFullscreen && <Footer setPage={setPage} />}

      {/* Quick admin access button */}
      <button
        onClick={() => setPage("admin")}
        className="fixed bottom-6 right-6 z-40 bg-card border border-border px-4 py-2 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-accent hover:border-accent/40 transition-all shadow-lg"
      >
        Admin →
      </button>
    </div>
  );
}
