"use client";
import AboutPage from "@/components/pages/AboutPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <AboutPage {...props} />;
}
