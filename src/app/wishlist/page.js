"use client";
import WishlistPage from "@/components/pages/WishlistPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <WishlistPage {...props} />;
}
