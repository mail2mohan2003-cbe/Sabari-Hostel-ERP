"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bill = {
  id: string;
  type: string;
  periodLabel: string;
  unitsConsumed: number | null;
  ratePerUnit: number | null;
  amount: number;
  dueDate: string;
  status: string;
  payment: { id: string; receiptNo: string; amountPaid: number; paidOn: string; mode: string } | null;
};

type Inmate = {
  id: string;
  fullName: string;
  dob: string;
  mobile: string;
  email: string | null;
  fatherMotherName: string;
  fatherMotherMobile: string;
  permanentAddress: string;
  foodPreference: string;
  advanceAmount: number;
  joinDate: string;
  expectedCheckoutDate: string | null;
  actualCheckoutDate: string | null;
  status: string;
  bedId: number | null;
  bed: { label: string; room: { number: string } } | null;
  registration: {
    occupationType: string;
    institutionAddress: string;
    institutionPhone: string | null;
    localGuardianName: string | null;
    localGuardianContact: string | null;
    localGuardianAddress: string | null;
    emergencyContactName: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
    addressProof: string;
    idProof: string;
    preferredJoiningDate: string;
    expectedDurationMonths: number | null;
  } | null;
  bills: Bill[];
};

type RoomOption = {
  roomId: number;
  number: string;
  beds: { bedId: number; label: string; occupied: boolean }[];
};

function stayDuration(joinDate: string, until?: string | null) {
  const end = until ? new Date(until).getTime() : Date.now();
  const days = Math.max(0, Math.floor((end - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24)));
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  return `${months} month${months === 1 ? "" : "s"}${remDays ? ` ${remDays}d` : ""}`;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "-";
}

function StayEditPanel({
  inmate,
  rooms,
  onDone,
  onCancel,
}: {
  inmate: Inmate;
  rooms: RoomOption[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [bedId, setBedId] = useState(inmate.bedId ?? 0);
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(
    inmate.expectedCheckoutDate ? inmate.expectedCheckoutDate.slice(0, 10) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bedOptions = rooms.flatMap((room) =>
    room.beds
      .filter((bed) => !bed.occupied || bed.bedId === inmate.bedId)
      .map((bed) => ({
        bedId: bed.bedId,
        label: `${room.number} - Bed ${bed.label}${bed.bedId === inmate.bedId ? " (current)" : ""}`,
      }))
  );

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inmates/${inmate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedId: bedId !== inmate.bedId ? bedId : undefined,
          expectedCheckoutDate: expectedCheckoutDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t pt-3 space-y-3 max-w-sm">
      <label className="block">
        <span className="block text-xs text-gray-500 mb-1">Room / Bed</span>
        <select
          className="w-full border rounded px-2 py-1 text-sm"
          value={bedId}
          onChange={(e) => setBedId(Number(e.target.value))}
        >
          {bedOptions.map((opt) => (
            <option key={opt.bedId} value={opt.bedId}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs text-gray-500 mb-1">Tentative Exit Date</span>
        <input
          type="date"
          className="w-full border rounded px-2 py-1 text-sm"
          value={expectedCheckoutDate}
          onChange={(e) => setExpectedCheckoutDate(e.target.value)}
        />
      </label>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="text-xs bg-maroon text-white px-3 py-1.5 rounded disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} className="text-xs border px-3 py-1.5 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

function PayForm({ bill, onDone }: { bill: Bill; onDone: () => void }) {
  const [amountPaid, setAmountPaid] = useState(String(bill.amount));
  const [mode, setMode] = useState("CASH");
  const [recordedBy, setRecordedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: bill.id, amountPaid: Number(amountPaid), mode, recordedBy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 mt-2">
      <label className="block">
        <span className="block text-xs text-gray-500">Amount Paid</span>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="block text-xs text-gray-500">Mode</span>
        <select className="border rounded px-2 py-1" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label className="block">
        <span className="block text-xs text-gray-500">Recorded By</span>
        <input
          className="border rounded px-2 py-1"
          value={recordedBy}
          onChange={(e) => setRecordedBy(e.target.value)}
        />
      </label>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-maroon text-white px-3 py-1.5 rounded text-sm disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Confirm Payment"}
      </button>
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  );
}

export default function OccupantDetailClient({ inmateId }: { inmateId: string }) {
  const [inmate, setInmate] = useState<Inmate | null>(null);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStay, setEditingStay] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [inmateRes, roomsRes] = await Promise.all([
      fetch(`/api/admin/inmates/${inmateId}`),
      fetch(`/api/admin/rooms`),
    ]);
    const inmateJson = await inmateRes.json();
    const roomsJson = await roomsRes.json();
    setInmate(inmateJson.inmate || null);
    setRooms(roomsJson.rooms || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inmateId]);

  async function handleCheckout() {
    if (!inmate || !window.confirm("Mark this inmate as checked out and free the bed?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/inmates/${inmate.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutDate: new Date().toISOString().slice(0, 10) }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!inmate) return <p className="text-gray-500">Occupant not found.</p>;

  const reg = inmate.registration;
  const outstandingBills = inmate.bills.filter((b) => b.status !== "PAID");
  const paidBills = inmate.bills.filter((b) => b.status === "PAID");
  const ebDueTotal = outstandingBills
    .filter((b) => b.type === "ELECTRICITY")
    .reduce((s, b) => s + b.amount, 0);
  const roomDueTotal = outstandingBills
    .filter((b) => b.type !== "ELECTRICITY")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <Link href="/admin/occupants" className="text-maroon underline text-sm">
        &larr; Back to Occupants
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-2 mt-3 mb-6">
        <h1 className="text-xl font-bold text-maroon">{inmate.fullName}</h1>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              inmate.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
            }`}
          >
            {inmate.status}
          </span>
          {inmate.status === "ACTIVE" && (
            <button
              onClick={handleCheckout}
              disabled={busy}
              className="text-xs border border-red-400 text-red-600 rounded px-3 py-1.5 disabled:opacity-50"
            >
              Check out
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Stay & Room</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p className="text-gray-500">Room / Bed</p>
            <p>{inmate.bed ? `${inmate.bed.room.number} / ${inmate.bed.label}` : "-"}</p>
            <p className="text-gray-500">Joined</p>
            <p>{fmtDate(inmate.joinDate)}</p>
            <p className="text-gray-500">Staying For</p>
            <p>{stayDuration(inmate.joinDate, inmate.actualCheckoutDate)}</p>
            <p className="text-gray-500">Tentative / Actual Exit</p>
            <p>
              {inmate.actualCheckoutDate
                ? `Checked out ${fmtDate(inmate.actualCheckoutDate)}`
                : inmate.expectedCheckoutDate
                ? fmtDate(inmate.expectedCheckoutDate)
                : "Not set"}
            </p>
            <p className="text-gray-500">Advance Paid</p>
            <p>Rs {inmate.advanceAmount.toFixed(2)}</p>
          </div>
          {inmate.status === "ACTIVE" && (
            <>
              <button
                onClick={() => setEditingStay(!editingStay)}
                className="text-xs text-maroon underline mt-3"
              >
                {editingStay ? "Close" : "Edit room / exit date"}
              </button>
              {editingStay && (
                <StayEditPanel
                  inmate={inmate}
                  rooms={rooms}
                  onCancel={() => setEditingStay(false)}
                  onDone={() => {
                    setEditingStay(false);
                    load();
                  }}
                />
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Registration Details</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p className="text-gray-500">Date of Birth</p>
            <p>{fmtDate(inmate.dob)}</p>
            <p className="text-gray-500">Mobile</p>
            <p>{inmate.mobile}</p>
            <p className="text-gray-500">Email</p>
            <p>{inmate.email || "-"}</p>
            <p className="text-gray-500">Parent/Guardian</p>
            <p>
              {inmate.fatherMotherName} ({inmate.fatherMotherMobile})
            </p>
            <p className="text-gray-500">Food Preference</p>
            <p>{inmate.foodPreference}</p>
            <p className="text-gray-500 col-span-2 mt-1">Permanent Address</p>
            <p className="col-span-2">{inmate.permanentAddress}</p>
            {reg && (
              <>
                <p className="text-gray-500">Occupation</p>
                <p>{reg.occupationType}</p>
                <p className="text-gray-500 col-span-2 mt-1">College / Company Address</p>
                <p className="col-span-2">
                  {reg.institutionAddress}
                  {reg.institutionPhone ? ` - ${reg.institutionPhone}` : ""}
                </p>
                <p className="text-gray-500">Local Guardian</p>
                <p>
                  {reg.localGuardianName || "-"}
                  {reg.localGuardianContact ? ` (${reg.localGuardianContact})` : ""}
                </p>
                <p className="text-gray-500">Emergency Contact</p>
                <p>
                  {reg.emergencyContactName} - {reg.emergencyContactRelation} ({reg.emergencyContactPhone})
                </p>
                <p className="text-gray-500">Address Proof</p>
                <p>{reg.addressProof}</p>
                <p className="text-gray-500">ID Proof</p>
                <p>{reg.idProof}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mt-6">
        <h2 className="font-semibold text-gray-800 mb-3">Payment Dues & History</h2>

        <div className="grid grid-cols-2 gap-3 mb-4 max-w-sm">
          <div className={`rounded-lg p-3 ${ebDueTotal > 0 ? "bg-amber-50" : "bg-green-50"}`}>
            <p className="text-xs text-gray-500">EB Due</p>
            <p className={`font-semibold ${ebDueTotal > 0 ? "text-amber-700" : "text-green-700"}`}>
              Rs {ebDueTotal.toFixed(2)}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${roomDueTotal > 0 ? "bg-amber-50" : "bg-green-50"}`}>
            <p className="text-xs text-gray-500">Room Due</p>
            <p className={`font-semibold ${roomDueTotal > 0 ? "text-amber-700" : "text-green-700"}`}>
              Rs {roomDueTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {inmate.bills.length === 0 ? (
          <p className="text-sm text-gray-500">No bills raised yet.</p>
        ) : (
          <div className="space-y-3">
            {outstandingBills.map((bill) => (
              <div key={bill.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {bill.periodLabel}{" "}
                      <span className="text-xs text-gray-400 font-normal">
                        ({bill.type === "ELECTRICITY" ? "EB" : "Room"})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">Due {fmtDate(bill.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">Rs {bill.amount.toFixed(2)}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        bill.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {bill.status}
                    </span>
                    <button
                      onClick={() => setPayingBillId(payingBillId === bill.id ? null : bill.id)}
                      className="text-sm border border-maroon text-maroon rounded px-3 py-1"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
                {payingBillId === bill.id && (
                  <PayForm
                    bill={bill}
                    onDone={() => {
                      setPayingBillId(null);
                      load();
                    }}
                  />
                )}
              </div>
            ))}

            {paidBills.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mt-4 mb-2">Paid</h3>
                {paidBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3 mb-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{bill.periodLabel}</p>
                      <p className="text-xs text-gray-500">
                        Paid {bill.payment ? fmtDate(bill.payment.paidOn) : "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">Rs {bill.amount.toFixed(2)}</span>
                      {bill.payment && (
                        <Link href={`/admin/receipts/${bill.id}`} className="text-maroon underline text-sm">
                          View Receipt
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
