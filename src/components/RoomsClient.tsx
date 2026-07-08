"use client";

import { useEffect, useState } from "react";

type Bed = {
  bedId: number;
  label: string;
  occupied: boolean;
  inmate: {
    id: string;
    fullName: string;
    mobile: string;
    joinDate: string;
    expectedCheckoutDate: string | null;
  } | null;
};

type Room = {
  roomId: number;
  number: string;
  floor: string | null;
  capacity: number;
  occupied: number;
  vacant: number;
  beds: Bed[];
};

function EditInmatePanel({
  inmateId,
  currentBedId,
  currentExpectedCheckoutDate,
  rooms,
  onDone,
  onCancel,
}: {
  inmateId: string;
  currentBedId: number;
  currentExpectedCheckoutDate: string | null;
  rooms: Room[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [bedId, setBedId] = useState(currentBedId);
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(
    currentExpectedCheckoutDate ? currentExpectedCheckoutDate.slice(0, 10) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A bed is selectable if it's vacant, or if it's this inmate's own current bed.
  const bedOptions = rooms.flatMap((room) =>
    room.beds
      .filter((bed) => !bed.occupied || bed.bedId === currentBedId)
      .map((bed) => ({
        bedId: bed.bedId,
        label: `${room.number} - Bed ${bed.label}${bed.bedId === currentBedId ? " (current)" : ""}`,
      }))
  );

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inmates/${inmateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedId: bedId !== currentBedId ? bedId : undefined,
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
    <div className="mt-2 border-t pt-2 space-y-2">
      <label className="block">
        <span className="block text-xs text-gray-500">Room / Bed</span>
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
        <span className="block text-xs text-gray-500">Tentative Exit / Checkout Date</span>
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

export default function RoomsClient() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyBed, setBusyBed] = useState<number | null>(null);
  const [editingInmateId, setEditingInmateId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/rooms");
    const json = await res.json();
    setRooms(json.rooms || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCheckout(inmateId: string, bedId: number) {
    if (!window.confirm("Mark this inmate as checked out and free the bed?")) return;
    setBusyBed(bedId);
    try {
      await fetch(`/api/admin/inmates/${inmateId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutDate: new Date().toISOString().slice(0, 10) }),
      });
      await load();
    } finally {
      setBusyBed(null);
    }
  }

  if (loading) return <p className="text-gray-500">Loading rooms...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-maroon">Rooms & Inmates</h1>
        <p className="text-xs text-gray-500">
          Use &quot;Edit&quot; on an inmate to transfer their room or set/update their tentative exit
          date - this feeds the dashboard&apos;s vacancy forecast.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div key={room.roomId} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Room {room.number} <span className="text-xs text-gray-400">({room.floor})</span>
              </h3>
              <span className="text-xs text-gray-500">
                {room.occupied}/{room.capacity} occupied
              </span>
            </div>
            <div className="space-y-2">
              {room.beds.map((bed) => (
                <div
                  key={bed.bedId}
                  className={`rounded-md p-2 text-sm border ${
                    bed.occupied ? "border-gray-200 bg-gray-50" : "border-dashed border-green-300 bg-green-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Bed {bed.label}</span>
                    {!bed.occupied && <span className="text-green-700 text-xs">Vacant</span>}
                  </div>
                  {bed.inmate && (
                    <div className="mt-1 text-gray-600">
                      <p>{bed.inmate.fullName} - {bed.inmate.mobile}</p>
                      <p className="text-xs text-gray-400">
                        Joined {new Date(bed.inmate.joinDate).toLocaleDateString("en-IN")}
                        {bed.inmate.expectedCheckoutDate
                          ? ` - Expected checkout ${new Date(bed.inmate.expectedCheckoutDate).toLocaleDateString("en-IN")}`
                          : " - No expected checkout date set"}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={() =>
                            setEditingInmateId(editingInmateId === bed.inmate!.id ? null : bed.inmate!.id)
                          }
                          className="text-xs text-maroon underline"
                        >
                          {editingInmateId === bed.inmate.id ? "Close" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleCheckout(bed.inmate!.id, bed.bedId)}
                          disabled={busyBed === bed.bedId}
                          className="text-xs text-red-600 underline disabled:opacity-50"
                        >
                          {busyBed === bed.bedId ? "Processing..." : "Check out"}
                        </button>
                      </div>
                      {editingInmateId === bed.inmate.id && (
                        <EditInmatePanel
                          inmateId={bed.inmate.id}
                          currentBedId={bed.bedId}
                          currentExpectedCheckoutDate={bed.inmate.expectedCheckoutDate}
                          rooms={rooms}
                          onCancel={() => setEditingInmateId(null)}
                          onDone={() => {
                            setEditingInmateId(null);
                            load();
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
