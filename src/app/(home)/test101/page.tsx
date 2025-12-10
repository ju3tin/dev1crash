'use client';
import AdminConfigForm from "@/components/AdminConfigForm";
import ClientAdminGuard from "@/components/ClientAdminGuard";

export default function AdminConfigPage() {
  return (
    <ClientAdminGuard>
      <div style={{ padding: "30px" }}>
        <h1>Admin Config</h1>
        <AdminConfigForm />
      </div>
    </ClientAdminGuard>
  );
}
