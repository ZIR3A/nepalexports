"use client";
import AccountDashboard from "@/components/pages/AccountDashboard";
import { useAppContext } from "@/context/AppContext";
import { RoleGuard } from "@/components/providers/RoleGuard";

export default function Page() {
  const props = useAppContext();
  return (
    <RoleGuard allowedRoles={['user', 'warehouse_manager', 'marketing_admin', 'admin', 'super_admin']} fallbackRoute="/">
      <AccountDashboard {...props} />
    </RoleGuard>
  );
}
