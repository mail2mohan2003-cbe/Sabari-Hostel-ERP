"use client";

import { useEffect, useState } from "react";

type Registration = {
  id: string;
  fullName: string;
  dob: string;
  mobile: string;
  email: string | null;
  fatherMotherName: string;
  fatherMotherMobile: string;
  permanentAddress: string;
  occupationType: string;
  institutionAddress: string;
  institutionPhone: string | null;
  localGuardianName: string | null;
  localGuardianContact: string | null;
  localGuardianAddress: string | null;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  foodPreference: string;
  addressProof: string;
  idProof: string;
  preferredJoiningDate: string;
  expectedDurationMonths: number | null;
  status: string;
  createdAt: string;
};

type RoomRow = {
  roomId: number;
  number: string;
  capacity: number;
  vacant: number;
  beds: { bedId: number; label: string; occupied: boolean }[];
};

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function ApprovalPanel({
  reg,
  rooms,
  onDone,
}: {
  reg: Registration;
  rooms: RoomRow[];
  onDone: () => void;
}) {
  const [roomId, setRoomId] = useState<number | "">("");
  const [bedId, setBedId] = useState<number | "">("");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [joinDate, setJoinDate] = useState(reg.preferredJoiningDate.slice(0, 10));
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(
    reg.expectedDurationMonths ? addMonths(reg.preferredJoiningDate, reg.expectedDurationMonths) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRooms = rooms.filter((r) => r.vacant > 0);
  const selectedRoom = rooms.find((r) => r.roomId === roomId);
  const availableBeds = selectedRoom?.beds.filter((b) => !b.occupied) || [];

  async function handleApprove() {
    if (!bedId) {
      setError("Please select a room and bed.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedId,
          advanceAmount: Number(advanceAmount) || 0,
          joinDate,
          expectedCheckoutDate: expectedCheckoutDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Approval failed.");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    const reason = window.prompt("Reason for rejection (optional):") || "";
    setSubmitting(true);
    try {
      await fetch(`/api/admin/registrations/${reg.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-50 border-t p-4 text-sm space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <p><b>DOB:</b> {new Date(reg.dob).toLocaleDateString("en-IN")}</p>
        <p><b>Mobile:</b> {reg.mobile}</p>
        <p><b>Email:</b> {reg.email || "-"}</p>
        <p><b>Parent/Guardian:</b> {reg.fatherMotherName} ({reg.fatherMotherMobile})</p>
        <p><b>Occupation:</b> {reg.occupationType}</p>
        <p><b>Food:</b> {reg.foodPreference}</p>
        <p className="col-span-2 md:col-span-3"><b>Permanent Address:</b> {reg.permanentAddress}</p>
        <p className="col-span-2 md:col-span-3"><b>College/Company Address:</b> {reg.institutionAddress}</p>
        <p><b>Local Guardian:</b> {reg.localGuardianName || "-"} {reg.localGuardianContact ? `(${reg.localGuardianContact})` : ""}</p>
        <p><b>Emergency Contact:</b> {reg.emergencyContactName} - {reg.emergencyContactRelation} ({reg.emergencyContactPhone})</p>
        <p><b>Address Proof:</b> {reg.addressProof}</p>
        <p><b>ID Proof:</b> {reg.idProof}</p>
      </div>

      <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Room</span>
          <select
            className="w-full border rounded px-2 py-1"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value ? Number(e.target.value) : "");
              setBedId("");
            }}
          >
            <option value="">Select room</option>
            {availableRooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.number} ({r.vacant} vacant / {r.capacity})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Bed</span>
          <select
            className="w-full border rounded px-2 py-1"
            value={bedId}
            onChange={(e) => setBedId(e.target.value ? Number(e.target.value) : "")}
            disabled={!roomId}
          >
            <option value="">Select bed</option>
            {availableBeds.map((b) => (
              <option key={b.bedId} value={b.bedId}>
                Bed {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Advance Amount (Rs)</span>
          <input
            type="number"
            min={0}
            className="w-full border rounded px-2 py-1"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Date of Joining</span>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Expected Checkout Date (optional)</span>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={expectedCheckoutDate}
            onChange={(e) => setExpectedCheckoutDate(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="bg-maroon text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {submitting ? "Processing..." : "Approve & Allot Bed"}
        </button>
        <button
          onClick={handleReject}
          disabled={submitting}
          className="border border-red-400 text-red-600 px-4 py-2 rounded disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function RegistrationsClient() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [regRes, roomRes] = await Promise.all([
      fetch(`/api/admin/registrations?status=${statusFilter}`),
      fetch(`/api/admin/rooms`),
    ]);
    const regJson = await regRes.json();
    const roomJson = await roomRes.json();
    setRegistrations(regJson.registrations || []);
    setRooms(roomJson.rooms || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-maroon">Registrations</h1>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && registrations.length === 0 && (
        <p className="text-gray-500">No {statusFilter.toLowerCase()} registrations.</p>
      )}

      <div className="space-y-3">
        {registrations.map((reg) => (
          <div key={reg.id} className="bg-white rounded-xl shadow overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
            >
              <div>
                <p className="font-medium">{reg.fullName}</p>
                <p className="text-xs text-gray-500">
                  Applied {new Date(reg.createdAt).toLocaleDateString("en-IN")} - Preferred joining{" "}
                  {new Date(reg.preferredJoiningDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  reg.status === "PENDING"
                    ? "bg-amber-100 text-amber-700"
                    : reg.status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {reg.status}
              </span>
            </button>
            {expandedId === reg.id && reg.status === "PENDING" && (
              <ApprovalPanel
                reg={reg}
                rooms={rooms}
                onDone={() => {
                  setExpandedId(null);
                  load();
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
