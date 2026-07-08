import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOverdueBills } from "@/lib/billing";

// List occupants. Defaults to currently active inmates; pass ?status=ALL to
// include checked-out inmates too.
export async function GET(req: NextRequest) {
  await markOverdueBills();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ACTIVE";

  const inmates = await prisma.inmate.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { fullName: "asc" },
    include: {
      bed: { include: { room: true } },
      bills: true,
    },
  });

  const result = inmates.map((inmate) => {
    const outstanding = inmate.bills.filter((b) => b.status === "PENDING" || b.status === "OVERDUE");
    const ebOutstanding = outstanding.filter((b) => b.type === "ELECTRICITY");
    const roomOutstanding = outstanding.filter((b) => b.type !== "ELECTRICITY");
    const overdue = inmate.bills.filter((b) => b.status === "OVERDUE");
    return {
      id: inmate.id,
      fullName: inmate.fullName,
      mobile: inmate.mobile,
      status: inmate.status,
      joinDate: inmate.joinDate,
      expectedCheckoutDate: inmate.expectedCheckoutDate,
      actualCheckoutDate: inmate.actualCheckoutDate,
      room: inmate.bed?.room.number ?? null,
      bed: inmate.bed?.label ?? null,
      duesCount: outstanding.length,
      duesAmount: outstanding.reduce((s, b) => s + b.amount, 0),
      ebDuesCount: ebOutstanding.length,
      ebDuesAmount: ebOutstanding.reduce((s, b) => s + b.amount, 0),
      roomDuesCount: roomOutstanding.length,
      roomDuesAmount: roomOutstanding.reduce((s, b) => s + b.amount, 0),
      hasOverdue: overdue.length > 0,
    };
  });

  return NextResponse.json({ inmates: result });
}
