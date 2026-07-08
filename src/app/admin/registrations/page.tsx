import AdminShell from "@/components/AdminShell";
import RegistrationsClient from "@/components/RegistrationsClient";

export default function RegistrationsPage() {
  return (
    <AdminShell active="/admin/registrations">
      <RegistrationsClient />
    </AdminShell>
  );
}
