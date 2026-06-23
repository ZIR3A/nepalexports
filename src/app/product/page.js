"use client";
import ProductDetailPage from "@/components/pages/ProductDetailPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <ProductDetailPage {...props} />;
}
