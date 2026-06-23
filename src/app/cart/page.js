"use client";
import CartPage from "@/components/pages/CartPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <CartPage {...props} />;
}
