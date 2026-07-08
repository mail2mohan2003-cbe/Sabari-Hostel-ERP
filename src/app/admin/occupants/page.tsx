import AdminShell from "@/components/AdminShell";
import OccupantsClient from "@/components/OccupantsClient";

export default function OccupantsPage() {
  return (
    <AdminShell active="/admin/occupants">
      <OccupantsClient />
    </AdminShell>
  );
}
