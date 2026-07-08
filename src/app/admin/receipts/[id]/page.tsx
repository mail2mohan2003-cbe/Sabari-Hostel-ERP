import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      payment: true,
      inmate: { include: { bed: { include: { room: true } } } },
    },
  });

  if (!bill || !bill.payment) {
    notFound();
  }

  const b = bill!;
  const payment = b.payment!;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="no-print max-w-2xl mx-auto mb-4 flex justify-between">
        <Link href="/admin/payments" className="text-maroon underline text-sm">
          &larr; Back to Payments
        </Link>
        <PrintButton />
      </div>

      <div className="max-w-2xl mx-auto bg-white shadow rounded-xl p-10 border">
        <div className="text-center border-b border-maroon pb-4 mb-6">
          <h1 className="text-2xl font-bold text-maroon">SRI SABARI LADIES HOSTEL</h1>
          <p className="text-xs italic text-gray-500">A Right Place for Ladies Hostel and Paying Guests</p>
          <p className="text-xs text-gray-500">
            88-90, Sri Sabari Towers, 9th Street Extension, Gandhipuram, Coimbatore - 641 012
          </p>
          <p className="text-xs text-gray-500">Contact: 94437 66661 & 97891 56616</p>
          <h2 className="mt-3 font-semibold tracking-wide">PAYMENT RECEIPT</h2>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
          <p><b>Receipt No:</b> {payment.receiptNo}</p>
          <p className="text-right"><b>Date:</b> {new Date(payment.paidOn).toLocaleDateString("en-IN")}</p>
          <p><b>Inmate:</b> {b.inmate.fullName}</p>
          <p className="text-right">
            <b>Room / Bed:</b> {b.inmate.bed ? `${b.inmate.bed.room.number} / ${b.inmate.bed.label}` : "-"}
          </p>
          <p><b>Bill Type:</b> {b.type}</p>
          <p className="text-right"><b>Period:</b> {b.periodLabel}</p>
          {b.unitsConsumed != null && (
            <>
              <p><b>Units Consumed:</b> {b.unitsConsumed}</p>
              <p className="text-right"><b>Rate:</b> Rs {b.ratePerUnit} / unit</p>
            </>
          )}
          <p><b>Payment Mode:</b> {payment.mode}</p>
          <p className="text-right"><b>Due Date:</b> {new Date(b.dueDate).toLocaleDateString("en-IN")}</p>
        </div>

        <div className="border-t border-b py-4 flex justify-between items-center mb-8">
          <span className="font-medium">Amount Received</span>
          <span className="text-xl font-bold text-maroon">Rs {payment.amountPaid.toFixed(2)}</span>
        </div>

        <p className="text-sm text-gray-600 mb-10">Received with thanks.</p>

        <div className="flex justify-between text-sm">
          <span>Recorded by: {payment.recordedBy || "Hostel Office"}</span>
          <span>Authorized Signature</span>
        </div>
      </div>
    </div>
  );
}
