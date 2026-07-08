"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Occupant = {
  id: string;
  fullName: string;
  mobile: string;
  status: string;
  joinDate: string;
  expectedCheckoutDate: string | null;
  actualCheckoutDate: string | null;
  room: string | null;
  bed: string | null;
  duesCount: number;
  duesAmount: number;
  ebDuesCount: number;
  ebDuesAmount: number;
  roomDuesCount: number;
  roomDuesAmount: number;
  hasOverdue: boolean;
};

function stayDuration(joinDate: string, until: string | null) {
  const end = until ? new Date(until).getTime() : Date.now();
  const days = Math.max(0, Math.floor((end - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24)));
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  return `${months} month${months === 1 ? "" : "s"}${remDays ? ` ${remDays}d` : ""}`;
}

export default function OccupantsClient() {
  const router = useRouter();
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/inmates?status=${statusFilter}`);
      const json = await res.json();
      setOccupants(json.inmates || []);
      setLoading(false);
    })();
  }, [statusFilter]);

  const filtered = occupants.filter(
    (o) =>
      o.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.mobile.includes(search) ||
      (o.room || "").includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold text-maroon">Occupants</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ACTIVE">Current occupants</option>
            <option value="CHECKED_OUT">Checked out</option>
            <option value="ALL">All (current + checked out)</option>
          </select>
          <input
            placeholder="Search by name, mobile, or room..."
            className="border rounded px-3 py-1.5 text-sm w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No occupants found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Room / Bed</th>
                <th className="py-2 px-3">Joined</th>
                <th className="py-2 px-3">Stayed For</th>
                <th className="py-2 px-3">Tentative / Actual Exit</th>
                <th className="py-2 px-3">EB Due</th>
                <th className="py-2 px-3">Room Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/admin/occupants/${o.id}`)}
                  className="border-b last:border-0 cursor-pointer hover:bg-gray-50"
                >
                  <td className="py-2 px-3 font-medium">{o.fullName}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        o.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {o.status === "ACTIVE" ? "Active" : "Checked out"}
                    </span>
                  </td>
                  <td className="py-2 px-3">{o.room ? `${o.room} / ${o.bed}` : "-"}</td>
                  <td className="py-2 px-3">{new Date(o.joinDate).toLocaleDateString("en-IN")}</td>
                  <td className="py-2 px-3">{stayDuration(o.joinDate, o.actualCheckoutDate)}</td>
                  <td className="py-2 px-3">
                    {o.actualCheckoutDate
                      ? new Date(o.actualCheckoutDate).toLocaleDateString("en-IN")
                      : o.expectedCheckoutDate
                      ? new Date(o.expectedCheckoutDate).toLocaleDateString("en-IN")
                      : "Not set"}
                  </td>
                  <td className="py-2 px-3">
                    {o.ebDuesCount === 0 ? (
                      <span className="text-green-700 text-xs">No dues</span>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          o.hasOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        Rs {o.ebDuesAmount.toFixed(2)} ({o.ebDuesCount})
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {o.roomDuesCount === 0 ? (
                      <span className="text-green-700 text-xs">No dues</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        Rs {o.roomDuesAmount.toFixed(2)} ({o.roomDuesCount})
                      </span>
                    )}
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
