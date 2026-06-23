"use client";
import FlashSalePage from "@/components/pages/FlashSalePage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <FlashSalePage {...props} />;
}
