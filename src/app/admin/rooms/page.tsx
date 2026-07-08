import AdminShell from "@/components/AdminShell";
import RoomsClient from "@/components/RoomsClient";

export default function RoomsPage() {
  return (
    <AdminShell active="/admin/rooms">
      <RoomsClient />
    </AdminShell>
  );
}
