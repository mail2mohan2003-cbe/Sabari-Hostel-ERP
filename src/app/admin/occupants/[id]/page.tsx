import AdminShell from "@/components/AdminShell";
import OccupantDetailClient from "@/components/OccupantDetailClient";

export default async function OccupantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AdminShell active="/admin/occupants">
      <OccupantDetailClient inmateId={id} />
    </AdminShell>
  );
}
