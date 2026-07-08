import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOccupancy, getForecast, getUpcomingCheckoutTimeline } from "@/lib/forecast";
import { markOverdueBills } from "@/lib/billing";

export async function GET(req: NextRequest) {
  await markOverdueBills();

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam
    ? new Date(dateParam)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d;
      })();

  const [occupancy, forecast, timeline, pendingRegistrations, pendingBills, overdueBills] =
    await Promise.all([
      getCurrentOccupancy(),
      getForecast(targetDate),
      getUpcomingCheckoutTimeline(90),
      prisma.registrationRequest.count({ where: { status: "PENDING" } }),
      prisma.bill.findMany({ where: { status: "PENDING" } }),
      prisma.bill.findMany({ where: { status: "OVERDUE" } }),
    ]);

  const outstandingBills = [...pendingBills, ...overdueBills];
  const pendingAmount = pendingBills.reduce((s, b) => s + b.amount, 0);
  const overdueAmount = overdueBills.reduce((s, b) => s + b.amount, 0);

  const ebOutstanding = outstandingBills.filter((b) => b.type === "ELECTRICITY");
  const roomOutstanding = outstandingBills.filter((b) => b.type !== "ELECTRICITY");

  const ebDuePersonCount = new Set(ebOutstanding.map((b) => b.inmateId)).size;
  const roomDuePersonCount = new Set(roomOutstanding.map((b) => b.inmateId)).size;

  return NextResponse.json({
    occupancy,
    forecast,
    timeline,
    pendingRegistrations,
    dues: {
      pendingCount: pendingBills.length,
      pendingAmount,
      overdueCount: overdueBills.length,
      overdueAmount,
      ebDueCount: ebOutstanding.length,
      ebDueAmount: ebOutstanding.reduce((s, b) => s + b.amount, 0),
      ebDuePersonCount,
      roomDueCount: roomOutstanding.length,
      roomDueAmount: roomOutstanding.reduce((s, b) => s + b.amount, 0),
      roomDuePersonCount,
    },
  });
}
