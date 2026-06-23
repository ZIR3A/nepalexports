"use client";
import AdminDashboard from "@/components/pages/AdminDashboard";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <AdminDashboard {...props} />;
}
