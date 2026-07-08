"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bill = {
  id: string;
  periodLabel: string;
  amount: number;
  dueDate: string;
  status: string;
  inmate: {
    fullName: string;
    bed: { label: string; room: { number: string } } | null;
  };
  payment: { id: string; receiptNo: string } | null;
};

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
        body: JSON.stringify({
          billId: bill.id,
          amountPaid: Number(amountPaid),
          mode,
          recordedBy,
        }),
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

export default function PaymentsClient() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING_OR_OVERDUE");
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/payments?status=${statusFilter}`);
    const json = await res.json();
    setBills(json.bills || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const statusBadge = (status: string) => {
    const cls =
      status === "PAID"
        ? "bg-green-100 text-green-700"
        : status === "OVERDUE"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";
    return <span className={`text-xs px-2 py-1 rounded-full ${cls}`}>{status}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-maroon">Payments & Dues</h1>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="PENDING_OR_OVERDUE">Pending & Overdue</option>
          <option value="PAID">Paid</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : bills.length === 0 ? (
        <p className="text-gray-500">No bills to show.</p>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">
                    {bill.inmate.fullName}{" "}
                    {bill.inmate.bed && (
                      <span className="text-xs text-gray-400">
                        (Room {bill.inmate.bed.room.number} / Bed {bill.inmate.bed.label})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {bill.periodLabel} - Due {new Date(bill.dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">Rs {bill.amount.toFixed(2)}</p>
                  {statusBadge(bill.status)}
                  {bill.status === "PAID" && bill.payment && (
                    <Link href={`/admin/receipts/${bill.id}`} className="text-maroon underline text-sm">
                      View Receipt
                    </Link>
                  )}
                  {bill.status !== "PAID" && (
                    <button
                      onClick={() => setPayingId(payingId === bill.id ? null : bill.id)}
                      className="text-sm border border-maroon text-maroon rounded px-3 py-1"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
              {payingId === bill.id && bill.status !== "PAID" && (
                <PayForm
                  bill={bill}
                  onDone={() => {
                    setPayingId(null);
                    load();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
