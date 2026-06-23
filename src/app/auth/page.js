"use client";
import AuthPage from "@/components/pages/AuthPage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <AuthPage {...props} />;
}
