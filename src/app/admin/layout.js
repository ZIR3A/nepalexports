"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { RoleGuard } from "@/components/providers/RoleGuard";

export default function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'marketing_admin', 'warehouse_manager']} fallbackRoute="/">
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 ml-60 overflow-auto flex flex-col h-screen">
          <AdminTopBar />
          <div className="p-8 flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
