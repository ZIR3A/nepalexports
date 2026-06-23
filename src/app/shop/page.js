"use client";
import ShopPage from "@/components/pages/ShopPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <ShopPage {...props} />;
}
