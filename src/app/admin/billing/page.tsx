import AdminShell from "@/components/AdminShell";
import BillingClient from "@/components/BillingClient";

export default function BillingPage() {
  return (
    <AdminShell active="/admin/billing">
      <BillingClient />
    </AdminShell>
  );
}
