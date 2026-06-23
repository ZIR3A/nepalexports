"use client";
import CheckoutPage from "@/components/pages/CheckoutPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <CheckoutPage {...props} />;
}
