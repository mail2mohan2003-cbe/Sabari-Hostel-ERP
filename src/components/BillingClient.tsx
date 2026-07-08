"use client";

import { useEffect, useState } from "react";

type RoomBilling = {
  roomId: number;
  number: string;
  lastReading: number | null;
  lastReadingDate: string | null;
  activeInmateCount: number;
};

const RATE_PER_UNIT = 14;

export default function BillingClient() {
  const [rooms, setRooms] = useState<RoomBilling[]>([]);
  const [roomId, setRoomId] = useState<number | "">("");
  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/billing");
    const json = await res.json();
    setRooms(json.rooms || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleRoomChange(value: string) {
    const id = value ? Number(value) : "";
    setRoomId(id);
    const room = rooms.find((r) => r.roomId === id);
    setPreviousReading(room?.lastReading != null ? String(room.lastReading) : "");
    setCurrentReading("");
  }

  const prevNum = Number(previousReading);
  const currNum = Number(currentReading);
  const hasValidRange =
    previousReading !== "" && currentReading !== "" && !isNaN(prevNum) && !isNaN(currNum) && currNum >= prevNum;
  const previewUnits = hasValidRange ? currNum - prevNum : null;
  const previewAmount = previewUnits != null ? Math.round(previewUnits * RATE_PER_UNIT * 100) / 100 : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!roomId || previousReading === "" || currentReading === "") {
      setError("Select a room and enter both the previous and current meter reading.");
      return;
    }
    if (!hasValidRange) {
      setError("Current reading cannot be less than the previous reading.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          previousReading: prevNum,
          currentReading: currNum,
          readingDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record reading.");

      if (data.bills.length === 0) {
        setResult(data.note || "Reading recorded. No bill generated.");
      } else {
        setResult(
          `Recorded ${data.unitsConsumed} units (Rs ${data.totalAmount}) - Rs ${data.perHead} per inmate across ${data.bills.length} bill(s), due by the 5th of next month.`
        );
      }
      setPreviousReading("");
      setCurrentReading("");
      setRoomId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record reading.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-maroon mb-4">EB Meter Billing</h1>
      <p className="text-sm text-gray-500 mb-6">
        Rs 14 per unit. Enter the previous and current meter reading for a room - the bill is the
        difference between them, split equally among that room&apos;s currently active inmates, due by
        the 5th of next month.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Room</span>
            <select
              className="w-full border rounded px-2 py-1"
              value={roomId}
              onChange={(e) => handleRoomChange(e.target.value)}
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.number}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Previous Reading</span>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              placeholder="Previous reading"
              value={previousReading}
              onChange={(e) => setPreviousReading(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Current Reading</span>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              placeholder="Current reading"
              value={currentReading}
              onChange={(e) => setCurrentReading(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Reading Date</span>
            <input
              type="date"
              className="w-full border rounded px-2 py-1"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="bg-maroon text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save & Generate Bills"}
          </button>
        </div>

        {previewUnits != null && previewAmount != null && (
          <p className="text-sm text-gray-600 mt-3">
            Units consumed: <span className="font-semibold">{previewUnits}</span> - Total bill:{" "}
            <span className="font-semibold">Rs {previewAmount.toFixed(2)}</span>
            {roomId && (
              <>
                {" "}
                (Rs{" "}
                {(
                  previewAmount /
                  Math.max(1, rooms.find((r) => r.roomId === roomId)?.activeInmateCount || 1)
                ).toFixed(2)}{" "}
                per inmate)
              </>
            )}
          </p>
        )}
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {result && <p className="text-green-700 text-sm mb-4">{result}</p>}

      {loading ? (
        <p className="text-gray-500">Loading rooms...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-3">Room</th>
                <th className="py-2 px-3">Active Inmates</th>
                <th className="py-2 px-3">Last Reading</th>
                <th className="py-2 px-3">Last Reading Date</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.roomId} className="border-b last:border-0">
                  <td className="py-1.5 px-3 font-medium">{r.number}</td>
                  <td className="py-1.5 px-3">{r.activeInmateCount}</td>
                  <td className="py-1.5 px-3">{r.lastReading ?? "-"}</td>
                  <td className="py-1.5 px-3">
                    {r.lastReadingDate ? new Date(r.lastReadingDate).toLocaleDateString("en-IN") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
