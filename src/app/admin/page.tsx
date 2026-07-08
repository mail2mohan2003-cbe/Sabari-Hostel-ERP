import AdminShell from "@/components/AdminShell";
import DashboardClient from "@/components/DashboardClient";

export default function AdminDashboardPage() {
  return (
    <AdminShell active="/admin">
      <DashboardClient />
    </AdminShell>
  );
}
