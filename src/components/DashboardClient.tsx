"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RoomRow = {
  roomId: number;
  number: string;
  floor: string | null;
  capacity: number;
  occupied: number;
  vacant: number;
};

type DashboardData = {
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    perRoom: RoomRow[];
  };
  forecast: {
    targetDate: string;
    projectedVacantBeds: number;
    projectedVacancyRate: number;
    currentVacantBeds: number;
    additionalExpectedVacancies: { fullName: string; room?: string; bed?: string; expectedCheckoutDate: string }[];
  };
  timeline: { fullName: string; expectedCheckoutDate: string; room?: string; bed?: string }[];
  pendingRegistrations: number;
  dues: {
    pendingCount: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
    ebDueCount: number;
    ebDueAmount: number;
    ebDuePersonCount: number;
    roomDueCount: number;
    roomDueAmount: number;
    roomDuePersonCount: number;
  };
};

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${tone || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function defaultTargetDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function groupByFloor(rooms: RoomRow[]): [string, RoomRow[]][] {
  const groups = new Map<string, RoomRow[]>();
  for (const room of rooms) {
    const key = room.floor || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(room);
  }
  return Array.from(groups.entries());
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [targetDate, setTargetDate] = useState(defaultTargetDate());
  const [loading, setLoading] = useState(true);

  async function load(date: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/dashboard?date=${date}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load(targetDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }
  if (!data) return null;

  const occupancyPct = data.occupancy.totalBeds
    ? Math.round((data.occupancy.occupiedBeds / data.occupancy.totalBeds) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-bold text-maroon mb-4">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Beds" value={data.occupancy.totalBeds} />
          <StatCard label="Occupied Beds" value={data.occupancy.occupiedBeds} sub={`${occupancyPct}% occupancy`} />
          <StatCard label="Vacant Beds Now" value={data.occupancy.vacantBeds} tone="text-green-700" />
          <StatCard
            label="Pending Registrations"
            value={data.pendingRegistrations}
            tone={data.pendingRegistrations > 0 ? "text-amber-600" : undefined}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Payment Dues</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Pending Bills" value={data.dues.pendingCount} />
          <StatCard label="Pending Amount" value={`Rs ${data.dues.pendingAmount.toFixed(2)}`} />
          <StatCard label="Overdue Bills" value={data.dues.overdueCount} tone="text-red-600" />
          <StatCard label="Overdue Amount" value={`Rs ${data.dues.overdueAmount.toFixed(2)}`} tone="text-red-600" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="EB Due"
            value={`Rs ${data.dues.ebDueAmount.toFixed(2)}`}
            tone="text-amber-600"
          />
          <StatCard label="Pending From (EB)" value={data.dues.ebDuePersonCount} tone="text-amber-600" />
          <StatCard
            label="Room Due"
            value={`Rs ${data.dues.roomDueAmount.toFixed(2)}`}
            tone="text-amber-600"
          />
          <StatCard label="Pending From (Room)" value={data.dues.roomDuePersonCount} tone="text-amber-600" />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Overdue = pending past the 5th-of-the-month due date.{" "}
          <Link href="/admin/payments" className="text-maroon underline">
            View & record payments
          </Link>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Vacancy Forecast</h2>
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <label className="text-sm text-gray-600 mr-3">Project vacancy as of:</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => {
              setTargetDate(e.target.value);
              load(e.target.value);
            }}
            className="border border-gray-300 rounded-md px-2 py-1"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <StatCard label="Vacant Now" value={data.forecast.currentVacantBeds} />
            <StatCard label={`Projected Vacant on ${data.forecast.targetDate.slice(0, 10)}`} value={data.forecast.projectedVacantBeds} tone="text-blue-700" />
            <StatCard label="Projected Vacancy Rate" value={`${data.forecast.projectedVacancyRate}%`} tone="text-blue-700" />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Based on active inmates&apos; declared expected checkout dates. Inmates without a declared
            checkout date are assumed to continue staying.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-medium text-gray-700 mb-2">Upcoming Checkouts (next 90 days)</h3>
          {data.timeline.length === 0 ? (
            <p className="text-sm text-gray-400">No expected checkouts in this window.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-1 pr-2">Inmate</th>
                  <th className="py-1 pr-2">Room / Bed</th>
                  <th className="py-1 pr-2">Expected Checkout</th>
                </tr>
              </thead>
              <tbody>
                {data.timeline.map((t, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-1 pr-2">{t.fullName}</td>
                    <td className="py-1 pr-2">{t.room ? `${t.room} / ${t.bed}` : "-"}</td>
                    <td className="py-1 pr-2">{new Date(t.expectedCheckoutDate).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Room Map</h2>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-green-500 inline-block" /> Vacant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-orange-400 inline-block" /> Partially occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-red-500 inline-block" /> Fully occupied
            </span>
          </div>
          {groupByFloor(data.occupancy.perRoom).map(([floor, rooms]) => (
            <div key={floor} className="mb-5 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">{floor}</h3>
              <div className="flex flex-wrap gap-2">
                {rooms.map((r) => {
                  const tone =
                    r.occupied === 0
                      ? "bg-green-500"
                      : r.vacant === 0
                      ? "bg-red-500"
                      : "bg-orange-400";
                  return (
                    <div
                      key={r.roomId}
                      title={`Room ${r.number} - ${r.occupied}/${r.capacity} occupied`}
                      className={`w-16 h-16 rounded-md text-white flex flex-col items-center justify-center ${tone}`}
                    >
                      <span className="font-semibold text-sm leading-tight">{r.number}</span>
                      <span className="text-[10px] leading-tight opacity-90">
                        {r.occupied}/{r.capacity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Room-wise Vacancy</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-3">Room</th>
                <th className="py-2 px-3">Floor</th>
                <th className="py-2 px-3">Capacity</th>
                <th className="py-2 px-3">Occupied</th>
                <th className="py-2 px-3">Vacant</th>
              </tr>
            </thead>
            <tbody>
              {data.occupancy.perRoom.map((r) => (
                <tr key={r.roomId} className="border-b last:border-0">
                  <td className="py-1.5 px-3 font-medium">{r.number}</td>
                  <td className="py-1.5 px-3">{r.floor}</td>
                  <td className="py-1.5 px-3">{r.capacity}</td>
                  <td className="py-1.5 px-3">{r.occupied}</td>
                  <td className={`py-1.5 px-3 ${r.vacant > 0 ? "text-green-700 font-medium" : "text-gray-400"}`}>
                    {r.vacant}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
