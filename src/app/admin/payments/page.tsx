import AdminShell from "@/components/AdminShell";
import PaymentsClient from "@/components/PaymentsClient";

export default function PaymentsPage() {
  return (
    <AdminShell active="/admin/payments">
      <PaymentsClient />
    </AdminShell>
  );
}
