"use client";
import OrderTracking from "@/components/pages/OrderTracking";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <OrderTracking {...props} />;
}
