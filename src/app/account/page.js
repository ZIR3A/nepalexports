"use client";
import AccountDashboard from "@/components/pages/AccountDashboard";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <AccountDashboard {...props} />;
}
